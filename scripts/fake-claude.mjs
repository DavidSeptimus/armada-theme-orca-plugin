// A stand-in for the `claude` command, for the chat screenshot. Orca draws a chat from what
// Claude Code says over its stream-json protocol; this speaks just enough of it to answer the
// one question capture-screenshots.mjs asks, always with the same words, so the picture needs
// no account and comes out the same each time.
//
// It follows what Orca 1.4.271 asks of the command. The protocol is Claude Code's own, but which
// parts Orca uses is not documented, so an Orca update may break this.

import { randomBytes, randomUUID } from "node:crypto";

const TITLE = "How booking picks a berth";
const MODEL = "claude-sonnet-5-5";
const REPLY = `\`Schedule.book\` gives a vessel the **smallest free berth** that fits it:

\`\`\`ts
const berth = this.berths.find(
  (id) => MAX_LENGTH[id] >= vessel.lengthMeters && this.isFree(id, vessel.arrival),
);
\`\`\`

\`this.berths\` is in order of size, so the first match is the smallest:

| Berth | Longest vessel | Fits a 200 m vessel |
| ----- | -------------- | ------------------- |
| 1     | 120 m          | No                  |
| 2     | 180 m          | No                  |
| 3     | 240 m          | Yes, if it is free  |
| 4     | 320 m          | Yes, if it is free  |

\`\`\`mermaid
flowchart LR
  A[Vessel arrives] --> B[Next berth by size] --> C{Fits and is free?} -- yes --> D[Book it]
\`\`\`

If nothing fits it logs a warning and returns \`null\`. See [src/schedule.ts](src/schedule.ts) for the rest.
`;

const argv = process.argv.slice(2);
function option(name) {
  const joined = argv.find((arg) => arg.startsWith(`--${name}=`));
  if (joined) return joined.slice(name.length + 3);
  const at = argv.indexOf(`--${name}`);
  return at < 0 ? undefined : argv[at + 1];
}

if (argv[0] === "--version") {
  console.log("2.1.0 (Claude Code)");
  process.exit(0);
}

// Orca asks for the chat's title with a one-off prompt on stdin, answered as plain text
if (option("output-format") !== "stream-json") {
  process.stdin.resume();
  process.stdin.on("end", () => console.log(TITLE));
} else {
  const sessionId = option("session-id") ?? randomUUID();
  const send = (message) => process.stdout.write(JSON.stringify(message) + "\n");
  const usage = {
    input_tokens: 1200,
    output_tokens: 180,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };

  let started = false;
  function start() {
    if (started) return;
    started = true;
    send({
      type: "system",
      subtype: "init",
      cwd: process.cwd(),
      session_id: sessionId,
      tools: ["Read", "Grep", "Glob", "Bash", "Edit"],
      mcp_servers: [],
      model: MODEL,
      permissionMode: "bypassPermissions",
      slash_commands: [],
      apiKeySource: "none",
      output_style: "default",
      agents: [],
      skills: [],
      plugins: [],
      uuid: randomUUID(),
    });
  }

  function answer(question) {
    start();
    if (argv.includes("--replay-user-messages")) {
      send({ ...question, session_id: sessionId, parent_tool_use_id: null, isReplay: true });
    }
    send({
      type: "assistant",
      message: {
        id: `msg_${randomBytes(8).toString("hex")}`,
        type: "message",
        role: "assistant",
        model: MODEL,
        content: [{ type: "text", text: REPLY }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage,
      },
      parent_tool_use_id: null,
      session_id: sessionId,
      uuid: randomUUID(),
    });
    send({
      type: "result",
      subtype: "success",
      is_error: false,
      duration_ms: 4200,
      duration_api_ms: 3900,
      num_turns: 1,
      result: REPLY,
      stop_reason: "end_turn",
      session_id: sessionId,
      total_cost_usd: 0.01,
      usage,
      modelUsage: {},
      permission_denials: [],
      uuid: randomUUID(),
    });
  }

  // Orca also asks for settings, models and context use. An empty answer does for each.
  function acknowledge(request) {
    const first = request.request?.subtype === "initialize";
    send({
      type: "control_response",
      response: {
        subtype: "success",
        request_id: request.request_id,
        response: first ? { commands: [], output_style: "default", models: [], account: {} } : {},
      },
    });
    if (first) start();
  }

  let pending = "";
  process.stdin.on("data", (chunk) => {
    pending += chunk;
    for (let end = pending.indexOf("\n"); end >= 0; end = pending.indexOf("\n")) {
      const line = pending.slice(0, end).trim();
      pending = pending.slice(end + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      if (message.type === "control_request") acknowledge(message);
      else if (message.type === "user") answer(message);
    }
  });
  process.stdin.on("end", () => process.exit(0));
}
