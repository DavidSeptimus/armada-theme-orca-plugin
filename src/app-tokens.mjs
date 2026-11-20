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
// the status bar are the dark shell, and the editor, the chat and the active
// tab are the surfaces on it.

/** @param {Record<string, string>} colors Armada's palette */
export const appTokens = (colors) => ({
  "--background": colors.neutral20,
  "--editor-surface": colors.neutral20,
  "--foreground": colors.neutral140,
  // Orca paints its status bar with the card color, so cards take the shell's
  // color to keep one frame around the surfaces
  "--card": colors.neutral10,
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
  "--border": colors.neutral40,
  "--input": colors.neutral50,
  "--ring": colors.blue90,
  "--chart-1": colors.blue110,
  "--chart-2": colors.green110,
  "--chart-3": colors.yellow120,
  "--chart-4": colors.purple110,
  "--chart-5": colors.orange,

  // The right sidebar and the settings navigation
  "--sidebar": colors.neutral10,
  "--sidebar-foreground": colors.neutral140,
  "--sidebar-primary": colors.blue90,
  "--sidebar-primary-foreground": colors.white,
  "--sidebar-accent": colors.neutral30,
  "--sidebar-accent-foreground": colors.neutral140,
  "--sidebar-border": colors.neutral30,
  "--sidebar-ring": colors.blue90,

  // The left workspace sidebar
  "--worktree-sidebar": colors.neutral10,
  "--worktree-sidebar-foreground": colors.neutral140,
  // Also the selected item of the settings navigation, which draws a faint
  // ring of --worktree-sidebar-ring around it. Orca wants it opaque, so this
  // is blueTint25 as it paints over neutral10: the settings selection then
  // matches the current workspace row below.
  "--worktree-sidebar-accent": "#092340",
  "--worktree-sidebar-accent-foreground": colors.neutral140,
  "--worktree-sidebar-border": colors.neutral30,
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

  // The active tab joins the editor under it; the line marks it. Not the blue
  // fill of Tachi Code's active tab: Orca draws the line only when a group
  // has more than one tab, so a lone tab would be a fill with no line.
  "--tab-bar": colors.neutral10,
  "--tab-active": colors.neutral20,
  "--tab-active-foreground": colors.white,
  // Near the border of the current workspace row (blueTint50 over its fill,
  // #094a92), a step brighter: Orca drops a line under 2:1 on the tab and
  // paints the tab's text color, and #094a92 is at that limit here.
  "--tab-active-indicator": "#0855ab",
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
  // blue120, not the blue110 of Tachi Code's links: blue110 is under 4.5:1 on
  // the inline code tint
  "--text-link": colors.blue120,
  // Translucent, so find matches show through: blue60 as a tint on the editor
  "--editor-selection": colors.blueTint50,

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
