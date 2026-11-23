// Armada's app colors for Orca, whose themes set a short list of CSS variables
// in place of VS Code's workbench colors. Written against Armada's named
// palette (`palette` in Tachi Code's armada.ts), not derived from the theme's
// workbench colors: several of those are shaped for VS Code's own parts (its
// active tab is a translucent blue fill) and have no counterpart here.
//
// Orca drops a text and surface pair under its contrast floor and paints its
// own colors instead; scripts/build-theme.mjs fails on one.
//
// The layout follows Armada's Islands shell: the sidebars, the tab strip and
// the chat are the dark shell, and the editor is the surface on it.

/** @param {Record<string, string>} colors Armada's palette */
export const appTokens = (colors) => ({
  "--background": colors.neutral10,
  "--editor-surface": colors.neutral20,
  "--foreground": colors.neutral140,
  // Orca paints its status bar with the card color too
  "--card": colors.neutral30,
  "--card-foreground": colors.neutral140,
  "--popover": colors.neutral30,
  "--popover-foreground": colors.neutral140,
  // White, not the body text: neutral140 on blue90 is under 4.5:1
  "--primary": colors.blue90,
  "--primary-foreground": colors.white,
  "--secondary": colors.neutral40,
  "--secondary-foreground": colors.neutral140,
  "--muted": colors.neutral30,
  "--muted-foreground": colors.neutral120,
  // Orca's one fill for hovered buttons and rows and for the highlighted item
  // of a menu. Gray, as hover is in Armada: a blue here also fills buttons.
  "--accent": colors.neutral40,
  "--accent-foreground": colors.neutral140,
  "--border": colors.neutral30,
  "--input": colors.neutral10,
  "--ring": colors.blue90,
  // One blue from light to dark, as Orca's own chart colors are. Orca also
  // draws Mermaid diagrams from them: --chart-5 fills a node and --chart-1
  // outlines it, and a fill the text is not readable on is darkened to mud.
  "--chart-1": colors.blue120,
  "--chart-2": colors.blue100,
  "--chart-3": colors.blue90,
  "--chart-4": colors.blue70,
  "--chart-5": colors.blue60,

  // The right sidebar and the settings navigation
  "--sidebar": colors.neutral10,
  "--sidebar-foreground": colors.neutral140,
  "--sidebar-primary": colors.blue90,
  "--sidebar-primary-foreground": colors.white,
  "--sidebar-accent": colors.neutral30,
  "--sidebar-accent-foreground": colors.neutral140,
  "--sidebar-border": colors.neutral40,
  "--sidebar-ring": colors.blue90,

  // The left workspace sidebar
  "--worktree-sidebar": colors.neutral10,
  "--worktree-sidebar-foreground": colors.neutral140,
  // Also the selected item of the settings navigation, which draws a faint
  // ring of --worktree-sidebar-ring around it. Orca wants it opaque.
  "--worktree-sidebar-accent": colors.neutral30,
  "--worktree-sidebar-accent-foreground": colors.neutral140,
  "--worktree-sidebar-border": colors.neutral40,
  // Orca draws the ring of the selected settings item at a quarter of this
  // color's opacity. blue130 at a quarter is as light as the current
  // workspace row's border (blueTint50); blue90 at a quarter is half that.
  "--worktree-sidebar-ring": colors.blue130,
  // The current workspace: the selection tint of the lists in Tachi Code
  "--worktree-sidebar-active": colors.blueTint25,
  "--worktree-sidebar-active-border": colors.blueTint50,
  // On every workspace row, so it stays quiet
  "--host-badge": colors.lightTint10,
  "--host-badge-foreground": colors.neutral130,

  // The active tab is a navy fill, as in Tachi Code, near the current
  // workspace row's tint over the shell. Orca draws the line only when a
  // group has more than one tab, so the fill is what marks a lone tab.
  "--tab-bar": colors.neutral10,
  "--tab-active": "#0D2340",
  "--tab-active-foreground": colors.white,
  // Orca drops a line under 2:1 on the tab and paints the tab's text color
  "--tab-active-indicator": "#2754AA",
  "--tab-inactive": colors.neutral10,
  "--tab-inactive-foreground": colors.neutral120,
  "--split-divider": colors.neutral40,
  "--split-divider-hover": colors.blue90,

  "--chat-user-message": colors.lightTint8,
  "--chat-bold-foreground": colors.white,
  "--chat-muted-foreground": colors.neutral120,
  "--chat-inline-code": colors.lightTint10,
  "--chat-inline-code-foreground": colors.neutral140,
  "--chat-code-block": colors.lightTint5,
  // The blue110 of Tachi Code's links. It is 4.5:1 on the inline code tint
  // only because --background is this dark, and Orca drops the user's message
  // bubble when it is under 4.5:1 on that.
  "--text-link": colors.blue110,
  // Translucent, so find matches show through: blue60 as a tint on the editor
  "--editor-selection": colors.blueTint50,
  // The same tint as the editor's
  "--chat-selection": colors.blueTint50,
  "--chat-selection-foreground": colors.neutral140,

  "--diff-added": colors.green120,
  "--diff-added-background": colors.greenTint10,
  "--diff-added-emphasis": colors.greenTint30,
  "--diff-added-gutter": colors.greenTint20,
  "--diff-removed": colors.red120,
  "--diff-removed-background": colors.redTint10,
  "--diff-removed-emphasis": colors.redTint30,
  "--diff-removed-gutter": colors.redTint20,
  "--git-decoration-added": colors.green120,
  "--git-decoration-modified": colors.blue120,
  "--git-decoration-deleted": colors.neutral90,
  "--git-decoration-renamed": colors.blue120,
  "--git-decoration-untracked": colors.red120,
  "--git-decoration-copied": colors.green120,
  "--git-decoration-ignored": colors.orange,
});
