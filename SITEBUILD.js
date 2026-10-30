import { statSync } from "node:fs";
import { glob, readFile, writeFile } from "node:fs/promises";

// The absolute most garbage SSG system ever lmao
// A lot of code from adapted from my other project SkyScheduler
// which has a much better custom built SSG lol
async function buildSite() {
  // for sitemap, literally stolen from skyscheduler lmao
  const SITE_URL = "https://agenticalert.download";

  const sections = new Map();
  const sitemap_pages = [];
  // build out the HTML replacement code from each section file
  // keys are the filenames all uppercased
  for await (const sectionFile of glob("site/sections/*")) {
    const fileKey = sectionFile.replace(/(site\\sections\\|site\/sections\/|index|\.html)/g, "").toUpperCase();
    const fileContents = await readFile(sectionFile, {encoding: "utf-8"});
    sections.set(fileKey, fileContents);
  }

  const skipPages = [];
  if (process.env["IS_TEST"] !== 'true') {
    skipPages.push("**/get.html");
  }

  // match swap with dynamic content
  const sectionInjection = (_match, p1) => {
    if (!sections.has(p1)) {
      console.error(`SITE BUILD - Missing section key ${p1}`);
      return "";
    }
    return sections.get(p1);
  };
  
  // build each page in the pages dir
  for await (const pageFile of glob("site/pages/*", {exclude: skipPages})) {
    // store data for the sitemap
    sitemap_pages.push({
      url: pageFile.replace(/(site\\pages\\|site\/pages\/|index|\.html)/g, ""),
      lastMod: statSync(pageFile).mtime.toISOString()
    });

    // god this is so awful
    const outputPageFile = pageFile.replace(/(\\pages|\/pages)/g, "");
    let pageContents = await readFile(pageFile, {encoding: "utf-8"});
    // content injection is fun
    pageContents = pageContents.replace(/\{(.*)\}/g, sectionInjection);
    // dump out to file
    await writeFile(outputPageFile, pageContents);
  }

  // Build the sitemap from all the files
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap_pages.map((page) => `\t<url>\n\t\t<loc>${SITE_URL}/${page.url}</loc>\n\t\t<lastmod>${page.lastMod}</lastmod>\n\t</url>`).join('\n')}
  </urlset>`;

  await writeFile("site/sitemap.xml", sitemap);
}

buildSite();