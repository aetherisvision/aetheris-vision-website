import { expect, test, type Page } from "@playwright/test";

async function gotoReady(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "load" });
  await page.locator("body").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  return response;
}

const publicRoutes = [
  "/",
  "/omni-gridder",
  "/about",
  "/services",
  "/services/web",
  "/capabilities",
  "/portfolio",
  "/blog",
  "/contact",
  "/book",
  "/intake",
  "/review",
  "/privacy",
  "/security",
  "/performance",
  "/portfolio/analytics-dashboard",
  "/portfolio/wp-editorial",
  "/portfolio/portal-pro",
  "/portfolio/international-market",
];

test("public routes have no horizontal overflow", async ({ page }) => {
  // This deliberately exercises many routes in one browser context. Give the
  // route matrix enough room for cold development compilation without changing
  // the timeout for the smaller interaction tests below.
  test.setTimeout(180_000);

  for (const route of publicRoutes) {
    const response = await gotoReady(page, route);
    expect.soft(response?.ok(), `Expected ${route} to load successfully`).toBeTruthy();

    const overflow = await page.evaluate(() => {
      const clientWidth = document.documentElement.clientWidth;
      const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
            className: element.className?.toString().slice(0, 160) ?? "",
            text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter(({ right, width }) => width > 0 && right > clientWidth + 1)
        .slice(0, 8);

      return {
        clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders,
      };
    });

    expect.soft(
      overflow.scrollWidth,
      `${route} is ${overflow.scrollWidth - overflow.clientWidth}px wider than its viewport. ` +
        `Offenders: ${JSON.stringify(overflow.offenders)}`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  }
});

test("navigation switches cleanly between desktop and compact layouts", async ({ page }) => {
  await gotoReady(page, "/omni-gridder");
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const desktopNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  const menuButton = page.getByRole("button", { name: "Open navigation" });

  if (viewport!.width >= 1024) {
    await expect(desktopNavigation).toBeVisible();
    await expect(menuButton).toBeHidden();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Get in touch" }),
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
    await expect(mobileNavigation.getByRole("link", { name: "Get in touch" })).toBeVisible();

    const compactTargets = mobileNavigation.locator("a[href], button:not([disabled])");
    const targetCount = await compactTargets.count();
    expect(targetCount).toBeGreaterThan(0);

    for (let index = 0; index < targetCount; index += 1) {
      const target = compactTargets.nth(index);
      await expect(target).toBeVisible();
      const box = await target.boundingBox();
      const label = (await target.textContent())?.trim() || `compact target ${index + 1}`;

      expect(box, `${label} should have a measurable touch target`).not.toBeNull();
      expect(box!.width, `${label} should be at least 44px wide`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${label} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("mobile form controls use a readable font size", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width >= 768, "Only relevant to phone-sized viewports");

  for (const route of ["/contact", "/intake", "/review"]) {
    const response = await gotoReady(page, route);
    expect(response?.ok(), `Expected ${route} to load successfully`).toBeTruthy();

    const controlsLocator = page.locator(
      'main input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), main select, main textarea',
    );
    await controlsLocator.first().waitFor({ state: "visible" });

    const controls = await controlsLocator.evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
        })
        .map((element) => ({
          description:
            element.getAttribute("aria-label") ||
            element.getAttribute("name") ||
            element.getAttribute("id") ||
            element.tagName.toLowerCase(),
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        })),
    );

    expect(controls.length, `Expected visible form controls on ${route}`).toBeGreaterThan(0);
    for (const control of controls) {
      expect.soft(
        control.fontSize,
        `${control.description} on ${route} should be at least 16px to avoid mobile browser zoom`,
      ).toBeGreaterThanOrEqual(16);
    }
  }
});
