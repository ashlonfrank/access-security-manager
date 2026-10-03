import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readdir, stat } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "darwin" ? { channel: "chrome" } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("verification", { recursive: true });
try {
  page.setDefaultTimeout(10000);
  await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("row").nth(1).waitFor();
  assert.equal(await page.getByRole("row").count(), 14);
  await page.screenshot({ path: "verification/desktop.png", fullPage: true });
  const geometry = await page.evaluate(() => ({
    main: document.querySelector("main").getBoundingClientRect().toJSON(),
    firstRow: document
      .querySelector(".user-row")
      .getBoundingClientRect()
      .toJSON(),
    assets: [...document.querySelectorAll("img")].map((i) => ({
      src: i.getAttribute("src"),
      loaded: i.complete && i.naturalWidth > 0,
      width: i.getBoundingClientRect().width,
      height: i.getBoundingClientRect().height,
    })),
  }));
  assert.equal(geometry.main.x, 260);
  const toggleBox = await page.locator(".segments").boundingBox();
  const addBox = await page.getByRole("button", { name: "Add a user", exact: true }).boundingBox();
  assert.equal(toggleBox.y, addBox.y, "The toggle and Add a user must align");
  assert.equal(toggleBox.height, addBox.height);

  assert.equal(geometry.firstRow.y, 421);
  assert.equal(geometry.firstRow.height, 68);
  assert.ok(
    geometry.assets.every((i) => i.loaded),
    "All rendered images must load",
  );
  await page.getByRole("searchbox").fill("derrick");
  assert.equal(await page.getByRole("row").count(), 2);
  await page.getByRole("button", { name: "View Derrick Lawson" }).click();
  await page
    .getByRole("complementary", { name: "Permissions", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.locator(".filter-dropdown").getByRole("checkbox", { name: "Accountant", exact: true }).check();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  assert.equal(await page.getByRole("row").count(), 3);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .getByRole("button", { name: "Needs approval", exact: true })
    .click();
  await page.getByRole("heading", { name: "No users need approval" }).waitFor();
  await page.getByRole("button", { name: "Add a user", exact: true }).click();
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email address").fill("test.user@example.com");
  await page.getByLabel("Job", { exact: true }).fill("Operations");
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByRole("button", { name: "View Test User" }).waitFor();
  await page
    .getByRole("button", { name: "Needs approval", exact: true })
    .click();
  assert.equal(await page.getByRole("row").count(), 2);
  await page.getByRole("button", { name: "View Test User" }).click();
  assert.equal(await page.getByRole("button", { name: "Edit details", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator(".permissions-panel").getByLabel("Status", { exact: true }).selectOption("Active");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("heading", { name: "No users need approval" }).waitFor();
  await page.getByRole("button", { name: "All users", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "View Test User" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.locator(".permissions-panel").getByLabel("Status", { exact: true }).inputValue(), "Active");
  await page.locator(".permissions-panel").getByLabel("Status", { exact: true }).selectOption("Removed");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.locator(".permissions-panel").getByLabel("Status", { exact: true }).inputValue(), "Removed");
  await page.getByRole("button", { name: "Close permissions", exact: true }).click();
  await page.getByRole("button", { name: "Add a user", exact: true }).click();
  await page.getByLabel("Full name").fill("Duplicate User");
  await page.getByLabel("Email address").fill("maria.gomez@example.com");
  await page.getByLabel("Job", { exact: true }).fill("Operations");
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "already exists" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "companies", exact: true }).click();
  await page.getByRole("table", { name: "Company users" }).waitFor();
  assert.equal(await page.locator(".company-row").count(), 14);
  const companyPositions = () => page.locator(".company-row").evaluateAll(rows => rows.map(row => row.getBoundingClientRect().toJSON()));
  const companiesBefore = await companyPositions();
  assert.equal(await page.locator(".company-table").evaluate(el => el.getBoundingClientRect().width), 920);
  await expect(page.locator(".company-row").first().locator(".company-role")).toBeVisible();
  await expect(page.locator(".company-row").first().locator(".company-status")).toBeVisible();
  await expect(page.locator(".permissions-panel")).toHaveCount(0);
  await expect(page.locator(".company-row").first().locator(".company-identity > span")).toHaveCSS("opacity", "1");
  const companyIdentities = await page.locator(".company-row").evaluateAll(rows => rows.map(row => ({
    name: row.querySelector(".user-name").textContent,
    portrait: row.querySelector(".avatar img")?.getAttribute("src") ?? null,
  })));
  assert.equal(new Set(companyIdentities.map(user => user.name)).size, 14);
  assert.equal(companyIdentities[0].portrait, "/assets/imgJp1.png");
  assert.equal(companyIdentities[1].portrait, "/assets/imgJp2.png");
  await expect(page.locator(".company-row").nth(2).locator(".company-identity > span")).toHaveCSS("opacity", "0");
  await page.locator(".company-row").nth(2).hover();
  await expect(page.locator(".company-row").nth(2).locator(".company-identity > span")).toHaveCSS("opacity", "1");
  assert.deepEqual(await companyPositions(), companiesBefore);
  await page.locator(".company-row-link").nth(2).click();
  await page.getByRole("heading", { name: "Tanya Brooks", exact: true }).waitFor();
  await expect(page.locator(".company-row").nth(2).locator(".company-identity > span")).toHaveCSS("opacity", "0");
  await page.getByRole("heading", { name: "Manage your", exact: true }).hover();
  await expect(page.locator(".company-row").nth(2).locator(".company-identity > span")).toHaveCSS("opacity", "0");
  await expect(page.locator(".company-row").nth(2).locator(".company-row-link > img")).toHaveCSS("opacity", "1");
  assert.deepEqual(await companyPositions(), companiesBefore);
  await page.locator(".company-row-link").nth(1).click();

  await page.getByRole("heading", { name: "Derrick Lawson", exact: true }).waitFor();
  await page.locator(".company-row-link").first().click();
  await page.getByRole("heading", { name: "Maria Gomeze", exact: true }).waitFor();
  assert.deepEqual(await companyPositions(), companiesBefore);
  await page.getByRole("button", { name: "Close permissions" }).click();
  assert.deepEqual(await companyPositions(), companiesBefore);
  await page.locator(".company-row-link").nth(1).click();
  assert.deepEqual(await companyPositions(), companiesBefore);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  await expect.poll(async () => {
    const box = await page.locator(".permissions-panel").boundingBox();
    return 1024 - box.y - box.height;
  }).toBe(24);
  await page.screenshot({ path: "verification/companies-desktop.png", fullPage: true });
  await page.getByRole("searchbox").fill("derrick");
  assert.equal(await page.locator(".company-row").count(), 1);
  await page.getByRole("searchbox").fill("missing");
  await page.getByRole("heading", { name: "No company users found" }).waitFor();
  await page.getByRole("button", { name: "Show all users" }).click();
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.locator(".filter-dropdown").getByRole("checkbox", { name: "CFO", exact: true }).check();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  assert.equal(await page.locator(".company-row").count(), 1);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".permissions-panel")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".company-row-link").nth(1).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "verification/companies-mobile.png", fullPage: true });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.getByRole("tab", { name: "users", exact: true }).click();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const positions = () =>
    page.locator(".user-row").evaluateAll((rows) =>
      rows.map((row) => {
        const name = row.querySelector(".user-name").getBoundingClientRect();
        const role = row.children[1].getBoundingClientRect();
        const avatar = row.querySelector(".avatar").getBoundingClientRect();
        const rect = row.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          nameX: name.x,
          nameY: name.y,
          roleX: role.x,
          roleY: role.y,
          avatarX: avatar.x,
          avatarY: avatar.y,
        };
      }),
    );
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".user-row")
    .first()
    .hover({ position: { x: 80, y: 34 } });
  await expect(page.locator(".user-row").first()).toHaveCSS(
    "background-color",
    "rgb(237, 242, 247)",
  );
  await expect(page.locator(".user-row").first()).toHaveCSS(
    "box-shadow",
    "none",
  );
  const beforeOpen = await positions();
  await page.getByRole("button", { name: "View Derrick Lawson" }).click();
  assert.deepEqual(
    await positions(),
    beforeOpen,
    "Opening permissions must preserve every row and content position",
  );
  const panel = page.getByRole("complementary", {
    name: "Permissions",
    exact: true,
  });
  await panel.waitFor();
  await page.evaluate(() =>
    Promise.all([...document.images].map((i) => i.decode())),
  );
  const panelBox = await panel.boundingBox();
  assert.equal(panelBox.x, 722);
  assert.equal(panelBox.y, 381);
  assert.equal(panelBox.width, 458);
  await expect(panel).toHaveCSS("border-bottom-left-radius", "12px");
  await expect(panel).toHaveCSS("border-bottom-right-radius", "12px");
  await expect(page.locator(".selected-user")).toHaveCSS("border-top-right-radius", "0px");
  await expect(page.locator(".list-header")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  assert.equal(panelBox.height, 619);
  for (const height of [800, 1200]) {
    await page.setViewportSize({ width: 1440, height });
    await expect.poll(async () => {
      const box = await panel.boundingBox();
      return height - box.y - box.height;
    }).toBe(24);
  }
  await page.setViewportSize({ width: 1440, height: 1024 });
  assert.equal(
    await page.locator(".selected-user .user-name").innerText(),
    "Derrick Lawson",
  );
  await page.screenshot({
    path: "verification/permissions-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".permissions-scroll")
    .evaluate((el) => (el.scrollTop = el.scrollHeight));
  await page
    .getByText("Has access to these accounts", { exact: true })
    .waitFor();
  assert.ok(
    await page
      .locator(".permissions-scroll")
      .evaluate((el) => el.scrollTop > 500),
  );
  await page.getByRole("button", { name: "View Tanya Brooks" }).click();
  assert.deepEqual(
    await positions(),
    beforeOpen,
    "Switching users must preserve row positions",
  );
  assert.equal(
    await panel.locator(".permission-name h3").innerText(),
    "Tanya Brooks",
  );
  assert.equal(
    await page.locator(".permissions-scroll").evaluate((el) => el.scrollTop),
    0,
  );
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await panel.getByLabel("Full name").fill("Tanya Updated");
  await panel.getByLabel("Email address").fill("maria.gomez@example.com");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(panel.getByRole("alert")).toHaveText("This email address is already assigned to another user.");
  assert.equal(await panel.locator(".permission-name h3").innerText(), "Tanya Brooks");
  await panel.getByLabel("Email address").fill("tanya.updated@example.com");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal(
    await panel.locator(".permission-name h3").innerText(),
    "Tanya Updated",
  );
  await page.getByRole("button", { name: "Delete user", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close permissions", exact: true })
    .click();
  assert.equal(await page.locator(".permissions-panel").count(), 0);
  assert.deepEqual(
    await positions(),
    beforeOpen,
    "Closing permissions must preserve row positions",
  );
  await page.getByRole("button", { name: "View Tanya Updated" }).click();
  await page.getByRole("button", { name: "Delete user", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete user", exact: true })
    .click();
  assert.equal(
    await page.getByRole("button", { name: "View Tanya Updated" }).count(),
    0,
  );
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "verification/mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile must not overflow horizontally",
  );
  await page.getByRole("searchbox").fill("maria");
  await page.getByRole("button", { name: "View Maria Gomeze" }).click();
  await page
    .getByRole("complementary", { name: "Permissions", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: "View Derrick Lawson" }).click();
  await page
    .getByRole("complementary", { name: "Permissions", exact: true })
    .waitFor();
  await page.screenshot({
    path: "verification/permissions-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile permissions must not overflow",
  );
  assert.deepEqual(errors, []);
  for (const file of await readdir("public/assets"))
    assert.ok(
      (await stat(`public/assets/${file}`)).size > 0,
      `Asset ${file} must not be empty`,
    );
  console.log(
    "PASS: desktop layout, assets, search and filters, permissions panel geometry and scrolling, user switching, edit and delete, add/approve/remove, persistence, dialogs, mobile layouts, and browser errors.",
  );
} finally {
  await browser.close();
}
