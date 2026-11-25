// Armada Light's app colors for Orca: the choices of src/app-tokens.mjs in
// Armada Light's palette (`palette` in Tachi Code's armada-light.ts, which
// follows the IntelliJ Armada Light UI theme). It is a map of its own because
// the two palettes share few names: the dark one steps up from the shell
// through neutral20, 30 and 40, and the light one has the frame (neutral150),
// one step lighter (neutral160), white, and the border grays.
//
// Each token names the dark token's role where the two differ. Four values
// are set by the design, not carried over:
//   - the window frame is neutral150 (#EEEFF0), as in JetBrains Air;
//   - islands and cards are white;
//   - the selection is blue130 (#A8C6F4), the IntelliJ theme's;
//   - the current or selected item of a sidebar is marked by a near-black
//     stroke on a gray tile, never a blue fill, which would sit against the
//     blue of a badge.
//
// Orca drops a text and surface pair under its contrast floor and paints its
// own colors instead; scripts/build-theme.mjs fails on one.

/** @param {Record<string, string>} colors Armada Light's palette */
export const appTokens = (colors) => ({
  // The frame: the sidebars, the tab strip and the chat. The editor is the
  // white island on it.
  "--background": colors.neutral150,
  "--editor-surface": colors.white,
  "--foreground": colors.neutral10,
  // White on the frame, where the dark cards are the color of the page and
  // drawn by their outline. Orca paints its status bar with this color too.
  "--card": colors.white,
  "--card-foreground": colors.neutral10,
  // Menus are white in Armada Light, with a border
  "--popover": colors.white,
  "--popover-foreground": colors.neutral10,
  "--primary": colors.blue90,
  "--primary-foreground": colors.white,
  "--secondary": colors.neutral140,
  "--secondary-foreground": colors.neutral10,
  // Lighter than the frame, as Armada Light's widgets are. The secondary
  // text is under 4.5:1 on neutral140, the next gray down.
  "--muted": colors.neutral160,
  "--muted-foreground": colors.neutral80,
  // Orca's one fill for hovered buttons and rows and for the highlighted item
  // of a menu. Gray, as hover is in Armada: a blue here also fills buttons.
  "--accent": colors.neutral140,
  "--accent-foreground": colors.neutral10,
  "--border": colors.neutral140,
  "--input": colors.neutral130,
  "--ring": colors.blue90,
  // One blue from light to dark, as in the dark theme. Orca draws Mermaid
  // diagrams from these only in a dark theme.
  "--chart-1": colors.blue120,
  "--chart-2": colors.blue100,
  "--chart-3": colors.blue90,
  "--chart-4": colors.blue80,
  "--chart-5": colors.blue70,

  // The right sidebar and the settings navigation
  "--sidebar": colors.neutral150,
  "--sidebar-foreground": colors.neutral10,
  "--sidebar-primary": colors.blue90,
  "--sidebar-primary-foreground": colors.white,
  "--sidebar-accent": colors.neutral140,
  "--sidebar-accent-foreground": colors.neutral10,
  // A step stronger than in the main area, as in the dark theme
  "--sidebar-border": colors.neutral130,
  "--sidebar-ring": colors.blue90,

  // The left workspace sidebar
  "--worktree-sidebar": colors.neutral150,
  "--worktree-sidebar-foreground": colors.neutral10,
  // Also the selected item of the settings navigation, which draws a faint
  // ring of --worktree-sidebar-ring around it. Orca wants it opaque.
  "--worktree-sidebar-accent": colors.neutral140,
  "--worktree-sidebar-accent-foreground": colors.neutral10,
  "--worktree-sidebar-border": colors.neutral130,
  // Orca draws the ring of the selected settings item at a quarter of this
  // color's opacity: the near-black stroke of a selected item. Focus rings in
  // the workspace sidebar take it too.
  "--worktree-sidebar-ring": colors.neutral10,
  // The current workspace: a gray tile with a near-black stroke, where the
  // dark theme has a blue tint and a blue border at the same strengths
  "--worktree-sidebar-active": colors.darkTint10,
  "--worktree-sidebar-active-border": colors.darkTint50,
  // On every workspace row, so it stays quiet
  "--host-badge": colors.darkTint10,
  "--host-badge-foreground": colors.neutral60,

  // The active tab is blueTint10 over the frame, Armada Light's active tab.
  // Orca wants it opaque.
  "--tab-bar": colors.neutral150,
  "--tab-active": "#D7E2EF",
  "--tab-active-foreground": colors.neutral10,
  // Near-black: the same line marks the active tool of the right sidebar
  "--tab-active-indicator": colors.neutral10,
  "--tab-inactive": colors.neutral150,
  "--tab-inactive-foreground": colors.neutral80,
  "--split-divider": colors.neutral130,
  "--split-divider-hover": colors.blue90,

  // A step lighter than the chat, as the dark bubble is. A dark tint here
  // puts a link in inline code under 4.5:1, and Orca then drops the tint.
  "--chat-user-message": colors.neutral160,
  // The palette has nothing darker than the body text
  "--chat-bold-foreground": colors.neutral10,
  "--chat-muted-foreground": colors.neutral80,
  "--chat-inline-code": colors.darkTint5,
  "--chat-inline-code-foreground": colors.neutral10,
  // The editor's background
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
