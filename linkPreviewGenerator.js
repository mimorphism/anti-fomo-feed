"use strict";
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const util = require("util");
const request = util.promisify(require("request"));
const getUrls = require("get-urls");
const isBase64 = require("is-base64");

const urlImageIsAccessible = async (url) => {
  const correctedUrls = getUrls(url);
  if (isBase64(url, { allowMime: true })) {
    return true;
  }
  if (correctedUrls.size !== 0) {
    const urlResponse = await request(correctedUrls.values().next().value);
    const contentType = urlResponse.headers["content-type"];
    return new RegExp("image/*").test(contentType);
  }
};

const getImg = async (page, uri) => {
  const img = await page.evaluate(async () => {
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (
      ogImg != null &&
      ogImg.content.length > 0 &&
      (await urlImageIsAccessible(ogImg.content))
    ) {
      return ogImg.content;
    }
    const imgRelLink = document.querySelector('link[rel="image_src"]');
    if (
      imgRelLink != null &&
      imgRelLink.href.length > 0 &&
      (await urlImageIsAccessible(imgRelLink.href))
    ) {
      return imgRelLink.href;
    }
    const twitterImg = document.querySelector('meta[name="twitter:image"]');
    if (
      twitterImg != null &&
      twitterImg.content.length > 0 &&
      (await urlImageIsAccessible(twitterImg.content))
    ) {
      return twitterImg.content;
    }

    // let imgs = Array.from(document.getElementsByTagName("img"));
    // if (imgs.length > 0) {
    //   imgs = imgs.filter((img) => {
    //     let addImg = true;
    //     if (img.naturalWidth > img.naturalHeight) {
    //       if (img.naturalWidth / img.naturalHeight > 3) {
    //         addImg = false;
    //       }
    //     } else {
    //       if (img.naturalHeight / img.naturalWidth > 3) {
    //         addImg = false;
    //       }
    //     }
    //     if (img.naturalHeight <= 50 || img.naturalWidth <= 50) {
    //       addImg = false;
    //     }
    //     return addImg;
    //   });
    //   if (imgs.length > 0) {
    //     imgs.forEach((img) =>
    //       img.src.indexOf("//") === -1
    //         ? (img.src = `${new URL(uri).origin}/${img.src}`)
    //         : img.src
    //     );
    //     return imgs[0].src;
    //   }
    // }
    return 'images/404NOTFOUND.png';
  });
  return img;
};

const getTitle = async (page) => {
  const title = await page.evaluate(() => {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    console.log(ogTitle)
    if (ogTitle != null && ogTitle.content.length > 0) {
      return ogTitle.content;
    }
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    console.log(twitterTitle)

    if (twitterTitle != null && twitterTitle.content.length > 0) {
      return twitterTitle.content;
    }
    const docTitle = document.title;
    console.log(docTitle)

    if (docTitle != null && docTitle.length > 0) {
      return docTitle;
    }
    const h1El = document.querySelector("h1");
    const h1 = h1El ? h1El.innerHTML : null;
    if (h1 != null && h1.length > 0) {
      return h1;
    }
    const h2El = document.querySelector("h2");
    const h2 = h2El ? h2El.innerHTML : null;
    if (h2 != null && h2.length > 0) {
      return h2;
    }
    return 'No Title';
  });
  return title;
};

const getDescription = async (page) => {
  const description = await page.evaluate(() => {
    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription != null && ogDescription.content.length > 0) {
      return ogDescription.content;
    }
    const twitterDescription = document.querySelector(
      'meta[name="twitter:description"]'
    );
    if (twitterDescription != null && twitterDescription.content.length > 0) {
      return twitterDescription.content;
    }
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription != null && metaDescription.content.length > 0) {
      return metaDescription.content;
    }
    let paragraphs = document.querySelectorAll("p");
    let fstVisibleParagraph = 'No Description';
    for (let i = 0; i < paragraphs.length; i++) {
      if (
        // if object is visible in dom
        paragraphs[i].offsetParent !== null &&
        !paragraphs[i].childElementCount != 0
      ) {
        fstVisibleParagraph = paragraphs[i].textContent;
        break;
      }
    }
    return fstVisibleParagraph;
  });
  return description;
};

const getDomainName = async (page, uri) => {
  const domainName = await page.evaluate(() => {
    const canonicalLink = document.querySelector("link[rel=canonical]");
    if (canonicalLink != null && canonicalLink.href.length > 0) {
      return canonicalLink.href;
    }
    const ogUrlMeta = document.querySelector('meta[property="og:url"]');
    if (ogUrlMeta != null && ogUrlMeta.content.length > 0) {
      return ogUrlMeta.content;
    }
    return 'No Domain';
  });
  return domainName != 'No Domain'
    ? new URL(domainName).hostname.replace("www.", "")
    : new URL(uri).hostname.replace("www.", "");
};

const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitFor(checkDurationMsecs);
  }  
};

module.exports = async (
  uri,
  puppeteerArgs = [],
//   puppeteerAgent = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
//   executablePath
// ) => {
//   puppeteer.use(pluginStealth());
puppeteerAgent = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
  executablePath
) => {
  puppeteer.use(pluginStealth());

  const params = {
    headless: true,
    args: [...puppeteerArgs],
  };
  if (executablePath) {
    params["executablePath"] = executablePath;
  }

  // const browser = await puppeteer.launch(params);
  const browser = await puppeteer.launch({args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']});
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(40000);
  page.setUserAgent(puppeteerAgent);

  const obj = {};
  try
  {
    // await page.goto(uri).catch(() => null);
    await page.goto(uri, { waitUntil: 'networkidle2' });
    // await waitTillHTMLRendered(page);
    await page.exposeFunction("request", request);
    await page.exposeFunction("urlImageIsAccessible", urlImageIsAccessible);

    obj.img = await getImg(page, uri).catch(() => null);
    obj.title = await getTitle(page).catch(() => null);
    obj.description = await getDescription(page).catch(() => null);
    obj.link = page.url();
    await page.close();
    await browser.close();
  }
  catch (error) {
    console.error(error);
    await page.close();
    await browser.close();
  }
  return obj;
};
