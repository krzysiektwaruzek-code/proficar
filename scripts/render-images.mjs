// Generuje favicony PNG i grafikę Open Graph (typograficzną – bez zdjęć) z użyciem Playwright.
// Uruchom: node scripts/render-images.mjs  (wymaga globalnego pakietu playwright + Chromium)
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src", "static");
const svg = await readFile(join(out, "favicon.svg"), "utf8");
const font = (f) => `data:font/woff2;base64,${readFileSync(join(out, "assets/fonts", f)).toString("base64")}`;

// playwright z lokalnego node_modules albo z globalnej instalacji
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  const globalRoot = execSync("npm root -g").toString().trim();
  ({ chromium } = createRequire(join(globalRoot, "noop.js"))("playwright"));
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = name === "apple-touch-icon.png" ? svg.replace('rx="16"', 'rx="0"') : svg;
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${inner}`);
  await page.screenshot({ path: join(out, name), omitBackground: true });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head><style>
@font-face{font-family:A;src:url(${font("archivo-latin-ext.woff2")});unicode-range:U+0100-02BA}
@font-face{font-family:A;src:url(${font("archivo-latin.woff2")});unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:I;src:url(${font("inter-latin-ext.woff2")});unicode-range:U+0100-02BA}
@font-face{font-family:I;src:url(${font("inter-latin.woff2")});unicode-range:U+0000-00FF,U+2000-206F}
*{box-sizing:border-box}html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:I;color:#fff;
background:radial-gradient(900px 500px at 95% 0%,rgba(255,91,31,.35),transparent 60%),linear-gradient(160deg,#14181d,#0b0d10);position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:60px 60px}
.ring{position:absolute;right:-120px;top:50%;width:560px;height:560px;transform:translateY(-50%);border-radius:50%;border:34px dashed rgba(255,255,255,.1)}
.ring2{position:absolute;right:30px;top:50%;width:260px;height:260px;transform:translateY(-50%);border-radius:50%;border:2px solid rgba(255,91,31,.7)}
.wrap{position:absolute;left:80px;top:78px;right:420px}
.brand{display:flex;align-items:center;gap:18px;font-family:A;font-weight:900;font-stretch:112%;font-size:38px;letter-spacing:.03em}
.mark{width:64px;height:64px}
h1{font-family:A;font-weight:800;font-stretch:84%;font-size:74px;line-height:.98;letter-spacing:-.03em;margin:54px 0 0}
h1 span{color:#ff7a45}
.meta{position:absolute;left:80px;bottom:70px;display:flex;gap:36px;font-size:26px;color:#c9d0da;font-weight:500}
.meta b{color:#fff;font-weight:700}
</style></head><body><div class="grid"></div><div class="ring"></div><div class="ring2"></div>
<div class="wrap"><div class="brand"><div class="mark">${svg}</div>PROFICAR</div>
<h1><span>Mechanika pojazdowa,</span> wymiana opon i klimatyzacja</h1></div>
<div class="meta"><span><b>Gdańsk</b> · ul. Jana Kochanowskiego 130</span><span><b>tel. 515 460 727</b></span></div>
</body></html>`);
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "assets/img/og-image.png") });
await browser.close();
console.log("✓ Wygenerowano favicony i og-image.png");
