const puppeteer = require("puppeteer");

describe("End-to-End Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto("http://127.0.0.1:8080/level_1.html");

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    // // Type into search box
    // await page.type(".search-box__input", "automate beyond recorder");

    // // Wait and click on first result
    // const searchResultSelector = ".search-box__link";
    // await page.waitForSelector(searchResultSelector);
    // await page.click(searchResultSelector);

    // // Locate the full title with a unique string
    // const textSelector = await page.waitForSelector(
    //   "text/Customize and automate"
    // );
    // const fullTitle = await textSelector?.evaluate((el) => el.textContent);
    // console.log('The title of this blog post is "%s".', fullTitle);
  });

  afterAll(async () => {
    await browser.close();
  });

  it("first test", async () => {
    expect(1).toBe(1);
  });
});
