const puppeteer = require("puppeteer");

describe("End-to-End Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto("http://127.0.0.1:8080/for_tests.html");

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });
  });

  afterAll(async () => {
    await browser.close();
  });

  it("title", async () => {
    expect.assertions(1);
    const textSelector = await page.waitForSelector("title");
    const title = await textSelector?.evaluate((el) => el.textContent);
    expect(title).toBe("Page for tests!");
  });

  it("click", async () => {
    expect.assertions(1);
    await page.click("#first_button");
    const appSelector = await page.waitForSelector("#app :first-child");
    const app = await appSelector?.evaluate((el) => el.textContent);
    expect(app).toBe("This is a new paragraph created with JavaScript!");
  });
});
