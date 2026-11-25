# Armada for Orca

The build for the Armada themes as an Orca plugin: Armada, which is dark, and Armada Light. Each
is an app theme, its code colors, and a terminal palette.

This is the `develop` branch. The `main` branch holds only the files the plugin ships, because
Orca's plugin directory reads every file at a version tag. Its readme, for people who use the
theme, is `README.main.md` here.

## Live editing

```sh
npm run dev [-- <path to armada.ts> [<path to armada-light.ts>]]
```

This loads the folder into the running Orca as a development plugin, which stands in for an
installed copy of the theme, and rebuilds whenever `armada.ts`, `armada-light.ts`, a file under
`src/` or the build script is saved. Orca repaints on each build, so a color change shows a moment after the save. A
build that fails, on a contrast check for one, prints why and leaves the last good colors in
place. Ctrl-C unloads the folder and the installed copy is back.

## How it is built

Everything under `themes/` and `terminal/`, and `orca-plugin.json`, is generated. The source of
truth for the colors is Tachi Code's two Armada themes (`armada.ts` and `armada-light.ts`), which
are also what the VS Code extension is built from. Each provides a theme and its named palette.
What is Orca's own lives in `src/`.

```sh
npm run build [-- <path to armada.ts> [<path to armada-light.ts>]]
npm run validate                         # orca plugin validate .
```

`armada.ts` defaults to `../tachi-code/src/entrypoints/code/shiki/themes/armada.ts`, and
`armada-light.ts` to the file of that name beside it.

The two themes are built the same way, each from its own source: `themes/armada.json` and
`terminal/armada.json` from `armada.ts`, `themes/armada-light.json` and
`terminal/armada-light.json` from `armada-light.ts`. Neither takes a color from the other.

The manifest's id, name, version and description come from `package.json`.

### App colors

Orca themes set about 70 CSS variables (`--background`, `--sidebar`, `--tab-active` and so on).
They are written by hand against each theme's named palette: `src/app-tokens.mjs` for Armada
and `src/app-tokens-light.mjs` for Armada Light. They are not derived from the theme's VS Code
workbench colors, several of which are shaped for VS Code's own parts.

Armada Light has a map of its own because the two palettes share few names. It makes the same
choices as the dark map (which surface is the frame, which the island, what a hover or a border
is) in Armada Light's colors, and says where it could not.

Orca drops any text and surface pair under 4.5:1 contrast and paints its own colors instead, and
likewise a line or focus ring under 2:1 on what it marks. The build runs the same checks and
fails on one that is under the floor.

### Code colors

They come from the theme's `tokenColors`, plus `src/token-colors.mjs` (for Armada Light,
`src/token-colors-light.mjs`) for the colors Armada gives one language, which Orca's built-in languages can only get through rules that name the
editor's own tokens. Orca reads less than VS Code does, and caps a theme file at
16 KiB, so the build cuts the list down:

1. Selectors with a parent scope (`meta.class.body.java variable.other`) are dropped. Orca does
   not read them, nor semantic token colors.
2. A selector that only repeats the style of its parent scope is dropped.
3. A color under 3:1 on the editor, which Orca would replace with its own, is moved toward the
   editor text until it passes.
4. What is left is added until the file is full, in this order:
   - the rules of `src/token-colors.mjs`;
   - the scopes Orca's built-in languages read. Orca's editor is Monaco, whose languages report
     a short list of token names, and Orca colors each through one TextMate scope;
   - the scopes that belong to no one language;
   - each language in `LANGUAGE_ORDER` in `scripts/build-theme.mjs`, whole or not at all;
   - the rest.

The build prints what it dropped, lifted and cut. Scopes that belong to one language are read
only by a syntax plugin that hands Orca raw TextMate scopes, so a language that is cut loses
nothing in Orca's built-in highlighting.

### Terminal colors

The theme's `terminal.*` workbench colors, under Orca's names for them.

## Publishing

On `develop`, with everything else committed:

1. Raise `version` in `package.json`. Orca's directory keeps each listed version for good, so a
   fix to a published version needs a new one.
2. Rebuild, so the manifest gets the new version, and check it:

   ```sh
   npm run build
   npm run validate
   ```

3. If the colors changed, run `npm run screenshots`.
4. In `CHANGELOG.md`, put the notes under "Unreleased" under the new version and its date. The
   file ships with the release.
5. Commit.
6. Cut the release:

   ```sh
   npm run release
   ```

   It commits the shipped files to `main`, with `README.main.md` as their `README.md`, validates
   that commit with `orca plugin validate` and tags it `v<version>`. It does not push.
7. Push the two branches and the tag. The script prints the command:

   ```sh
   git push origin develop main v<version>
   ```

Orca's directory finds the repository by its `orca-plugin` topic and looks for new version tags
every 30 minutes. The listing and its status are at
<https://orca.dev/plugins/DavidSeptimus/armada-theme-orca-plugin>.

## Screenshots

```sh
npm run screenshots [-- dark|light]
```

This rebuilds everything under `screenshots/` from the plugin as it is in this folder, so run
`npm run build` first. Armada's pictures go to `screenshots/` and Armada Light's to
`screenshots/light/`, under the same names; with `dark` or `light`, only that theme's are taken.
For each theme it starts a second copy of Orca whose window is never shown, on a throwaway
profile with its own home folder, so the Orca you are working in is not touched and can stay open.
It installs the themes there, without the pictures the manifest names, selects the theme, opens
the files of `scripts/sample-project` one by one and saves a picture of each. The last one, `cover.png`, is the one for the listing:
a file with a terminal below that prints git output and the 16 terminal colors, the same test the
pictures of Orca's own themes use. After it comes `chat.png`, a chat with an agent. The agent is
`scripts/fake-claude.mjs`, put on the second Orca's path under the name `claude`: it gives the
same answer each time and needs no account. Last come two settings pages, `settings-appearance.png`
and `settings-terminal.png`, for the cards and the controls on them. The second Orca, its profile
and the copy of the sample project are removed at the end.

macOS only. The switch that gives Orca a separate profile is the one its own end-to-end tests use.
It is not a documented option, so an Orca update can break the script.

## License

MIT. See [LICENSE](LICENSE).
