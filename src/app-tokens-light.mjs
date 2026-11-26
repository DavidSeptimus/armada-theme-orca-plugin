// Armada Light's app colors for Orca: the choices of src/app-tokens.mjs in
// Armada Light's palette (`palette` in Tachi Code's armada-light.ts, which
// follows the IntelliJ Armada Light UI theme). It is a map of its own because
// the two palettes share few names: the dark one steps up from the shell
// through neutral20, 30 and 40, and the light one has white, two light grays
// (neutral160, neutral150) and the border grays.
//
// The window is a light gray frame around a white center. The frame is
// neutral160 (#F8F8F9): both sidebars, the strip of tabs, and cards with the
// status bar. The chat, the editor, the page around them and menus are
// white. The other Armada Lights have white sidebars on a frame of neutral150
// with a gap between panels; Orca separates panels by a thin line only, and
// with white sidebars its window is flat. As in the dark theme, the sidebars
// and the strip of tabs are one color and the editor another.
//
// A selected row is a gray two steps darker than the frame. A hovered row or
// button is a step darker (--accent, which is also the band on the editor's
// current line and so is counted from white), except in the left sidebar,
// where Orca hovers a row with the selection's gray, in part or whole. The
// rows Orca paints with --sidebar-accent are blue, hovered or selected. The
// current workspace is blue, as in the dark theme, and so is the active tab;
// the active tab and the active tool of the right sidebar have a blue line
// under them. The selection is blue130 (#A8C6F4), the IntelliJ
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
  // The page behind the chat and around the editor
  "--background": colors.white,
  "--editor-surface": colors.white,
  "--foreground": colors.neutral10,
  // The frame's color: Orca paints its status bar with this color too. A
  // card in the settings is half of it over the white page.
  "--card": colors.neutral160,
  "--card-foreground": colors.neutral10,
  // Menus are white in Armada Light, with a border
  "--popover": colors.white,
  "--popover-foreground": colors.neutral10,
  "--primary": colors.blue90,
  "--primary-foreground": colors.white,
  "--secondary": colors.neutral140,
  "--secondary-foreground": colors.neutral10,
  // A step darker than the sidebars, so a quiet fill shows on them
  "--muted": colors.neutral150,
  "--muted-foreground": colors.neutral80,
  // Orca's fill for hovered buttons and rows and for the chosen segment of a
  // switch, and the band on the editor's current line. Gray, as hover is in
  // Armada: a blue here also fills buttons. Two steps from white, for the
  // current line's band, as the dark theme's hover is two steps from its
  // editor. That leaves a hover on the frame one step from it, and the same
  // gray as a quiet fill: neutral140 would put it at two, and the band at
  // three.
  "--accent": colors.neutral150,
  "--accent-foreground": colors.neutral10,
  // The outline of a card: Orca paints a settings card at half of --card,
  // which is #FBFBFC on the white page, so the outline is what shows it
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

  // The right sidebar: part of the frame
  "--sidebar": colors.neutral160,
  "--sidebar-foreground": colors.neutral10,
  "--sidebar-primary": colors.blue90,
  "--sidebar-primary-foreground": colors.white,
  // The agent that has the focus, inside the current workspace's row. Also,
  // in the left sidebar, a selected or hovered bot chat and a workspace that
  // is being made; in the right sidebar's Agents panel, its switch, a hovered
  // row and a search hit. The blue of the current workspace and the active
  // tab, so the agent's row is a darker blue on its workspace: Orca mixes 12%
  // of the text color into this for it. In the dark theme that row is the
  // hover gray at 70% with the workspace's blue showing through, a recipe
  // Orca has for dark themes only. Orca wants this opaque.
  "--sidebar-accent": over(colors.blueTint15, colors.neutral160),
  "--sidebar-accent-foreground": colors.neutral10,
  // The right sidebar's edge, the color of the left sidebar's. In the top row
  // both sides of this line are the frame's color, and a lighter line is lost
  // there.
  "--sidebar-border": colors.neutral140,
  "--sidebar-ring": colors.blue90,

  // The left workspace sidebar, the strip of icons beside it and the settings
  // navigation: part of the frame
  "--worktree-sidebar": colors.neutral160,
  "--worktree-sidebar-foreground": colors.neutral10,
  // Also the selected item of the settings navigation, which draws a faint
  // ring of --worktree-sidebar-ring around it. Orca wants it opaque.
  "--worktree-sidebar-accent": colors.neutral140,
  "--worktree-sidebar-accent-foreground": colors.neutral10,
  "--worktree-sidebar-border": colors.neutral140,
  // Orca draws the ring of the selected settings item at a quarter of this
  // color's opacity, a gray stroke around its tile. Focus rings in the
  // workspace sidebar take it too.
  "--worktree-sidebar-ring": colors.neutral10,
  // The current workspace: a blue tint with a blue border, as in the dark
  // theme. blueTint15 is about as strong on the frame (1.22:1) as the dark
  // theme's blueTint25 is on its shell (1.26:1); blueTint10, the tint of
  // Armada Light's own active tab, is 1.14:1 here.
  "--worktree-sidebar-active": colors.blueTint15,
  "--worktree-sidebar-active-border": colors.blueTint50,
  // On every workspace row, so it stays quiet
  "--host-badge": colors.darkTint7,
  "--host-badge-foreground": colors.neutral60,

  // The strip of tabs, part of the frame. The active tab is the current
  // workspace's blue, blueTint15 over the frame: #D4E4F6. Orca wants it
  // opaque.
  "--tab-bar": colors.neutral160,
  "--tab-active": over(colors.blueTint15, colors.neutral160),
  "--tab-active-foreground": colors.neutral10,
  // Armada's accent, solid: Armada Light's own line, blueTint50, is under
  // 2:1 on the tab, and Orca then paints the tab's text color. The same line
  // marks the active tool of the right sidebar.
  "--tab-active-indicator": colors.blue90,
  // The strip's own color: a tab that is not active is told by its text
  "--tab-inactive": colors.neutral160,
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
