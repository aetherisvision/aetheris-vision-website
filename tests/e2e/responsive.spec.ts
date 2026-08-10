import { expect, test, type Page } from "@playwright/test";

async function gotoReady(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "load" });
  await page.waitForFunction(
    () => {
      const header = document.querySelector("header");
      return header instanceof HTMLElement && getComputedStyle(header).position === "fixed";
    },
  );
  await page.evaluate(() => document.fonts.ready);
  return response;
}

const publicRoutes = [
  "/",
  "/agentic-og",
  "/about",
  "/services",
  "/services/web",
  "/capabilities",
  "/portfolio",
  "/blog",
  "/contact",
  "/book",
];

for (const route of publicRoutes) {
  test(`${route} has no horizontal overflow`, async ({ page }) => {
    const response = await gotoReady(page, route);
    expect(response?.ok(), `Expected ${route} to load successfully`).toBeTruthy();

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(
      overflow.scrollWidth,
      `${route} is ${overflow.scrollWidth - overflow.clientWidth}px wider than its viewport`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test("navigation switches cleanly between desktop and compact layouts", async ({ page }) => {
  await gotoReady(page, "/agentic-og");
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const desktopNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  const menuButton = page.getByRole("button", { name: "Open navigation" });

  if (viewport!.width >= 1280) {
    await expect(desktopNavigation).toBeVisible();
    await expect(menuButton).toBeHidden();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Consultation" }),
    ).toBeVisible();
  } else {
    await expect(desktopNavigation).toBeHidden();
    await expect(menuButton).toBeVisible();

    const buttonBox = await menuButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);

    await menuButton.click();
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: "Consultation" })).toBeVisible();
  }
});
