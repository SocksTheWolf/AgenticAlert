import { statSync } from "node:fs";
import { glob, readFile, writeFile } from "node:fs/promises";

// The absolute most garbage SSG system ever lmao
// A lot of code from adapted from my other project SkyScheduler
// which has a much better custom built SSG lol
async function buildSite() {
  const SITE_URL = "https://agenticalert.download";

  const sections = new Map();
  const sitemap_page = [];
  // build out the HTML replacement code
  for await (const sectionFile of glob("site/sections/*")) {
    const fileKey = sectionFile.replace(/(site\\sections\\|site\/sections\/|index|\.html)/g, "").toUpperCase();
    const fileContents = await readFile(sectionFile, {encoding: "utf-8"});
    sections.set(fileKey, fileContents);
  }
  // build the pages
  const sectionInjection = (match, p1) => {
    return sections.get(p1);
  }
  for await (const pageFile of glob("site/pages/*")) {
    sitemap_page.push({
      url: pageFile.replace(/(site\\pages\\|site\/pages\/|index|\.html)/g, ""),
      lastMod: statSync(pageFile).mtime.toISOString()
    });
    const outputPageFile = pageFile.replace(/(\\pages|\/pages)/g, "");
    let pageContents = await readFile(pageFile, {encoding: "utf-8"});
    console.log(pageContents);
    pageContents = pageContents.toString().replace(/\{(.*)\}/g, sectionInjection);

    await writeFile(`test/${outputPageFile}`, pageContents);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap_page.map((page) => `\t<url>\n\t\t<loc>${SITE_URL}/${page.url}</loc>\n\t\t<lastmod>${page.lastMod}</lastmod>\n\t</url>`).join('\n')}
  </urlset>`;

  await writeFile("site/sitemap.xml", sitemap);
}

buildSite();