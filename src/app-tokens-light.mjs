// Armada Light's app colors for Orca: the choices of src/app-tokens.mjs in
// Armada Light's palette (`palette` in Tachi Code's armada-light.ts, which
// follows the IntelliJ Armada Light UI theme). It is a map of its own because
// the two palettes share few names: the dark one steps up from the shell
// through neutral20, 30 and 40, and the light one has the frame (neutral150),
// white, and the border grays.
//
// Armada Light is white islands on a gray frame. Only the frame is gray
// (neutral150, #EEEFF0, as in JetBrains Air): the strip of tabs across the
// top of the window. Every surface on it is white: both sidebars, the chat,
// the editor, cards, menus. In the dark theme the split is the other way
// round, a black shell with one lighter island, because there the sidebars
// and the chat are the shell.
//
// Orca has fewer tokens than the frame has parts, so three parts of the frame
// are white here, each with the surface it shares a token with: the strip of
// icons at the far left and the title above it (--worktree-sidebar), the row
// of tools above the right sidebar (--sidebar) and the status bar (--card).
//
// A hovered, selected or current row is a light tint on white, as Armada
// Light's lists are, not a gray block. neutral150 is that tint where Orca
// wants an opaque color: darkTint7 over white is #EFEFEF. The current
// workspace and the selected item of the settings navigation are marked by a
// near-black stroke, never a blue fill, which would sit against the blue of a
// badge. The active tab, and the active tool of the right sidebar, have a
// blue line under them. The selection is blue130 (#A8C6F4), the IntelliJ
// theme's.
//
// Orca drops a text and surface pair under its contrast floor and paints its
// own colors instead; scripts/build-theme.mjs fails on one.

/** `tint` (#rrggbbaa) painted over the opaque `base`, as #RRGGBB. */
function over(tint, base) {
  const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const alpha = channel(tint, 3) / 255;
  return `#${[0, 1, 2]
    .map((i) => Math.round(channel(tint, i) * alpha + channel(base, i) * (1 - alpha)))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

/** @param {Record<string, string>} colors Armada Light's palette */
export const appTokens = (colors) => ({
  // The page behind the chat and around the editor: an island
  "--background": colors.white,
  "--editor-surface": colors.white,
  "--foreground": colors.neutral10,
  // The color of the page, and drawn by its outline, as the dark cards are.
  // Orca paints its status bar with this color too.
  "--card": colors.white,
  "--card-foreground": colors.neutral10,
  // Menus are white in Armada Light, with a border
  "--popover": colors.white,
  "--popover-foreground": colors.neutral10,
  "--primary": colors.blue90,
  "--primary-foreground": colors.white,
  "--secondary": colors.neutral140,
  "--secondary-foreground": colors.neutral10,
  // The fill of Armada Light's widgets, a step off white
  "--muted": colors.neutral160,
  "--muted-foreground": colors.neutral80,
  // Orca's one fill for hovered buttons and rows and for the highlighted item
  // of a menu. Gray, as hover is in Armada: a blue here also fills buttons.
  "--accent": colors.neutral150,
  "--accent-foreground": colors.neutral10,
  "--border": colors.neutral140,
  // Orca also fills a field with half of this color, so it is the border of
  // a panel and not neutral130, Armada Light's border of a field: half of
  // that is a gray block where Armada Light's fields are white
  "--input": colors.neutral140,
  "--ring": colors.blue90,
  // One blue from light to dark, as in the dark theme. Orca draws Mermaid
  // diagrams from these only in a dark theme.
  "--chart-1": colors.blue120,
  "--chart-2": colors.blue100,
  "--chart-3": colors.blue90,
  "--chart-4": colors.blue80,
  "--chart-5": colors.blue70,

  // The right sidebar and the settings navigation: an island
  "--sidebar": colors.white,
  "--sidebar-foreground": colors.neutral10,
  "--sidebar-primary": colors.blue90,
  "--sidebar-primary-foreground": colors.white,
  "--sidebar-accent": colors.neutral150,
  "--sidebar-accent-foreground": colors.neutral10,
  // The line between two islands, where the other Armada Lights show the
  // frame
  "--sidebar-border": colors.neutral140,
  "--sidebar-ring": colors.blue90,

  // The left workspace sidebar: an island
  "--worktree-sidebar": colors.white,
  "--worktree-sidebar-foreground": colors.neutral10,
  // Also the selected item of the settings navigation, which draws a faint
  // ring of --worktree-sidebar-ring around it. Orca wants it opaque.
  "--worktree-sidebar-accent": colors.neutral150,
  "--worktree-sidebar-accent-foreground": colors.neutral10,
  "--worktree-sidebar-border": colors.neutral140,
  // Orca draws the ring of the selected settings item at a quarter of this
  // color's opacity: the near-black stroke of a selected item. Focus rings in
  // the workspace sidebar take it too.
  "--worktree-sidebar-ring": colors.neutral10,
  // The current workspace: the tint of a row with focus in Armada Light's
  // lists, with a near-black stroke. The dark theme has a blue tint and a
  // blue border at that strength.
  "--worktree-sidebar-active": colors.darkTint7,
  "--worktree-sidebar-active-border": colors.darkTint50,
  // On every workspace row, so it stays quiet
  "--host-badge": colors.darkTint7,
  "--host-badge-foreground": colors.neutral60,

  // The frame. The active tab is blueTint10 over it, Armada Light's active
  // tab (#D7E2EF). Orca wants it opaque.
  "--tab-bar": colors.neutral150,
  "--tab-active": over(colors.blueTint10, colors.neutral150),
  "--tab-active-foreground": colors.neutral10,
  // Armada's accent, solid: Armada Light's own line, blueTint50, is under
  // 2:1 on the tab, and Orca then paints the tab's text color. The same line
  // marks the active tool of the right sidebar.
  "--tab-active-indicator": colors.blue90,
  "--tab-inactive": colors.neutral150,
  "--tab-inactive-foreground": colors.neutral80,
  "--split-divider": colors.neutral140,
  "--split-divider-hover": colors.blue90,

  // The bubble of a request in Tachi Code's chat
  "--chat-user-message": colors.neutral150,
  // The palette has nothing darker than the body text
  "--chat-bold-foreground": colors.neutral10,
  "--chat-muted-foreground": colors.neutral80,
  "--chat-inline-code": colors.darkTint5,
  "--chat-inline-code-foreground": colors.neutral10,
  // The editor's background, which is the chat's too: Orca outlines the block
  "--chat-code-block": colors.white,
  // The blue70 of Tachi Code's links
  "--text-link": colors.blue70,
  // Opaque, as it is in the IntelliJ theme: find matches do not show through
  "--editor-selection": colors.blue130,
  "--chat-selection": colors.blue130,
  "--chat-selection-foreground": colors.neutral10,

  // The tints of Tachi Code's diff editor: a line, a changed word, the gutter
  "--diff-added": colors.green90,
  "--diff-added-background": colors.greenTint10,
  "--diff-added-emphasis": colors.greenTint20,
  "--diff-added-gutter": colors.greenTint40,
  "--diff-removed": colors.red90,
  "--diff-removed-background": colors.redTint10,
  "--diff-removed-emphasis": colors.redTint20,
  "--diff-removed-gutter": colors.redTint30,
  // The file status colors of Armada Light's editor scheme
  "--git-decoration-added": colors.vcsAdded,
  "--git-decoration-modified": colors.vcsModified,
  "--git-decoration-deleted": colors.vcsDeleted,
  "--git-decoration-renamed": colors.vcsModified,
  "--git-decoration-untracked": colors.vcsUnknown,
  "--git-decoration-copied": colors.vcsAdded,
  "--git-decoration-ignored": colors.vcsIgnored,
});
