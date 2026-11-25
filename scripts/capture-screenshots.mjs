// Captures the screenshots under screenshots/ from a second, hidden copy of Orca.
//
// That copy runs on a throwaway profile with its own home folder, so it shares nothing with the
// Orca you work in, and its window is never shown. The profile switch (ORCA_E2E_USER_DATA_DIR) is
// the one Orca's own end-to-end tests use. It is not a documented option, so an Orca update may
// break this script; nothing else in the plugin depends on it.
//
//   npm run screenshots [-- dark|light]
//
// Armada's pictures go to screenshots/ and Armada Light's to screenshots/light/, under the same
// names. Each theme gets a second Orca of its own, started from an empty profile, so the two sets
// show the same window. With a name, only that theme is captured.
//
// macOS only. Needs Orca installed, and git.
import { spawn, execFileSync } from "node:child_process";
import { chmod, cp, mkdir, readFile, rm, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir, hostname } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./cdp.mjs";

const pluginDir = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotsDir = join(pluginDir, "screenshots");

const appDir = process.env.ORCA_APP ?? "/Applications/Orca.app";
const appBinary = join(appDir, "Contents/MacOS/Orca");
const cliBinary = join(appDir, "Contents/Resources/bin/orca");

// Kept outside the plugin folder: installing the plugin copies the whole folder
const workDir = join(homedir(), ".cache/armada-orca-capture");
const profileDir = join(workDir, "profile");
const profileHome = join(profileDir, "home");
const binDir = join(workDir, "bin");
// The sample project's path shows in the editor's breadcrumb, so it is one without a user name
const projectDir = process.env.CAPTURE_PROJECT_DIR ?? "/Users/Shared/harbor";
const projectMarker = join(workDir, "project-path");

const debugPort = Number(process.env.CAPTURE_DEBUG_PORT ?? 9333);
const width = 1600;
const height = 1000;
const scale = 2;

const manifest = JSON.parse(await readFile(join(pluginDir, "orca-plugin.json"), "utf8"));
const pluginKey = `${manifest.publisher}.${manifest.id}`;
// Orca has a slot for a light theme and one for a dark theme, and paints the one for its mode
const VARIANTS = {
  dark: { id: "armada-dark", outDir: screenshotsDir, slot: "Dark" },
  light: { id: "armada-light", outDir: join(screenshotsDir, "light"), slot: "Light" },
};
const requested = [...new Set(process.argv.slice(2))];
for (const name of requested) {
  if (!Object.hasOwn(VARIANTS, name)) throw new Error(`No theme named ${name}. Name dark or light, or neither for both.`);
}
// CAPTURE_KEEP leaves the second Orca up after a theme, so there is no starting one for the next
if (process.env.CAPTURE_KEEP && requested.length !== 1) {
  throw new Error("CAPTURE_KEEP keeps one theme's Orca up. Name dark or light.");
}
const variants = (requested.length > 0 ? requested : Object.keys(VARIANTS)).map((name) => ({ name, ...VARIANTS[name] }));
for (const { id } of variants) {
  for (const kind of ["themes", "terminalThemes"]) {
    if (!manifest.contributes[kind].some((theme) => theme.id === id)) {
      throw new Error(`orca-plugin.json has no ${id} under ${kind}. Run npm run build first.`);
    }
  }
}

// Nothing of the caller's environment reaches the second Orca: run from an Orca terminal, this
// process carries variables that point at the Orca it runs in
const cleanEnv = {
  // binDir first: the chat screenshot's stand-in for the claude command is there
  PATH: binDir + ":/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin",
  HOME: profileHome,
  USER: process.env.USER ?? "",
  LANG: "en_US.UTF-8",
  TMPDIR: process.env.TMPDIR ?? "/tmp",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function orca(...args) {
  const out = execFileSync(cliBinary, [...args, "--json"], {
    env: { ...cleanEnv, ORCA_USER_DATA_PATH: profileDir },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const reply = JSON.parse(out);
  if (!reply.ok) throw new Error(`orca ${args.join(" ")}: ${reply.error?.message}`);
  return reply.result;
}

function git(...args) {
  // A throwaway repository: its own identity, and no signing, whatever the machine's git is set to
  const identity = ["-c", "user.name=Harbor", "-c", "user.email=harbor@example.com", "-c", "commit.gpgsign=false"];
  return execFileSync("git", [...identity, ...args], { cwd: projectDir, env: cleanEnv, encoding: "utf8" });
}

// The second Orca's main process is told apart by its debugging port, and every process it
// started by the profile's path in the command line
const processPatterns = [`${appBinary} --remote-debugging-port=${debugPort}`, profileDir];

function matchingProcesses(pattern) {
  try {
    return execFileSync("pgrep", ["-f", pattern], { encoding: "utf8" }).trim().split("\n");
  } catch {
    return []; // pgrep exits 1 when nothing matched
  }
}

async function stopOrca() {
  for (const signal of ["TERM", "KILL"]) {
    for (const pattern of processPatterns) {
      for (const pid of matchingProcesses(pattern)) {
        try {
          process.kill(Number(pid), `SIG${signal}`);
        } catch {
          // Already gone
        }
      }
    }
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (processPatterns.every((pattern) => matchingProcesses(pattern).length === 0)) return;
      await sleep(250);
    }
  }
}

async function makeSampleProject() {
  const recorded = existsSync(projectMarker) ? (await readFile(projectMarker, "utf8")).trim() : null;
  if (existsSync(projectDir) && recorded !== projectDir) {
    throw new Error(`${projectDir} exists and this script did not make it. Set CAPTURE_PROJECT_DIR to another path.`);
  }
  await rm(projectDir, { recursive: true, force: true });
  await cp(join(pluginDir, "scripts/sample-project"), projectDir, { recursive: true });
  await writeFile(projectMarker, projectDir);

  git("init", "-q", "-b", "main");
  git("add", ".");
  git("commit", "-q", "-m", "Book the smallest free berth");

  // Changes after the commit, for the file tree's git colors and the diff
  await writeFile(join(projectDir, "src/config.ts"), 'export const API_URL = "/api/vessels";\n');
  const schedule = join(projectDir, "src/schedule.ts");
  const source = await readFile(schedule, "utf8");
  await writeFile(
    schedule,
    source
      .replace("const TURNAROUND_HOURS = 6;", "const TURNAROUND_HOURS = 8;")
      .replace(
        "    if (berth === undefined) return null;\n",
        "    if (berth === undefined) {\n      console.warn(`No berth for ${vessel.name}`);\n      return null;\n    }\n",
      ),
  );
  await appendFile(join(projectDir, "README.md"), "- [ ] Night arrivals\n");
}

async function launchOrca() {
  await stopOrca();
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  await mkdir(profileHome, { recursive: true });

  const child = spawn(
    appBinary,
    // The mock keychain: the throwaway home has no keychain, and macOS would ask about that on screen
    [`--remote-debugging-port=${debugPort}`, "--use-mock-keychain"],
    {
      env: {
        ...cleanEnv,
        ORCA_E2E_USER_DATA_DIR: profileDir,
        ORCA_E2E_HEADLESS: "1",
        // Without it this launch would hand over to the Orca already running and exit
        ORCA_BYPASS_SINGLE_INSTANCE_LOCK: "1",
      },
      cwd: workDir,
      detached: true,
      stdio: "ignore",
    },
  );
  child.unref();

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    await sleep(500);
    try {
      const page = await connect(debugPort);
      await page.waitFor("!!window.api?.settings", "Orca's window");
      orca("status");
      return page;
    } catch {
      // Not up yet
    }
  }
  throw new Error("The second Orca did not start within a minute");
}

const elementWithText = (text) =>
  `[...document.querySelectorAll("button,[role=button],span,div")]
    .filter((element) => element.children.length === 0 || element.tagName === "BUTTON")
    .find((element) => element.innerText?.trim() === ${JSON.stringify(text)})`;

async function prepareWindow(page, variant) {
  const themeId = `plugin:${pluginKey}/${variant.id}`;
  await page.evaluate(`window.api.settings.set(${JSON.stringify({
    theme: variant.name,
    [`pluginAppTheme${variant.slot}`]: themeId,
    [`terminalTheme${variant.slot}`]: themeId,
  })})`);
  // The welcome flow, which a new profile opens over the window
  await page.evaluate(
    `window.api.onboarding.update({ closedAt: Date.now(), outcome: "dismissed", checklist: { dismissed: true } })`,
  );

  // A new profile lists the home folder as a project
  for (const repo of orca("repo", "list").repos) {
    if (repo.path !== projectDir) orca("repo", "hide", "--repo", `id:${repo.id}`);
  }

  // The window reads the onboarding state once, at load
  await page.send("Page.reload");
  page.close();
  await sleep(3000);
  const reloaded = await connect(debugPort);
  await reloaded.waitFor("!!window.api?.settings", "Orca's window after the reload");
  await reloaded.setViewport(width, height, scale);
  await reloaded.sleep(2500);

  // What a new profile advertises: a promotion dialog, the onboarding checklist, the bots card
  await reloaded.key("Escape");
  await reloaded.sleep(500);
  for (const label of ["Hide", "Bots"]) {
    const found = await reloaded.evaluate(`!!(${elementWithText(label)})`);
    if (found) await reloaded.clickOn(elementWithText(label), label);
    await reloaded.sleep(400);
  }
  return reloaded;
}

// Takes the text cursor's marks out of the editors: the current-line band, the caret, the
// outlined bracket pair, the boxes around other uses of the word under the caret, its tick beside
// the scrollbar, and the diff editor's revert arrow beside the caret's line. They follow wherever the caret happens to be.
const hideCursorMarks = `(() => {
  document.activeElement?.blur?.();
  if (document.getElementById("capture-tidy")) return;
  const plain = document.querySelector(".monaco-editor .line-numbers:not(.active-line-number)");
  const lineNumber = plain ? getComputedStyle(plain).color : "inherit";
  const style = document.createElement("style");
  style.id = "capture-tidy";
  style.textContent = [
    ".monaco-editor .current-line, .monaco-editor .current-line-margin, .monaco-editor .current-line-exact",
    "{ background: transparent !important; border-color: transparent !important; }",
    ".monaco-editor .bracket-match, .monaco-editor .wordHighlight, .monaco-editor .wordHighlightStrong,",
    ".monaco-editor .wordHighlightText, .monaco-editor .selectionHighlight",
    "{ background: transparent !important; border-color: transparent !important; box-shadow: none !important; }",
    // The overview ruler is where the caret's line is ticked beside the scrollbar
    ".monaco-editor .cursors-layer, .monaco-editor .decorationsOverviewRuler, .monaco-diff-editor .gutterItem",
    "{ visibility: hidden !important; }",
    ".monaco-editor .line-numbers.active-line-number { color: " + lineNumber + " !important; }",
    ".ProseMirror { caret-color: transparent !important; }",
  ].join(" ");
  document.head.append(style);
})()`;

// Where the pictures of the theme being captured go
let outDir;

async function shoot(page, name) {
  await page.evaluate(hideCursorMarks);
  // Park the pointer where it hovers nothing
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: width / 2, y: height - 2 });
  await page.sleep(1200);
  const path = join(outDir, `${name}.png`);
  await page.screenshot(path);
  console.log(`  ${name}.png`);
}

const worktree = `path:${projectDir}`;

async function shootFile(page, name, file) {
  orca("file", "open", file, "--worktree", worktree, "--focus");
  await page.waitFor(`document.body.innerText.includes(${JSON.stringify(file.split("/").pop())})`, file);
  await shoot(page, name);
}

// What the terminal shows: git output, then the 16 terminal colors as text and as backgrounds.
// The same test the pictures of Orca's own themes use.
const terminalDemo = `
git -c color.ui=always --no-pager diff --stat
git -c color.ui=always status -sb
echo
names="black red green yellow blue magenta cyan white"
index=0
for name in $names; do printf '\\033[3%sm%-8s\\033[0m' "$index" "$name"; index=$((index + 1)); done; echo
for index in 0 1 2 3 4 5 6 7; do printf '\\033[9%sm%-8s\\033[0m' "$index" "bright$index"; done; echo
for index in 0 1 2 3 4 5 6 7; do printf '\\033[4%sm        \\033[0m' "$index"; done; echo
for index in 0 1 2 3 4 5 6 7; do printf '\\033[10%sm        \\033[0m' "$index"; done; echo
`;

function openTerminal() {
  // The stock prompt names the machine
  const command = `PS1='harbor (main) $ '; clear; sh ${join(workDir, "terminal-demo.sh")}`;
  orca("terminal", "create", "--worktree", worktree, "--title", "zsh", "--command", command, "--focus");
}

// A tab in the tab bars, by a test on its text (t)
const tab = (test) =>
  `[...document.querySelectorAll("div[role=button]")]
    .find((element) => { const t = element.innerText.trim(); return ${test}; })`;
const tabNamed = (name) => tab(`t.startsWith(${JSON.stringify(name)}) && !t.includes("(diff)")`);
const diffTab = tab(`t.includes("(diff)")`);

const menuItem = (label) =>
  `[...document.querySelectorAll("[role=menuitem]")]
    .find((element) => element.innerText.trim().split("\\n")[0] === ${JSON.stringify(label)})`;

async function tabMenu(page, tabExpression, ...labels) {
  // The first call scrolls the tab into view, and the tab bar animates that
  if (!(await page.centerOf(tabExpression))) throw new Error(`No tab matches ${tabExpression}`);
  await page.sleep(600);
  const center = await page.centerOf(tabExpression);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await page.send("Input.dispatchMouseEvent", { type, ...center, button: "right", clickCount: 1 });
  }
  for (const label of labels) {
    await page.sleep(500);
    await page.clickOn(menuItem(label), label);
  }
  await page.sleep(800);
}

// The picture the listing's cover is made from (scripts/compose-cover.mjs): a file with a
// terminal below. Orca's own themes add the file's diff beside it.
async function shootCover(page) {
  await tabMenu(page, diffTab, "Close");
  await tabMenu(page, tabNamed("zsh"), "Move Tab to Split", "Down");
  orca("file", "open", "src/schedule.ts", "--worktree", worktree, "--focus");
  await page.sleep(1000);

  // The split is half and half; give the code more of the height
  const handle = await page.centerOf(`document.querySelector(".tab-group-split-resize-handle.is-horizontal")`);
  await page.drag(handle, { x: handle.x, y: Math.round(height * 0.66) });
  await shoot(page, "cover");
}

// A chat with an agent. The agent is scripts/fake-claude.mjs, under the name Orca starts Claude
// Code by: it answers the question below with the same words each time, and needs no account.
const chatQuestion = "How does `book` pick a berth?";

function machineNames() {
  const names = [hostname(), hostname().split(".")[0]];
  try {
    names.push(execFileSync("scutil", ["--get", "ComputerName"], { encoding: "utf8" }).trim());
  } catch {
    // No such name set
  }
  return names;
}

// What the second Orca installs: the themes without the pictures. The manifest names pictures
// this script has yet to take, and Orca refuses a plugin that names a file it lacks.
const stagedPlugin = join(workDir, "plugin");

async function stagePlugin() {
  await rm(stagedPlugin, { recursive: true, force: true });
  await mkdir(stagedPlugin, { recursive: true });
  const { cover, screenshots, ...rest } = manifest;
  await writeFile(join(stagedPlugin, "orca-plugin.json"), JSON.stringify(rest, null, 2));
  for (const folder of ["themes", "terminal"]) {
    await cp(join(pluginDir, folder), join(stagedPlugin, folder), { recursive: true });
  }
}

async function installFakeClaude() {
  await mkdir(binDir, { recursive: true });
  const command = join(binDir, "claude");
  const script = join(pluginDir, "scripts/fake-claude.mjs");
  await writeFile(command, `#!/bin/sh\nexec "${process.execPath}" "${script}" "$@"\n`);
  await chmod(command, 0o755);
}

async function shootChat(page) {
  // The cover's terminal, and the split it is in, would take the lower third
  await tabMenu(page, tabNamed("zsh"), "Close");
  orca("agent", "launch", "--agent", "claude", "--surface", "chat", "--worktree", worktree, "--prompt", chatQuestion, "--focus");
  await page.waitFor(`document.body.innerText.includes("for the rest")`, "the reply in the chat");
  // Orca asks for a GitHub star a moment after an agent has answered
  await page.sleep(4000);
  if (await page.evaluate(`!!(${elementWithText("Later")})`)) await page.clickOn(elementWithText("Later"), "Later");
  // Under the message box Orca names the machine the agent runs on
  await page.evaluate(`(() => {
    const names = ${JSON.stringify(machineNames())};
    for (const element of document.querySelectorAll("button, span, div")) {
      if (element.children.length <= 1 && names.includes(element.innerText?.trim())) {
        // With its icon, which is beside the name
        (element.closest("button") ?? element.parentElement).style.visibility = "hidden";
      }
    }
  })()`);
  await shoot(page, "chat");
}

// Settings pages: cards, selects, steppers, switches and sliders. Two whose first screen shows no
// path under the profile's folder.
const settingsPages = [
  ["settings-appearance", "Appearance"],
  ["settings-terminal", "Terminal"],
];

const settingsItem = (label) =>
  `[...document.querySelectorAll("button")].find((element) => element.innerText.trim() === ${JSON.stringify(label)})`;

async function shootSettings(page) {
  await page.clickOn(`document.querySelector("[data-app-rail-item=settings]")`, "the Settings button");
  for (const [name, label] of settingsPages) {
    // The navigation scrolls to the item with an animation, so a click by position can land on
    // the item that was there before
    await page.waitFor(`!!(${settingsItem(label)})`, label);
    await page.evaluate(`(${settingsItem(label)}).click()`);
    // The page is named in the path above it
    await page.waitFor(
      `[...document.querySelectorAll("nav")].some((nav) => nav.innerText.replace(/\\s+/g, " ").trim() === ${JSON.stringify(`Settings / ${label}`)})`,
      `the ${label} page`,
    );
    await shoot(page, name);
  }
}

if (process.platform !== "darwin") throw new Error("This script drives the macOS build of Orca");
if (!existsSync(appBinary)) throw new Error(`Orca is not at ${appDir}. Set ORCA_APP to its path.`);

await mkdir(workDir, { recursive: true });
await installFakeClaude();
await stagePlugin();

async function capture(variant) {
  outDir = variant.outDir;
  await mkdir(outDir, { recursive: true });
  await makeSampleProject();

  let page;
  try {
    console.log(`${variant.name}: starting a second, hidden Orca`);
    page = await launchOrca();
    orca("plugin", "install", stagedPlugin);
    orca("repo", "add", "--path", projectDir);
    page = await prepareWindow(page, variant);

    console.log(`Capturing to ${outDir}`);
    await shootFile(page, "typescript", "src/schedule.ts");
    await shootFile(page, "html", "src/index.html");
    await shootFile(page, "css", "src/styles.css");
    await shootFile(page, "json", "package.json");
    await shootFile(page, "python", "scripts/tides.py");
    await shootFile(page, "markdown", "README.md");

    orca("file", "diff", "src/schedule.ts", "--worktree", worktree, "--focus");
    await page.sleep(1500);
    await shoot(page, "diff");

    await writeFile(join(workDir, "terminal-demo.sh"), terminalDemo);
    openTerminal();
    await page.sleep(4000);
    await shoot(page, "terminal");
    await shootCover(page);
    await shootChat(page);
    await shootSettings(page);
  } catch (error) {
    // CAPTURE_KEEP exits below, before the error would be printed
    if (process.env.CAPTURE_KEEP) {
      console.error(error);
      process.exitCode = 1;
    }
    throw error;
  } finally {
    page?.close();
    // For working on this script: leaves the second Orca up to poke at over the debugging port
    if (process.env.CAPTURE_KEEP) process.exit(process.exitCode ?? 0);
    await stopOrca();
    await rm(projectDir, { recursive: true, force: true });
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  }
}

for (const variant of variants) {
  await capture(variant);
}

// The cover of the plugin's page is made from both themes' cover.png, so it is stale as soon as
// either is retaken
if (variants.length === Object.keys(VARIANTS).length) {
  execFileSync(process.execPath, [join(pluginDir, "scripts/compose-cover.mjs")], { stdio: "inherit" });
} else {
  console.log("One theme captured: run `npm run cover` to remake the cover of the plugin's page.");
}
