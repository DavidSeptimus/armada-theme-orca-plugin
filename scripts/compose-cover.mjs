// Makes the cover of the plugin's page: Armada in front and above, Armada Light behind and below,
// on Armada's navy. `npm run screenshots` takes the two pictures it uses, and runs this at the
// end when it has taken both themes.
//
//   npm run cover
//
// Needs ImageMagick 7 (`magick`). The cover is a WebP: the same picture as a PNG is over Orca's
// limit of 1024 KB for a cover, because a gradient and soft shadows do not compress in a PNG.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshots = join(root, "screenshots");
const out = join(screenshots, "cover-both.webp");

// 16:10, as Orca asks, and the size of the screenshots
const width = 3200;
const height = 2000;
const COVER_MAX_BYTES = 1024 * 1024;

// Armada's palette (Tachi Code's armada.ts): the navies of the dark theme's active tab and
// selection, and the accent
const blue20 = "#111926";
const blue60 = "#225090";
const blue90 = "#0870E4";

// Each window: its width, and where the top left corner of its picture with the shadow around
// it goes. The window itself is 80 to the right of that and 56 below. Armada Light is drawn first.
const windowWidth = 2100;
const light = { picture: join(screenshots, "light/cover.png"), x: 1000, y: 600 };
const dark = { picture: join(screenshots, "cover.png"), x: 20, y: 30 };
const cornerRadius = 28;

for (const { picture } of [light, dark]) {
  if (!existsSync(picture)) throw new Error(`${picture} is missing. Run npm run screenshots first.`);
}

const work = mkdtempSync(join(tmpdir(), "armada-cover-"));
// Composed here first: a cover over the limit must not replace the one in the folder
const composed = join(work, "cover-both.webp");
const magick = (...args) => execFileSync("magick", args, { stdio: ["ignore", "ignore", "inherit"] });

try {
  // The background: blue20 to blue60 from left to right, darker toward the bottom, with a glow of
  // the accent behind where the two windows meet
  const background = join(work, "background.png");
  magick(
    "(", "-size", `${height}x${width}`, `gradient:${blue20}-${blue60}`, "-rotate", "-90", ")",
    "(", "-size", `${width}x${height}`, "gradient:#11192600-#0B1220AA", ")",
    "-compose", "over", "-composite",
    "(", "-size", "2600x2600", `radial-gradient:${blue90}40-${blue90}00`, ")",
    "-geometry", "+1500+200", "-compose", "over", "-composite",
    "-crop", `${width}x${height}+0+0`, "+repage",
    background,
  );

  // A window: the picture with round corners and a shadow under it
  const corner = `fill black polygon 0,0 0,${cornerRadius} ${cornerRadius},0 fill white circle ${cornerRadius},${cornerRadius} ${cornerRadius},0`;
  const windowOf = ({ picture }, name) => {
    const file = join(work, `${name}.png`);
    magick(
      picture, "-resize", `${windowWidth}x`,
      "(", "+clone", "-alpha", "extract", "-draw", corner,
      "(", "+clone", "-flip", ")", "-compose", "Multiply", "-composite",
      "(", "+clone", "-flop", ")", "-compose", "Multiply", "-composite", ")",
      "-alpha", "off", "-compose", "CopyOpacity", "-composite",
      file,
    );
    magick(
      file, "(", "+clone", "-background", "black", "-shadow", "55x40+0+24", ")",
      "+swap", "-background", "none", "-layers", "merge", "+repage",
      file,
    );
    return file;
  };

  magick(
    background,
    windowOf(light, "light"), "-geometry", `+${light.x}+${light.y}`, "-compose", "over", "-composite",
    windowOf(dark, "dark"), "-geometry", `+${dark.x}+${dark.y}`, "-compose", "over", "-composite",
    "-quality", "90", "-define", "webp:method=6",
    composed,
  );

  const bytes = statSync(composed).size;
  if (bytes > COVER_MAX_BYTES) {
    throw new Error(`The cover is ${Math.round(bytes / 1024)} KB, over Orca's ${COVER_MAX_BYTES / 1024} KB for one. ${out} is left as it was.`);
  }
  copyFileSync(composed, out);
} finally {
  rmSync(work, { recursive: true, force: true });
}

const bytes = statSync(out).size;
console.log(`screenshots/cover-both.webp: ${width}x${height}, ${Math.round(bytes / 1024)} KB`);
