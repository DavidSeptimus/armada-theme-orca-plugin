// Code colors only the Orca theme needs, added after the theme's own so they
// win. Orca reads neither semantic tokens nor selectors with a parent scope,
// and its built-in languages are Monaco's: each reports Monaco's token names
// (`tag.html`, `attribute.name.css`), and Orca colors a name through one
// TextMate scope that carries no language (`tag` reads `entity.name.tag`). So
// the colors Armada gives one language through its TextMate scopes never
// reach Orca's built-in languages. The rules below restore them by naming
// Monaco's own tokens, which Orca passes to the editor as written. Each names
// the rule of armada.ts it stands in for.
//
// A Monaco name on Orca's BUILT_IN_SPECIFIC_TOKENS list cannot be set this
// way: Orca writes its own rule for it after the theme's
// (plugin-monaco-token-rules.ts in stablyai/orca). JSON keys
// (`string.key.json`) are one, so they are colored through the scope Orca
// reads them by.

/** @param {Record<string, string>} colors Armada's palette */
export const tokenColors = (colors) => [
  // Decorators and annotations: `decorator` in vscodeSemanticTokenColors
  { scope: "meta.decorator", settings: { foreground: colors.lime } },
  // JSON keys, as support.type.property-name.json. Orca reads Monaco's
  // `string.key` and `key` tokens through this scope.
  {
    scope: "support.type.property-name",
    settings: { foreground: colors.violet },
  },
  // Tag names, as entity.name.tag.html and entity.name.tag.localname.xml
  { scope: ["tag.html", "tag.xml"], settings: { foreground: colors.blue } },
  // Selectors, as entity.name.tag.css
  {
    scope: ["tag.css", "tag.scss", "tag.less"],
    settings: { foreground: colors.violet },
  },
  // Property names, as support.type.property-name.css
  {
    scope: ["attribute.name.css", "attribute.name.scss"],
    settings: { foreground: colors.cyan },
  },
  // Keys, as entity.name.tag.yaml: Monaco's YAML reports a key as `type`
  { scope: "type.yaml", settings: { foreground: colors.cyan } },
  // Decorators, as meta.function.decorator.python: Monaco's Python reports
  // one as `tag`
  { scope: "tag.python", settings: { foreground: colors.lime } },
];
