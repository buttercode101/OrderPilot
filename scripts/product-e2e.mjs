import assert from "node:assert/strict";
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const out = process.env.QA_OUTPUT || "/workspace/screenshots";
mkdirSync(out, { recursive: true });
let server;
if (process.env.QA_SERVE) {
  server = spawn("npm", ["run", process.env.QA_SERVE, "--", "--host", "127.0.0.1"], {
    stdio: "inherit",
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: JSON.parse(process.env.CHROMIUM_EXTRA_ARGS || '["--no-sandbox"]'),
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  acceptDownloads: true,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const checks = [];
const click = async (name) => page.getByRole("button", { name, exact: true }).first().click();
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("orderpilot-v1")).state);
try {
  await page.goto(base);
  await page.getByRole("button", { name: "New enquiry", exact: true }).first().waitFor();
  await page.screenshot({ path: `${out}/orderpilot-desktop.png`, fullPage: true });
  for (const width of [320, 375, 768, 1120]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `overflow at ${width}`,
    );
  }
  checks.push("Initial inbox at 320, 375, 768 and 1120px");
  await page.setViewportSize({ width: 375, height: 844 });
  await click("Business");
  await page.getByRole("tab", { name: "Data & backups", exact: true }).click();
  await click("Start blank on this device");
  await click("Yes, wipe this device");
  await page.getByRole("tab", { name: "Business profile", exact: true }).click();
  await page.getByLabel("Business name", { exact: true }).fill("Rama Services");
  await page.getByLabel("Your name", { exact: true }).fill("Rama");
  await click("Price book");
  await click("Add a price");
  await page.getByLabel("Name", { exact: true }).fill("Consultation");
  await page.getByLabel("Amount", { exact: true }).fill("125.50");
  await click("Add this price");
  assert.equal((await state()).prices.length, 1);
  await click("New enquiry");
  await page
    .getByLabel("Customer message", { exact: true })
    .fill(
      "Hi, I am Lerato. I need a consultation for 2 hours next Saturday in Sandton. 082 123 4567",
    );
  await click("Save and open the quote");
  await page.getByRole("heading", { name: "Lerato", exact: true }).waitFor();
  assert.equal((await state()).enquiries.length, 1);
  assert.equal((await state()).enquiries[0].lines[0].unitPrice, 125.5);
  checks.push("Blank setup, own price book, enquiry extraction and quote");
  await page.getByLabel("Next follow-up").fill("2026-10-20");
  assert.equal((await state()).enquiries[0].followUpOn, "2026-10-20");
  await page.reload();
  await page.getByRole("button", { name: "New enquiry", exact: true }).first().waitFor();
  const card = page.locator(".op-enquiry-row").filter({ hasText: "Lerato" });
  await card.click();
  assert.equal(await page.getByLabel("Next follow-up").inputValue(), "2026-10-20");
  await click("Read with AI");
  await page.getByText("AI reading is not enabled on this deployment.", { exact: false }).waitFor();
  assert.equal((await state()).enquiries.length, 1);
  checks.push("Persistence after reload, follow-up and disabled-AI fallback");
  if (await page.getByRole("button", { name: "The quote is ready", exact: true }).count())
    await click("The quote is ready");
  await click("Mark sent");
  assert.equal((await state()).enquiries[0].status, "sent");
  await click("Won");
  await click("Mark paid");
  assert.equal((await state()).enquiries[0].status, "paid");
  assert.ok((await state()).enquiries[0].paidAt);
  checks.push("Sent → won → paid tracking");
  const href = await page
    .getByRole("link", { name: "Open WhatsApp", exact: true })
    .getAttribute("href");
  assert.match(href, /wa.me\/27821234567/);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: `${out}/orderpilot-quote.pdf`, format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  checks.push("Customer WhatsApp target and PDF rendering");
  await page.screenshot({ path: `${out}/orderpilot-mobile-detail.png`, fullPage: true });
  await page.getByRole("tab", { name: "Quote", exact: true }).press("ArrowRight");
  assert.equal(
    await page.getByRole("tab", { name: "Job details", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  await click("Edit details");
  await page.getByLabel("Notes", { exact: true }).fill("Verified design refresh");
  await page.getByRole("tab", { name: "Conversation", exact: true }).click();
  await page.getByLabel("Customer reply", { exact: true }).fill("We are in Sandton. Thank you.");
  await click("Add this reply");
  await page.getByRole("tab", { name: "Quote", exact: true }).click();
  assert.equal((await state()).enquiries[0].notes, "Verified design refresh");
  await click("Enquiries");
  await page.getByLabel("Search enquiries", { exact: true }).fill("nothing-matches");
  await page.getByRole("heading", { name: "No enquiries to show" }).waitFor();
  await click("Clear search");
  await page.getByRole("button", { name: "Board view", exact: true }).click();
  await page.getByLabel("Filter by stage", { exact: true }).selectOption("paid");
  assert.equal(await page.locator(".op-deal-card").count(), 1);
  await page.locator(".op-deal-card").click();
  checks.push(
    "Quote / details / conversation tabs, editable notes, reply merge, search and pipeline filters",
  );
  await click("Business");
  await page.getByRole("tab", { name: "Data & backups", exact: true }).click();
  const download = page.waitForEvent("download");
  await click("Export backup");
  const file = await download;
  await file.saveAs(`${out}/backup.json`);
  const original = readFileSync(`${out}/backup.json`, "utf8");
  assert.equal(JSON.parse(original).data.enquiries.length, 1);
  await click("Start blank on this device");
  await click("Yes, wipe this device");
  await page.getByLabel("Import backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"bogus"}'),
  });
  await page.getByText("This is not a valid OrderPilot backup.", { exact: false }).waitFor();
  assert.equal((await state()).enquiries.length, 0);
  await page.getByLabel("Import backup").setInputFiles(`${out}/backup.json`);
  await click("Replace with this backup");
  assert.equal((await state()).enquiries.length, 1);
  checks.push("Backup download, invalid-import rejection and restore");
  await page.goto(base + "/ask?biz=Rama%20Services&trade=other&phone=0821234567");
  await page.getByRole("heading", { name: "Tell Rama Services what you need" }).waitFor();
  await page.getByLabel("Your name", { exact: true }).fill("Guest");
  await page.getByLabel("Phone or email", { exact: true }).fill("guest@example.com");
  await page.getByLabel("What do you need?", { exact: true }).fill("Consultation");
  await click("Make my message");
  await page.getByRole("heading", { name: "Send this to Rama Services" }).waitFor();
  assert.match(
    await page.getByRole("link", { name: "Open WhatsApp", exact: true }).getAttribute("href"),
    /wa.me\/27821234567/,
  );
  checks.push("Guest form prepares a message addressed to the business");
  assert.deepEqual(errors, []);
  checks.push("No uncaught browser errors");
  writeFileSync(
    `${out}/product-e2e.json`,
    JSON.stringify({ base, passed: true, checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, checks }));
} catch (error) {
  console.error("FAILED PAGE:", await page.locator("body").innerText());
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  throw error;
} finally {
  await browser.close();
  if (server) server.kill();
}
