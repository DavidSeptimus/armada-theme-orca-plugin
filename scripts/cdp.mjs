// A minimal Chrome DevTools Protocol client for driving the Orca window,
// over Node's built-in WebSocket. No dependencies.
import { writeFile } from "node:fs/promises";

export async function connect(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === "page" && target.url.includes("renderer/index.html"));
  if (!page) throw new Error(`No Orca window on debugging port ${port}`);

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  // Runs an expression in the page and returns its value. Promises are awaited.
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitFor = async (expression, what = expression, timeout = 20000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const value = await evaluate(expression).catch(() => null);
      if (value) return value;
      await sleep(150);
    }
    throw new Error(`Timed out waiting for ${what}`);
  };

  const click = async (x, y) => {
    const point = { x, y, button: "left", clickCount: 1 };
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point });
  };

  // The center of the first element the expression returns, or null
  const centerOf = (expression) =>
    evaluate(`(() => {
      const element = ${expression};
      if (!element) return null;
      element.scrollIntoView({ block: "center", inline: "center" });
      const box = element.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    })()`);

  const waitForCenter = async (expression, what) => {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const center = await centerOf(expression).catch(() => null);
      if (center) return center;
      await sleep(150);
    }
    throw new Error(`Timed out waiting for ${what}`);
  };

  const key = async (keyName, { modifiers = 0, code = keyName, text } = {}) => {
    const base = { key: keyName, code, modifiers };
    await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", ...base, text });
    await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  };

  const drag = async (from, to) => {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...from });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...from, button: "left", clickCount: 1 });
    for (let step = 1; step <= 8; step++) {
      const point = { x: from.x + ((to.x - from.x) * step) / 8, y: from.y + ((to.y - from.y) * step) / 8 };
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point, button: "left", buttons: 1 });
      await sleep(30);
    }
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...to, button: "left", clickCount: 1 });
  };

  const type = (text) => send("Input.insertText", { text });

  const setViewport = (width, height, deviceScaleFactor = 2) =>
    send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor, mobile: false });

  const screenshot = async (path) => {
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(path, Buffer.from(data, "base64"));
  };

  return {
    send,
    evaluate,
    sleep,
    waitFor,
    click,
    centerOf,
    drag,
    clickOn: (expression, what = expression) =>
      waitForCenter(expression, what).then(({ x, y }) => click(x, y)),
    key,
    type,
    setViewport,
    screenshot,
    close: () => socket.close(),
  };
}
