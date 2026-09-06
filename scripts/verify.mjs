import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || "/opt/brave.com/brave/brave",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [];
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 120000 });
await page.locator(".scene-poster-hidden").waitFor({ timeout: 30000 });
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/event-horizon-desktop.png" });
assert.equal(await page.locator("main > section").count(), 4);
await page.getByRole("button", { name: "Pause scene animation" }).click();
assert.equal(
  await page
    .getByRole("button", { name: "Play scene animation" })
    .getAttribute("aria-pressed"),
  "true",
);
await page.getByRole("button", { name: "Play scene animation" }).click();
await page.getByRole("button", { name: "FEEL THE PULL" }).click();
assert.equal(await page.locator("#feature-detail-0").isVisible(), true);
await page.getByRole("button", { name: "FEEL THE PULL" }).click();
assert.equal(await page.locator("#feature-detail-0").isVisible(), false);
for (const id of ["concept", "discover", "transmission"]) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
}
await page.evaluate(() => document.activeElement?.blur());
await page.screenshot({ path: "/tmp/event-horizon-full.png", fullPage: true });
await page.getByLabel("Your email address").fill("explorer@example.com");
await page.getByRole("button", { name: "Join the expedition" }).click();
await page.getByText("You’re on the flight manifest.").waitFor();
assert.equal(
  await page.evaluate(() => localStorage.getItem("event-horizon-joined")),
  "true",
);
assert.equal(
  await page.evaluate(() =>
    JSON.stringify(localStorage).includes("explorer@example.com"),
  ),
  false,
);
await page.reload({ waitUntil: "networkidle" });
await page.getByText("You’re on the flight manifest.").waitFor();
await page.getByRole("button", { name: "Leave the manifest" }).click();
await page.getByRole("button", { name: "Privacy", exact: true }).click();
assert.equal(await page.locator("dialog").isVisible(), true);
await page.keyboard.press("Escape");
assert.equal(await page.locator("dialog").isVisible(), false);
console.log(
  "Desktop: scene initialized, four sections, motion controls, feature disclosure, signup persistence, data privacy, modal passed.",
);

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 120000 });
await page.locator(".scene-poster-hidden").waitFor({ timeout: 30000 });
await page.waitForFunction(
  () =>
    getComputedStyle(document.querySelector("h1")).filter === "blur(0px)" &&
    getComputedStyle(document.querySelector("h1")).opacity === "1",
);
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/event-horizon-mobile.png" });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.getByRole("button", { name: "Open menu" }).click();
await page
  .getByRole("navigation", { name: "Mobile navigation" })
  .getByText("Discover")
  .click();
assert.equal(await page.locator("#mobile-nav").count(), 0);
assert.equal(new URL(page.url()).hash, "#discover");
console.log(
  "Mobile: no horizontal overflow; navigation opens, follows section link, and closes.",
);

await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 120000 });
await page.locator(".scene-poster-hidden").waitFor();
assert.equal(
  await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  ),
  "auto",
);
await page.evaluate(() =>
  document
    .querySelector("canvas")
    .getContext("webgl2")
    .getExtension("WEBGL_lose_context")
    .loseContext(),
);
await page.locator(".scene-poster:not(.scene-poster-hidden)").waitFor();
console.log(
  "Accessibility/fallback: reduced motion respected; WebGL context loss restores the poster.",
);
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "All browser checks passed. Screenshots saved in /tmp/event-horizon-*.png",
);
