// Run with an existing Playwright installation on NODE_PATH; no production API is contacted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { setup, lead } from "./navigation-fixtures.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");

const origin = process.env.LEAD_TEST_ORIGIN || "http://127.0.0.1:3020";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "tests require a local server");
const tabs = [
  ["Profile", ""], ["Timeline", "/timeline"], ["Visits", "/visits"],
  ["Follow-ups", "/follow-ups"], ["Contacts", "/contacts"],
];

async function open(t, options = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const requests = await setup(context, origin, options);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(async () => {
    await browser.close();
    assert.deepEqual(errors, [], "no browser runtime errors");
  });
  return { page, requests };
}

async function settled(page) {
  await page.waitForLoadState("networkidle");
}

async function select(page, label) {
  await page.getByRole("tab", { name: label, exact: true }).click();
  await page.getByRole("tab", { name: label, exact: true, selected: true }).waitFor();
}

function counts(requests) {
  return requests.reduce((result, { path, method }) => {
    const key = `${method} ${path}`;
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

test("tab navigation preserves shell nodes and only reloads the selected workflow", async (t) => {
  const { page, requests } = await open(t, { delay: 250 });
  let documents = 0;
  page.on("request", (request) => { if (request.resourceType() === "document") documents++; });
  await page.goto(`${origin}/leads/test-a`);
  await page.getByText("Navigation test-a", { exact: true }).first().waitFor();
  await settled(page);
  await page.evaluate(() => {
    window.navigationNodes = {
      nav: document.querySelector('[aria-label="Lead profile sections"]'),
      header: document.querySelector("header"),
      profile: document.querySelector('[aria-label="Lead profile sections"]').previousElementSibling,
    };
  });
  const start = requests.length;
  const retained = [];
  for (const [label, suffix] of [...tabs.slice(1), tabs[0]]) {
    await select(page, label);
    assert.equal(new URL(page.url()).pathname, `/leads/test-a${suffix}`);
    if (suffix) {
      await page.getByText(label === "Timeline" ? "Loading Lead timeline" : label === "Visits" ? "Loading Lead visits" : label === "Follow-ups" ? "Loading Lead follow-ups" : "Loading Lead contact history", { exact: true }).waitFor();
      assert.equal(await page.getByText("Loading Lead profile", { exact: true }).count(), 0);
      assert(await page.evaluate(() => Object.values(window.navigationNodes).every((node) => node.isConnected)));
    }
    await settled(page);
    retained.push(await page.evaluate(() => ({
      nav: window.navigationNodes.nav === document.querySelector('[aria-label="Lead profile sections"]'),
      header: window.navigationNodes.header === document.querySelector("header"),
    })));
  }
  t.diagnostic(JSON.stringify({ documents, retained, requests: counts(requests.slice(start)) }));
  assert.equal(documents, 1, "tabs use client navigation, with no document reloads");
  assert(retained.every(({ nav, header }) => nav && header), "shell and tab nodes stay mounted");
  assert.deepEqual(counts(requests.slice(start)), {
    "GET /leads/test-a/timeline": 1, "GET /leads/test-a/visits": 1,
    "GET /leads/test-a/follow-ups": 1, "GET /leads/test-a/contacts": 1,
  });
});

test("all direct links and refreshes select the correct tab; Back/Forward retain the shell", async (t) => {
  const { page } = await open(t);
  for (const [label, suffix] of tabs) {
    await page.goto(`${origin}/leads/test-a${suffix}`);
    await page.getByRole("tab", { name: label, exact: true, selected: true }).waitFor();
    await page.reload();
    await page.getByRole("tab", { name: label, exact: true, selected: true }).waitFor();
  }
  await settled(page);
  await page.evaluate(() => { window.retainedHeader = document.querySelector("header"); });
  await select(page, "Timeline");
  await select(page, "Visits");
  await page.goBack();
  await page.getByRole("tab", { name: "Timeline", selected: true }).waitFor();
  await page.goForward();
  await page.getByRole("tab", { name: "Visits", selected: true }).waitFor();
  assert(await page.evaluate(() => window.retainedHeader === document.querySelector("header")));
});

test("draft, filters, and shell search survive tabs and reset for another Lead", async (t) => {
  const { page } = await open(t);
  await page.goto(`${origin}/leads/test-a`);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Unsaved navigation draft");
  await page.getByPlaceholder("Search members, plans, staff...").fill("Retained search");
  await select(page, "Timeline");
  await page.getByLabel("Event type").selectOption("LEAD_CREATED");
  await select(page, "Profile");
  assert.equal(await page.getByLabel("Full name", { exact: true }).inputValue(), "Unsaved navigation draft");
  assert.equal(await page.getByPlaceholder("Search members, plans, staff...").inputValue(), "Retained search");
  await select(page, "Timeline");
  assert.equal(await page.getByLabel("Event type").inputValue(), "LEAD_CREATED");
  await page.locator('a[href="/leads"]').first().click();
  await page.getByRole("button", { name: "Open Navigation test-b profile" }).click();
  await page.getByText("Navigation test-b", { exact: true }).first().waitFor();
  assert.equal(await page.getByLabel("Full name", { exact: true }).count(), 0);
  await select(page, "Timeline");
  assert.equal(await page.getByLabel("Event type").inputValue(), "");
});

test("an older workflow response cannot overwrite a newer filter response", async (t) => {
  let release;
  const older = new Promise((resolve) => { release = resolve; });
  t.after(() => release());
  const { page } = await open(t, { respond: async ({ path, query }) => {
    if (path.endsWith("/timeline") && query.includes("LEAD_CREATED")) {
      await older;
      return { status: 500, body: { message: "Obsolete response" } };
    }
  } });
  await page.goto(`${origin}/leads/test-a/timeline`);
  await page.getByLabel("Event type").selectOption("LEAD_CREATED");
  await page.waitForRequest((r) => r.url().includes("eventType=LEAD_CREATED"));
  await page.getByLabel("Event type").selectOption("LEAD_PROFILE_UPDATED");
  await page.getByText("No timeline events found for this Lead.", { exact: true }).waitFor();
  release();
  await settled(page);
  assert.equal(await page.getByText("Obsolete response", { exact: true }).count(), 0);
});

test("a successful Visit refreshes profile and histories and keeps its success message", async (t) => {
  let recorded = false;
  const { page, requests } = await open(t, { respond: ({ path, method }) => {
    if (path.endsWith("/visits") && method === "POST") {
      recorded = true;
      return { body: {} };
    }
    if (path === "/leads/test-a" && recorded) return { body: { ...lead("test-a"), stage: "VISITED" } };
  } });
  await page.goto(`${origin}/leads/test-a`);
  await page.getByRole("button", { name: "Record Visit", exact: true }).click();
  await page.getByLabel("Discussion").fill("Isolated navigation test");
  const start = requests.length;
  await page.getByRole("dialog").getByRole("button", { name: "Record Visit", exact: true }).click();
  await page.getByRole("tab", { name: "Visits", selected: true }).waitFor();
  await page.getByText("Lead visit recorded.", { exact: true }).waitFor();
  await page.getByText("Visited", { exact: true }).waitFor();
  await settled(page);
  for (const path of ["/leads/test-a", "/leads/test-a/visits", "/leads/test-a/timeline"]) {
    assert(requests.slice(start).some((r) => r.method === "GET" && r.path === path));
  }
});

for (const status of [403, 404]) {
  test(`${status} profile errors remain safe across tabs`, async (t) => {
    const { page, requests } = await open(t, { respond: ({ path }) => path === "/leads/test-a" ? { status, body: { message: "Test access response" } } : undefined });
    await page.goto(`${origin}/leads/test-a/contacts`);
    await page.getByText(status === 403 ? "Lead profile unavailable" : "Lead not found", { exact: true }).waitFor();
    assert.equal(await page.getByRole("tab").count(), 0);
    assert(!requests.some((r) => r.path === "/leads/test-a/contacts"));
  });
}

test("a workflow 401 clears the session and redirects", async (t) => {
  const { page } = await open(t, { respond: ({ path }) => path.endsWith("/timeline") ? { status: 401, body: {} } : undefined });
  await page.goto(`${origin}/leads/test-a`);
  await select(page, "Timeline");
  await page.waitForURL(origin + "/");
  assert.equal(await page.evaluate(() => localStorage.getItem("fitcrm.accessToken")), null);
});

test("a pending workflow 401 is still handled after switching back to Profile", async (t) => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  t.after(() => release());
  const { page } = await open(t, { respond: async ({ path }) => {
    if (path.endsWith("/timeline")) {
      await pending;
      return { status: 401, body: {} };
    }
  } });
  await page.goto(`${origin}/leads/test-a`);
  const started = page.waitForRequest((r) => r.url().includes("/test-a/timeline"));
  await select(page, "Timeline");
  await started;
  await select(page, "Profile");
  release();
  await page.waitForURL(origin + "/");
  assert.equal(await page.evaluate(() => localStorage.getItem("fitcrm.accessToken")), null);
});

test("a pending mutation refresh cannot navigate back to the previous Lead", async (t) => {
  let recorded = false;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  t.after(() => release());
  const { page } = await open(t, { respond: async ({ path, method }) => {
    if (path.endsWith("/visits") && method === "POST") { recorded = true; return { body: {} }; }
    if (path === "/leads/test-a" && recorded) await pending;
  } });
  await page.goto(`${origin}/leads/test-a`);
  await page.getByRole("button", { name: "Record Visit", exact: true }).click();
  await page.getByLabel("Discussion").fill("Isolated navigation test");
  const refreshing = page.waitForRequest((r) => new URL(r.url()).pathname === "/leads/test-a");
  await page.getByRole("dialog").getByRole("button", { name: "Record Visit", exact: true }).click();
  await refreshing;
  await page.locator('a[href="/leads"]').first().click();
  await page.getByRole("button", { name: "Open Navigation test-b profile" }).click();
  await page.getByText("Navigation test-b", { exact: true }).first().waitFor();
  release();
  await settled(page);
  assert.equal(new URL(page.url()).pathname, "/leads/test-b");
  assert.equal(await page.getByText("Lead visit recorded.", { exact: true }).count(), 0);
});

for (const role of ["CRM_OWNER", "ORGANIZATION_OWNER", "BRANCH_ADMIN", "RECEPTIONIST", "LEAD_CALLER"]) {
  test(`${role} retains Lead access rules`, async (t) => {
    const { page, requests } = await open(t, { user: { role } });
    await page.goto(`${origin}/leads/test-a/visits`);
    if (role === "LEAD_CALLER") {
      await page.getByText("Lead Management is not available", { exact: true }).waitFor();
      await settled(page);
      assert(!requests.some((r) => r.path.startsWith("/leads/")));
    } else {
      await page.getByRole("tab", { name: "Visits", selected: true }).waitFor();
      await select(page, "Contacts");
    }
  });
}
