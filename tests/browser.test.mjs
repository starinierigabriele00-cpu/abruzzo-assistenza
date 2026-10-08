// Optional real-browser QA. Test packages and screenshots are never shipped.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(
  resolve(process.env.ABRUZZO_TEST_DEPS || "/tmp/abruzzo-ui-check", "package.json"),
);
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const base = process.env.ABRUZZO_BASE_URL || "http://127.0.0.1:8080";
// Keep requesting .html to exercise Cloudflare's normalization; expect the final URL.
const siteURL = (path) => {
  const url = new URL(`${base}/${path}`);
  if (process.env.ABRUZZO_CLEAN_URLS === "1")
    url.pathname = url.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  return url.href;
};
const output = process.env.ABRUZZO_QA_OUTPUT || "/tmp/abruzzo-qa";
mkdirSync(output, { recursive: true });
const pages = [
  "index",
  "servizi",
  "volontari",
  "associazione",
  "contatti",
  "privacy",
  "pescara",
  "404",
];
const report = {
  viewports: [1440, 1024, 768, 390, 360],
  pages,
  observations: [],
  errors: [],
  noJavaScript: [],
  legacyRedirects: [],
  taxCodeCopy: [],
  metrics: null,
};
const browser = await chromium.launch({
  executablePath: process.env.ABRUZZO_BROWSER || chromium.executablePath(),
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("/__qa_missing/"))
      report.errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    if (!request.url().startsWith(base))
      report.errors.push("Unexpected third-party request: " + request.url());
  });
  await page.addInitScript(() => {
    window.__observed = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__observed.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__observed.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  for (const width of report.viewports) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of pages) {
      await page.goto(`${base}/${name}.html`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(
        await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
        { local: 0, session: 0 },
        `${name}: the website must not persist visitor data`,
      );
      if (name === "index") {
        const navigationStyles = await page.evaluate(() => {
          const keys = [
            "backgroundColor",
            "borderWidth",
            "borderRadius",
            "paddingLeft",
            "paddingRight",
            "fontSize",
          ];
          return ["servizi.html", "volontari.html", "associazione.html"].map((href) => {
            const style = getComputedStyle(document.querySelector(`[data-nav] a[href="${href}"]`));
            return Object.fromEntries(keys.map((key) => [key, style[key]]));
          });
        });
        assert.deepEqual(
          navigationStyles[1],
          navigationStyles[0],
          `Volunteering shares Services styling at ${width}px`,
        );
        assert.deepEqual(
          navigationStyles[1],
          navigationStyles[2],
          `Volunteering shares Association styling at ${width}px`,
        );
      }
      const footerCanvas = await page.evaluate(() => {
        const footer = document.querySelector(".site-footer");
        return {
          html: getComputedStyle(document.documentElement).backgroundColor,
          body: getComputedStyle(document.body).backgroundColor,
          footer: getComputedStyle(footer).backgroundColor,
          bottomGap:
            document.documentElement.scrollHeight -
            (footer.getBoundingClientRect().bottom + scrollY),
          viewport: document.querySelector('meta[name="viewport"]').content,
        };
      });
      assert.equal(
        footerCanvas.html,
        footerCanvas.footer,
        `${name}: canvas below footer must stay dark`,
      );
      assert.equal(
        footerCanvas.body,
        footerCanvas.footer,
        `${name}: Safari page background must match footer`,
      );
      assert.ok(Math.abs(footerCanvas.bottomGap) <= 1, `${name}: blank area follows footer`);
      assert.match(footerCanvas.viewport, /viewport-fit=cover/);
      if (name === "index" && width === 390)
        report.metrics = {
          context: `Chromium, endpoint ${base}, cache calda, nessun throttling; non una misura Lighthouse`,
          ...(await page.evaluate(() => window.__observed)),
        };
      // Full-page capture alone does not load below-fold lazy images.
      for (const image of await page.locator('img[loading="lazy"]').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) => element.decode());
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
        true,
        `${name}: an image failed to load`,
      );
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
              r.width &&
              s.position !== "fixed" &&
              s.visibility !== "hidden" &&
              (r.right > innerWidth + 1 || r.left < -1)
            );
          })
          .map((el) => el.tagName + "." + el.className),
      );
      assert.deepEqual(overflow, [], `${name} at ${width}px overflows: ${overflow}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      if (name === "index" && width <= 700) {
        const composition = await page.evaluate(() => {
          const photograph = document.querySelector(".hero-image img");
          const image = photograph.getBoundingClientRect();
          const actions = document.querySelector(".hero .actions").getBoundingClientRect();
          const introduction = document.querySelector(".territory-intro").getBoundingClientRect();
          const map = document.querySelector(".territory-map").getBoundingClientRect();
          const details = document.querySelector(".territory-details").getBoundingClientRect();
          return {
            photoGap: image.top - actions.bottom,
            photoRatio: image.width / image.height,
            originalRatio: photograph.naturalWidth / photograph.naturalHeight,
            mapFollowsIntro: map.top >= introduction.bottom,
            detailsFollowMap: details.top >= map.bottom,
          };
        });
        assert.ok(composition.photoGap >= 24, "Mobile CTA covers the photograph");
        assert.ok(
          Math.abs(composition.photoRatio / composition.originalRatio - 1) < 0.01,
          "Mobile photograph crops the vehicles",
        );
        assert.ok(composition.mapFollowsIntro, "Mobile map precedes its introduction");
        assert.ok(composition.detailsFollowMap, "Mobile departure details bury the map");
      }
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
      let violations = [];
      if (width === 390 || width === 1440) {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        violations = result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        }));
      }
      report.observations.push({ page: name, width, overflow, violations });
      console.log(
        `QA ${name} ${width}px: overflow ${overflow.length}, axe violations ${violations.length}`,
      );
    }
  }
  // Actual keyboard and touch-like interactions, including the composer.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/contatti.html?servizio=disabili#richiesta`);
  await page.locator("#request-from").fill("Sulmona");
  await page.locator("#request-to").fill("Città & centro");
  await page.locator("#request-wheelchair").selectOption("si");
  await page.locator("#request-stayWheelchair").selectOption("si");
  const text = await page.locator("[data-message-text]").innerText();
  assert.match(text, /restare sulla carrozzina durante il viaggio: Sì/);
  const url = new URL(await page.locator("[data-message-link]").getAttribute("href"));
  assert.equal(url.searchParams.get("text"), text);
  assert.equal(page.url(), siteURL("contatti.html?servizio=disabili#richiesta"));
  assert.deepEqual(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
    { local: 0, session: 0 },
    "Composer input stays out of persistent browser storage",
  );
  assert.equal(await page.locator("[data-request-notes]").evaluate((el) => el.open), false);
  await page.locator(".request-review").click();
  assert.equal(new URL(page.url()).hash, "#anteprima");
  assert.ok(
    await page.evaluate(
      () =>
        document.querySelector("#anteprima").getBoundingClientRect().top >=
        document.querySelector(".site-header").getBoundingClientRect().bottom,
    ),
  );
  await page.locator(".request-edit").click();
  assert.equal(new URL(page.url()).hash, "#dettagli");
  assert.equal(await page.locator("#request-from").inputValue(), "Sulmona");
  await page.locator("[data-request-notes] summary").click();
  await page.locator("#request-notes").fill("Ingresso dal cortile");
  assert.match(await page.locator("[data-message-text]").innerText(), /Ingresso dal cortile/);
  await page.locator("[data-copy-message]").click();
  await page.waitForFunction(
    () => document.querySelector("[data-copy-status]").textContent.length > 0,
  );
  // Capture the complete page from its origin, without a focused control or sticky-header artifact.
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.getSelection().removeAllRanges();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `${output}/composer-filled-390.png`, fullPage: true });
  await page.locator('input[value="volontari"]').check();
  assert.equal(await page.locator("#request-from").isVisible(), false);
  assert.equal(await page.locator("#request-zone").isVisible(), true);
  await page.locator('button[type="reset"]').click();
  await page.waitForFunction(() => document.querySelector('input[value="trasporti"]').checked);
  assert.equal(await page.locator("#request-from").inputValue(), "");
  // Short landscape screens must scroll the menu vertically, preserving touch targets.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(`${base}/index.html`);
  await page.locator("[data-nav-toggle]").click();
  const menuGeometry = await page.locator("[data-nav]").evaluate((nav) => ({
    x: [...nav.children]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.getBoundingClientRect().x),
    height: nav.getBoundingClientRect().height,
    space: innerHeight - nav.getBoundingClientRect().top,
  }));
  assert.ok(menuGeometry.x.every((x) => Math.abs(x - menuGeometry.x[0]) <= 1));
  assert.ok(menuGeometry.height <= menuGeometry.space);
  await page.locator(".nav-mobile-contact").scrollIntoViewIfNeeded();
  assert.ok(
    await page
      .locator(".nav-mobile-contact")
      .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/servizi.html`);
  await page.locator("[data-service-index] summary").click();
  await page.locator('[data-service-index] a[href="#esteri"]').click();
  assert.equal(await page.locator("[data-service-index]").evaluate((el) => el.open), false);
  assert.ok(
    await page.evaluate(
      () =>
        document.querySelector("#title-esteri").getBoundingClientRect().top >=
        document.querySelector(".service-index").getBoundingClientRect().bottom,
    ),
  );
  // Every booking action opens the correct local composer, without opening WhatsApp.
  for (const service of ["trasporti", "dialisi", "disabili", "nazionali", "esteri", "eventi"]) {
    await page.goto(`${base}/servizi.html`);
    const booking = page.locator(`#${service} .service-start .button`);
    assert.match(await booking.innerText(), /^Prenota/);
    await booking.click();
    await page.locator("[data-request-form]").waitFor({ state: "visible" });
    assert.equal(new URL(page.url()).pathname, new URL(siteURL("contatti.html")).pathname);
    assert.equal(new URL(page.url()).searchParams.get("servizio"), service);
    assert.equal(await page.locator('input[name="service"]:checked').inputValue(), service);
    assert.equal(await page.locator("[data-request-form]").isVisible(), true);
  }
  await page.goto(`${base}/index.html`);
  assert.deepEqual(
    await page
      .locator("main > section")
      .evaluateAll((sections) =>
        sections.map((section) => section.getAttribute("aria-labelledby")),
      ),
    [
      "hero-title",
      "servizi-title",
      "five-home-title",
      "process-title",
      "territory-title",
      "faq-title",
      "cta-title",
    ],
  );
  // Clipboard success and fallback are both exercised with a keyboard action.
  await page.evaluate(() => {
    window.__taxCopied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value) => window.__taxCopied.push(value) },
    });
  });
  await page.locator("[data-copy-tax-id]").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document.querySelector("[data-tax-copy-status]").textContent.includes("copiato"),
  );
  assert.deepEqual(await page.evaluate(() => window.__taxCopied), ["02227430663"]);
  report.taxCodeCopy.push("clipboard after keyboard activation");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await page.locator("[data-copy-tax-id]").click();
  await page.waitForFunction(() => window.getSelection().toString().trim() === "02227430663");
  assert.equal(
    await page.locator("[data-tax-id]").evaluate((el) => el === document.activeElement),
    true,
  );
  report.taxCodeCopy.push("manual selection fallback after touch-like click");
  await page.goto(`${base}/index.html`);
  await page.locator("[data-nav-toggle]").click();
  await page.locator('[data-nav] a[href="volontari.html"]').click();
  await page.waitForURL(siteURL("volontari.html"));
  assert.equal(
    await page.locator('[data-nav] a[href="volontari.html"]').getAttribute("aria-current"),
    "page",
  );
  await page.locator('main a[href="contatti.html?servizio=volontari#richiesta"]').first().click();
  await page.waitForURL(siteURL("contatti.html?servizio=volontari#richiesta"));
  assert.equal(await page.locator('input[name="service"]:checked').inputValue(), "volontari");
  assert.equal(await page.locator("#request-zone").isVisible(), true);
  await page.goto(`${base}/index.html`);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(".skip-link").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#main").evaluate((el) => el === document.activeElement), true);
  await page.locator("[data-nav-toggle]").click();
  assert.equal(await page.locator("[data-nav-toggle]").getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("[data-nav-toggle]").getAttribute("aria-expanded"), "false");
  assert.equal(
    await page.locator("[data-nav-toggle]").evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("[data-nav-toggle]").click();
  await page.locator('[data-nav] a[href="associazione.html"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(siteURL("associazione.html"));
  assert.equal(await page.locator("[data-nav] details").count(), 0);
  assert.equal(
    await page.locator('[data-nav] a[aria-current="page"]').getAttribute("href"),
    "associazione.html",
  );
  await page.goto(`${base}/index.html`);
  await page.locator(".faq summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator(".faq details")
      .first()
      .evaluate((el) => el.open),
    true,
  );
  // 320 CSS pixels exercise reflow analogous to high zoom; no claim of a screen-reader audit.
  await page.setViewportSize({ width: 320, height: 800 });
  for (const name of pages) {
    await page.goto(`${base}/${name}.html`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `320px reflow: ${name}`,
    );
  }
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await nojs.newPage();
  for (const name of pages) {
    await fallback.goto(`${base}/${name}.html`);
    assert.equal(
      await fallback.locator('nav[aria-label="Navigazione principale"]').isVisible(),
      true,
    );
    assert.ok((await fallback.locator('[data-verified="legal"]').count()) > 0);
    assert.equal(await fallback.locator('[data-verified="donation"]').count(), 0);
    assert.match(await fallback.locator("footer").innerText(), /Via Fonte d'Amore SNC/);
    if (name === "index") {
      assert.equal(await fallback.locator("[data-tax-id]").innerText(), "02227430663");
      assert.equal(await fallback.locator("[data-copy-tax-id]").isVisible(), false);
    }
    assert.equal(
      (await fallback.locator('a[href="mailto:abruzzoassistenzaodv@gmail.com"]').count()) > 0,
      true,
      `Direct email works without JavaScript: ${name}`,
    );
    if (name === "contatti") {
      assert.equal(await fallback.locator("[data-request-form]").isVisible(), false);
      assert.equal(await fallback.locator("#canali a").count(), 3);
    }
    report.noJavaScript.push(name);
  }
  for (const [legacy, destination] of [
    ["sostienici.html", "associazione.html#sostegno"],
    ["trasparenza.html", "contatti.html#associazione"],
  ]) {
    for (const targetPage of [page, fallback]) {
      await targetPage.goto(`${base}/${legacy}`);
      await targetPage.waitForURL(siteURL(destination));
      const anchor = new URL(targetPage.url()).hash;
      assert.equal(await targetPage.locator(anchor).isVisible(), true);
    }
    report.legacyRedirects.push({ legacy, destination, withoutJavaScript: true });
  }
  await nojs.close();
  const missing = await page.goto(`${base}/__qa_missing/nested/path`);
  assert.equal(missing.status(), 404);
  assert.equal(await page.locator("h1").innerText(), "Questo percorso\nnon porta a una pagina.");
  assert.equal(
    await page
      .locator(".brand img")
      .first()
      .evaluate((el) => el.complete && el.naturalWidth > 0),
    true,
  );
  await page.screenshot({ path: `${output}/404-nested-320.png`, fullPage: true });
  report.nested404 = true;
  report.cookies = await context.cookies();
  assert.deepEqual(report.cookies, [], "The local artifact must not install cookies");
  assert.deepEqual(report.errors, []);
  const failures = report.observations.filter((o) => o.violations.length);
  writeFileSync(`${output}/results.json`, JSON.stringify(report, null, 2));
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
  console.log(
    `PASS: ${pages.length * report.viewports.length} responsive captures, axe on ${pages.length * 2} views, booking/navigation, 320px reflow, ${pages.length} no-JS pages and two legacy redirects.`,
  );
} finally {
  writeFileSync(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
