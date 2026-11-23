// Builds the Orca plugin (orca-plugin.json, themes/armada.json and
// terminal/armada.json) from Tachi Code's Armada theme, the source of truth
// for the colors.
//
//   npm run build [-- <path to armada.ts>]
//
// Tachi Code provides the theme and its named palette. What is Orca's own
// lives here: the app colors in src/app-tokens.mjs, and the code colors Orca
// needs on top of the theme's in src/token-colors.mjs. The theme's code
// colors are cut down to what Orca reads and to Orca's 16 KiB limit on a
// theme file; see compactTokenColors below.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { appTokens } from "../src/app-tokens.mjs";
import { tokenColors as orcaTokenColorsFor } from "../src/token-colors.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  process.argv[2] ??
    resolve(root, "../tachi-code/src/entrypoints/code/shiki/themes/armada.ts"),
);
const { default: theme, palette } = await import(pathToFileURL(source).href);
if (!palette) {
  throw new Error(`${source} has no palette export`);
}
// A name the palette lacks would otherwise reach the theme as `undefined`
const named = new Proxy(palette, {
  get(colors, name) {
    if (!(name in colors)) {
      throw new Error(`The palette has no color named ${String(name)}`);
    }
    return colors[name];
  },
});
const orcaTokens = appTokens(named);
const orcaTokenColors = orcaTokenColorsFor(named);
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

// Orca's limits (docs/reference/plugin-themes.md in stablyai/orca)
const THEME_FILE_MAX_BYTES = 16 * 1024;
const MAX_SCOPES_PER_RULE = 64;
const TEXT_CONTRAST = 4.5;
const CODE_CONTRAST = 3;

// ---------------------------------------------------------------- colors --

/** `#rgb`, `#rrggbb` or `#rrggbbaa` as [r, g, b, alpha]. */
function parseHex(hex) {
  const h = hex.slice(1);
  const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
  const n = (i) => parseInt(full.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
}

/** `top` painted over the opaque `under`. */
function over(top, under) {
  const [r, g, b, a] = parseHex(top);
  const [ur, ug, ub] = parseHex(under);
  const mix = (c, u) => Math.round(c * a + u * (1 - a));
  return [mix(r, ur), mix(g, ug), mix(b, ub), 1];
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ------------------------------------------------------------ app tokens --

// Tokens Orca accepts translucent, with the opaque token each paints over.
// Every other token must be opaque.
const TRANSLUCENT = {
  "--border": "--background",
  "--input": "--background",
  "--sidebar-border": "--sidebar",
  "--worktree-sidebar-border": "--worktree-sidebar",
  "--worktree-sidebar-active": "--worktree-sidebar",
  "--worktree-sidebar-active-border": "--worktree-sidebar",
  "--host-badge": "--worktree-sidebar",
  "--split-divider": "--background",
  "--split-divider-hover": "--background",
  "--chat-user-message": "--background",
  "--chat-inline-code": "--background",
  "--chat-code-block": "--background",
  "--chat-selection": "--background",
  "--editor-selection": "--editor-surface",
  "--diff-added-background": "--editor-surface",
  "--diff-added-emphasis": "--editor-surface",
  "--diff-added-gutter": "--editor-surface",
  "--diff-removed-background": "--editor-surface",
  "--diff-removed-emphasis": "--editor-surface",
  "--diff-removed-gutter": "--editor-surface",
};

// The text and surface pairs Orca checks, as [text, surface, floor]. Orca
// drops a failing pair and paints its own colors, so a failure here stops
// the build. This list follows Orca's documented checks; Orca's own check at
// load time is the authority.
const PAIRS = [
  ["--foreground", "--background", TEXT_CONTRAST],
  ["--foreground", "--editor-surface", TEXT_CONTRAST],
  ["--card-foreground", "--card", TEXT_CONTRAST],
  ["--popover-foreground", "--popover", TEXT_CONTRAST],
  ["--primary-foreground", "--primary", TEXT_CONTRAST],
  ["--secondary-foreground", "--secondary", TEXT_CONTRAST],
  ["--muted-foreground", "--background", TEXT_CONTRAST],
  ["--muted-foreground", "--muted", TEXT_CONTRAST],
  ["--accent-foreground", "--accent", TEXT_CONTRAST],
  ["--sidebar-foreground", "--sidebar", TEXT_CONTRAST],
  ["--sidebar-primary-foreground", "--sidebar-primary", TEXT_CONTRAST],
  ["--sidebar-accent-foreground", "--sidebar-accent", TEXT_CONTRAST],
  ["--worktree-sidebar-foreground", "--worktree-sidebar", TEXT_CONTRAST],
  [
    "--worktree-sidebar-accent-foreground",
    "--worktree-sidebar-accent",
    TEXT_CONTRAST,
  ],
  ["--worktree-sidebar-foreground", "--worktree-sidebar-active", TEXT_CONTRAST],
  ["--host-badge-foreground", "--host-badge", TEXT_CONTRAST],
  ["--tab-active-foreground", "--tab-active", TEXT_CONTRAST],
  ["--tab-inactive-foreground", "--tab-inactive", TEXT_CONTRAST],
  ["--tab-inactive-foreground", "--tab-bar", TEXT_CONTRAST],
  // A hovered inactive tab takes the active tab's text color
  ["--tab-active-foreground", "--tab-inactive", TEXT_CONTRAST],
  ["--foreground", "--chat-user-message", TEXT_CONTRAST],
  // Links in a message of the user's. Orca drops the bubble over this one.
  ["--text-link", "--chat-user-message", TEXT_CONTRAST],
  ["--chat-bold-foreground", "--background", TEXT_CONTRAST],
  ["--chat-bold-foreground", "--chat-user-message", TEXT_CONTRAST],
  ["--chat-muted-foreground", "--background", TEXT_CONTRAST],
  ["--chat-muted-foreground", "--chat-code-block", TEXT_CONTRAST],
  ["--chat-inline-code-foreground", "--chat-inline-code", TEXT_CONTRAST],
  ["--text-link", "--chat-inline-code", TEXT_CONTRAST],
  ["--foreground", "--chat-code-block", TEXT_CONTRAST],
  ["--text-link", "--editor-surface", TEXT_CONTRAST],
  ["--foreground", "--editor-selection", TEXT_CONTRAST],
  ["--chat-selection-foreground", "--chat-selection", TEXT_CONTRAST],
  ["--foreground", "--diff-added-background", TEXT_CONTRAST],
  ["--foreground", "--diff-added-emphasis", TEXT_CONTRAST],
  ["--foreground", "--diff-removed-background", TEXT_CONTRAST],
  ["--foreground", "--diff-removed-emphasis", TEXT_CONTRAST],
  ...[
    "added",
    "modified",
    "deleted",
    "renamed",
    "untracked",
    "copied",
    "ignored",
  ].map((kind) => [`--git-decoration-${kind}`, "--sidebar", CODE_CONTRAST]),
];

const tokens = Object.fromEntries(
  Object.entries(orcaTokens).map(([token, value]) => [
    token,
    value.toLowerCase(),
  ]),
);

/** The opaque color a token paints: itself, or its tint over what is under it. */
function painted(token) {
  const value = tokens[token];
  const [, , , alpha] = parseHex(value);
  if (alpha === 1) {
    return parseHex(value);
  }
  const under = TRANSLUCENT[token];
  if (!under) {
    throw new Error(`${token} (${value}) must be opaque`);
  }
  return over(value, tokens[under]);
}

const failures = [];
for (const token of Object.keys(tokens)) {
  painted(token);
}
for (const [text, surface, floor] of PAIRS) {
  if (!tokens[text] || !tokens[surface]) {
    continue;
  }
  const ratio = contrast(painted(text), painted(surface));
  if (ratio < floor) {
    failures.push(
      `${text} on ${surface} is ${ratio.toFixed(2)}:1, under ${floor}:1`,
    );
  }
}
// Orca's other checks (plugin-theme-contrast-rules.ts in stablyai/orca). A
// ring or line under 2:1 on what it marks is dropped, and so is a border too
// faint to see.
const RINGS = [
  ["--ring", "--background"],
  ["--sidebar-ring", "--sidebar"],
  ["--worktree-sidebar-ring", "--worktree-sidebar"],
  ["--tab-active-indicator", "--tab-active"],
  // The same line marks the active tool of the right sidebar
  ["--tab-active-indicator", "--sidebar"],
];
const RING_CONTRAST = 2;
const BORDERS = [
  "--border",
  "--input",
  "--sidebar-border",
  "--worktree-sidebar-border",
  "--worktree-sidebar-active-border",
  "--split-divider",
  "--split-divider-hover",
];
const BORDER_MIN_ALPHA = 0.05;
for (const [ring, surface] of RINGS) {
  if (!tokens[ring] || !tokens[surface]) {
    continue;
  }
  const ratio = contrast(painted(ring), painted(surface));
  if (ratio < RING_CONTRAST) {
    failures.push(
      `${ring} on ${surface} is ${ratio.toFixed(2)}:1, under ${RING_CONTRAST}:1`,
    );
  }
}
for (const border of BORDERS) {
  if (tokens[border] && parseHex(tokens[border])[3] < BORDER_MIN_ALPHA) {
    failures.push(`${border} is under ${BORDER_MIN_ALPHA} opacity`);
  }
}
if (failures.length > 0) {
  throw new Error(`Contrast:\n  ${failures.join("\n  ")}`);
}

// ----------------------------------------------------------- code colors --

// Orca's editor is Monaco. Its built-in languages report Monaco's token
// names, and Orca colors each by one TextMate scope from a fixed table
// (MONACO_TOKEN_SCOPES in plugin-monaco-token-rules.ts in stablyai/orca).
// Only a scope that reaches one of these colors a built-in language. Any
// other scope is read only by a syntax plugin that hands Monaco raw TextMate
// scopes.
const BUILT_IN_SCOPES = [
  "comment",
  "string",
  "constant.character.escape",
  "support.type.property-name",
  "markup.underline.link",
  "markup.inline.raw",
  "markup.heading",
  "string.regexp",
  "constant.numeric",
  "constant",
  "keyword",
  "keyword.control",
  "constant.language",
  "keyword.operator",
  "punctuation",
  "punctuation.definition.tag",
  "entity.name.type",
  "variable",
  "variable.parameter",
  "support.variable",
  "support.function",
  "entity.name.function",
  "entity.name.tag",
  "entity.other.attribute-name",
  "keyword.other.unit",
  "meta.decorator",
  "invalid",
  "markup.italic",
  "markup.bold",
  "markup.quote",
  "meta.separator",
  "entity.name.section.markdown",
  "punctuation.definition.heading.markdown",
];

// Languages whose own scopes are kept while the file has room, first to
// last. Java and Kotlin come last: Armada colors them through semantic
// tokens and parent-scope selectors, neither of which Orca reads.
const LANGUAGE_ORDER = [
  "markdown",
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "html",
  "css",
  "scss",
  "less",
  "yaml",
  "toml",
  "python",
  "rust",
  "go",
  "shell",
  "diff",
  "sql",
  "xml",
  "c",
  "cpp",
  "cs",
  "ruby",
  "php",
  "java",
  "kotlin",
];

const isWithin = (scope, selector) =>
  scope === selector || scope.startsWith(`${selector}.`);

/** The style Orca resolves for `scope`: per property, the longest selector
 *  that is a dot-prefix of it. */
function resolveStyle(styles, scope) {
  const parts = scope.split(".");
  const out = {};
  for (let length = 1; length <= parts.length; length += 1) {
    Object.assign(out, styles.get(parts.slice(0, length).join(".")));
  }
  return out;
}

const sameStyle = (a, b) =>
  a.foreground === b.foreground && a.fontStyle === b.fontStyle;

/** One rule per style, each split to Orca's scopes-per-rule limit. */
function groupRules(styles) {
  const groups = new Map();
  for (const [selector, style] of styles) {
    const key = JSON.stringify([style.foreground, style.fontStyle]);
    if (!groups.has(key)) {
      groups.set(key, { style, selectors: [] });
    }
    groups.get(key).selectors.push(selector);
  }
  return [...groups.values()].flatMap(({ style, selectors }) => {
    const rules = [];
    for (let i = 0; i < selectors.length; i += MAX_SCOPES_PER_RULE) {
      rules.push({
        scope: selectors.slice(i, i + MAX_SCOPES_PER_RULE),
        settings: style,
      });
    }
    return rules;
  });
}

/**
 * Cuts a VS Code `tokenColors` list down to what Orca reads and what fits.
 *
 *  1. Selectors with a parent scope (`a b`) are dropped: Orca does not read
 *     them.
 *  2. Each selector keeps the style VS Code would resolve for it, the later
 *     rule winning per property.
 *  3. A selector that resolves to the same style without its own rule is
 *     dropped: its parent scope already colors it.
 *  4. What is left is added in order of what it reaches until the file is
 *     full: the theme's Orca-only rules, the scopes Orca's built-in languages
 *     read, then the scopes that
 *     belong to no one language, then each language in LANGUAGE_ORDER, then
 *     the rest. A language is added whole or not at all.
 */
function compactTokenColors(
  tokenColors,
  alwaysKept,
  editorBackground,
  editorForeground,
  fits,
) {
  const report = { parentScope: 0, redundant: 0, lowContrast: [], cut: [] };
  const styles = new Map();
  for (const rule of tokenColors) {
    const scopes = [rule.scope ?? []].flat().flatMap((s) => s.split(","));
    for (const selector of scopes.map((s) => s.trim()).filter(Boolean)) {
      if (/\s/.test(selector)) {
        report.parentScope += 1;
        continue;
      }
      const style = { ...styles.get(selector) };
      if (rule.settings.foreground !== undefined) {
        style.foreground = rule.settings.foreground.toLowerCase();
      }
      if (rule.settings.fontStyle !== undefined) {
        style.fontStyle = rule.settings.fontStyle;
      }
      // Re-set, so the map keeps the order of each selector's last rule
      styles.delete(selector);
      styles.set(selector, style);
    }
  }

  // Deepest first: a dropped selector's children then resolve through the
  // same parent it did.
  const byDepth = [...styles.keys()].sort(
    (a, b) => b.split(".").length - a.split(".").length,
  );
  for (const selector of byDepth) {
    const own = styles.get(selector);
    styles.delete(selector);
    if (sameStyle(resolveStyle(styles, selector), resolveStyle(new Map([...styles, [selector, own]]), selector))) {
      report.redundant += 1;
    } else {
      styles.set(selector, own);
    }
  }

  // Orca replaces a code color under 3:1 on the editor with its own. Armada's
  // dimmest colors are under it on purpose, so each moves toward the editor
  // text only as far as it must, and stays the dimmest thing on the line.
  const background = parseHex(editorBackground);
  const text = parseHex(editorForeground);
  const hex = (rgb) =>
    `#${rgb.slice(0, 3).map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  const readable = new Map();
  for (const [selector, style] of styles) {
    if (!style.foreground) {
      continue;
    }
    if (!readable.has(style.foreground)) {
      const from = over(style.foreground, editorBackground);
      let color = from;
      for (let step = 1; contrast(color, background) < CODE_CONTRAST; step += 1) {
        color = from.map((c, i) => Math.round(c + ((text[i] - c) * step) / 100));
      }
      readable.set(style.foreground, hex(color));
    }
    const lifted = readable.get(style.foreground);
    if (lifted !== hex(over(style.foreground, editorBackground))) {
      report.lowContrast.push(`${selector} ${style.foreground} -> ${lifted}`);
      style.foreground = lifted;
    }
  }

  const languageOf = (selector) => {
    const last = selector.split(".").at(-1);
    return LANGUAGE_ORDER.includes(last) ? last : undefined;
  };
  const reachesBuiltIn = (selector) =>
    BUILT_IN_SCOPES.some((scope) => isWithin(scope, selector));
  const tiers = [
    ["Orca's own rules", (s) => alwaysKept.has(s)],
    ["built-in languages", (s) => reachesBuiltIn(s)],
    ["shared scopes", (s) => !knownSuffix.has(s.split(".").at(-1))],
    ...LANGUAGE_ORDER.map((language) => [
      language,
      (s) => languageOf(s) === language,
    ]),
    ["other languages", () => true],
  ];
  // A last segment that is a language's own: one seen on a `source.*` or
  // `text.*` selector, or named in LANGUAGE_ORDER.
  const knownSuffix = new Set(LANGUAGE_ORDER);
  for (const selector of styles.keys()) {
    const parts = selector.split(".");
    if (parts.length > 2) {
      const last = parts.at(-1);
      const count = [...styles.keys()].filter((s) => s.endsWith(`.${last}`)).length;
      if (count >= 3 && !BUILT_IN_SCOPES.some((scope) => scope.endsWith(`.${last}`) || scope === last)) {
        knownSuffix.add(last);
      }
    }
  }

  const kept = new Map();
  const remaining = new Map(styles);
  for (const [name, belongs] of tiers) {
    const tier = [...remaining].filter(([selector]) => belongs(selector));
    if (tier.length === 0) {
      continue;
    }
    for (const [selector] of tier) {
      remaining.delete(selector);
    }
    const candidate = new Map([...kept, ...tier]);
    if (fits(groupRules(candidate))) {
      for (const [selector, style] of tier) {
        kept.set(selector, style);
      }
    } else {
      report.cut.push(`${name} (${tier.length})`);
    }
  }
  return { rules: groupRules(kept), kept: kept.size, report };
}

const serialize = (tokenColors) =>
  JSON.stringify({ schemaVersion: 1, base: theme.type, tokens, tokenColors });

const { rules, kept, report } = compactTokenColors(
  // The Orca-only rules last, so they win over the theme's own
  [...theme.tokenColors, ...orcaTokenColors],
  new Set(orcaTokenColors.flatMap((rule) => rule.scope)),
  tokens["--editor-surface"],
  tokens["--foreground"],
  // One byte for the file's closing newline
  (candidate) =>
    Buffer.byteLength(serialize(candidate)) + 1 <= THEME_FILE_MAX_BYTES,
);

// --------------------------------------------------------- terminal theme --

const TERMINAL = {
  background: ["terminal.background", "editor.background"],
  foreground: ["terminal.foreground", "editor.foreground"],
  cursor: ["terminalCursor.foreground", "editorCursor.foreground"],
  cursorAccent: ["terminalCursor.background"],
  selectionBackground: ["terminal.selectionBackground"],
  selectionForeground: ["terminal.selectionForeground"],
  ...Object.fromEntries(
    ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"].flatMap(
      (name) => [
        [name.toLowerCase(), [`terminal.ansi${name}`]],
        [`bright${name}`, [`terminal.ansiBright${name}`]],
      ],
    ),
  ),
};

const terminal = {};
for (const [slot, keys] of Object.entries(TERMINAL)) {
  const value = keys.map((key) => theme.colors[key]).find(Boolean);
  if (value) {
    terminal[slot] = value.toLowerCase();
  }
}

// ----------------------------------------------------------------- output --

// The id Orca lists the theme under, and the name of its two files
const id = "armada-dark";
const file = "armada";
// The pictures on the plugin's page, which scripts/capture-screenshots.mjs takes. Orca shows
// its own drawing of the theme in place of a cover the manifest does not name, and takes at
// most 6 screenshots.
const shot = (name, alt, caption) => ({
  path: `screenshots/${name}.png`,
  alt,
  ...(caption && { caption }),
});
const cover = shot(
  "cover",
  "Armada in Orca: a TypeScript file above a terminal showing git status and the 16 terminal colors",
);
const screenshots = [
  shot("chat", "A chat with an agent in Orca with the Armada theme", "A chat"),
  shot("python", "A Python file in Orca with the Armada theme", "Python"),
  shot("css", "A CSS file in Orca with the Armada theme", "CSS"),
  shot("markdown", "A Markdown file in Orca with the Armada theme", "Markdown"),
  shot("diff", "A diff of a TypeScript file in Orca with the Armada theme", "A diff"),
  shot("terminal", "Orca's terminal with the Armada terminal colors", "The terminal"),
];

const manifest = {
  manifestVersion: 2,
  id: pkg.name,
  publisher: pkg.publisher,
  name: pkg.displayName,
  version: pkg.version,
  execution: "data",
  description: pkg.description,
  license: pkg.license,
  repository: pkg.repository.url.replace(/\.git$/, ""),
  engines: { orca: pkg.engines.orca },
  cover,
  screenshots,
  contributes: {
    themes: [{ id, title: theme.displayName, path: `themes/${file}.json` }],
    terminalThemes: [
      { id, title: theme.displayName, path: `terminal/${file}.json` },
    ],
  },
  capabilities: [],
};

const themeFile = serialize(rules);
mkdirSync(resolve(root, "themes"), { recursive: true });
mkdirSync(resolve(root, "terminal"), { recursive: true });
writeFileSync(
  resolve(root, "orca-plugin.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
// Minified: Orca caps the file and the code colors are most of it
writeFileSync(resolve(root, `themes/${file}.json`), themeFile + "\n");
writeFileSync(
  resolve(root, `terminal/${file}.json`),
  JSON.stringify({ schemaVersion: 1, mode: theme.type, terminal }, null, 2) +
    "\n",
);

console.log(`${Object.keys(tokens).length} app tokens, all pairs readable`);
console.log(
  `${kept} code scopes in ${rules.length} rules; theme file ${Buffer.byteLength(themeFile) + 1} of ${THEME_FILE_MAX_BYTES} bytes`,
);
console.log(
  `dropped: ${report.parentScope} selectors with a parent scope, ${report.redundant} that repeat their parent's style`,
);
if (report.cut.length > 0) {
  console.log(`cut to fit: ${report.cut.join(", ")}`);
}
if (report.lowContrast.length > 0) {
  console.log(
    `lifted to ${CODE_CONTRAST}:1 on the editor, under which Orca paints its own color:\n  ${report.lowContrast.join("\n  ")}`,
  );
}
console.log(`${Object.keys(terminal).length} terminal colors`);
