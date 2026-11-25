// Code colors only the Orca theme needs, for Armada Light. See
// src/token-colors.mjs for why they are needed. Each names the rule of
// armada-light.ts it stands in for, and takes that rule's color: none is
// carried over from the dark theme.
//
// The dark list also names `tag.html` and `tag.xml`. Armada Light colors
// those as it does every tag (`entity.name.tag`), which Orca already reads.

/** @param {Record<string, string>} colors Armada Light's palette */
export const tokenColors = (colors) => [
  // Decorators and annotations: `decorator` in vscodeSemanticTokenColors
  { scope: "meta.decorator", settings: { foreground: colors.lime } },
  // JSON keys, as support.type.property-name.json. Orca reads Monaco's
  // `string.key` and `key` tokens through this scope.
  {
    scope: "support.type.property-name",
    settings: { foreground: colors.violet },
  },
  // Selectors, as entity.name.tag.css
  {
    scope: ["tag.css", "tag.scss", "tag.less"],
    settings: { foreground: colors.violet },
  },
  // Property names, as support.type.property-name.css
  {
    scope: ["attribute.name.css", "attribute.name.scss", "attribute.name.less"],
    settings: { foreground: colors.teal },
  },
  // Keys, as entity.name.tag.yaml: Monaco's YAML reports a key as `type`
  { scope: "type.yaml", settings: { foreground: colors.teal } },
  // Decorators, as entity.name.function.decorator.python: Monaco's Python
  // reports one as `tag`
  { scope: "tag.python", settings: { foreground: colors.lime } },
];
