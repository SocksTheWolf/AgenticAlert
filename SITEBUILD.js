import { accessSync, constants, statSync, writeFileSync } from "node:fs";
import { copyFile, glob, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const lockFile = "page-lock";
function checkPageLock() {
  try {
    accessSync(lockFile, constants.R_OK | constants.W_OK);
  } catch(_err) {
    return false;
  }

  const currentTime = new Date();
  // if modification is within a 3s window, drop the change
  let modTime = statSync(lockFile).mtime;
  modTime.setSeconds(modTime.getSeconds() + 3);
  return modTime > currentTime;
}

// The absolute most garbage SSG system ever lmao
// A lot of code from adapted from my other project SkyScheduler
// which has a much better custom built SSG lol
async function buildSite() {
  // check for lock file modifications
  if (checkPageLock()) {
    console.warn("build skipped");
    return;
  }

  let scriptHash = "", scriptVersion = "", defHash = "", utilHash = "";
  const sections = new Map();
  const skipBuildPages = [];
  const skipSitemapPages = ["**/404.html"];
  const IN_DEV = process.env["IS_DEV"] === 'true';
  const TEST_USERSCRIPT = process.env["TEST"] === 'true';

  // touch the file, we'll check mod times later
  // use the sync so we don't have to worry about flushing as much
  writeFileSync(lockFile, new Date().toISOString());

  const scriptFinalLocation = "site/agenticalert.user.js";
  const defFinalLocation = "site/agentdetections.js";
  const utilsFinalLocation = "site/agentutils.js";

  // copying file rules
  const copyFileInstructions = [
    {source: "src/agenticalert.js", dest: scriptFinalLocation},
    {source: "src/agentdetections.js", dest: defFinalLocation},
    {source: "src/agentutils.js", dest: utilsFinalLocation},
    {source: "icon64.png", dest: "site/icon.png"},
  ];

  for (const fileCopy of copyFileInstructions) {
    let destFile = fileCopy.dest;
    if (!destFile.includes("/")) {
      destFile += `/${fileCopy.source}`;
    }
    await copyFile(fileCopy.source, destFile);
  }

  // modify the userscript once moved to change the resource file and add the SRI hash
  // TODO: MAKE THIS MODULAR
  {
    let userScriptFile = await readFile(scriptFinalLocation, {encoding: "utf-8"});
    const definitionsKey = "// {-DEFINITIONS-}", utilsKey = "// {-UTILS-}";
    // Figure out the version number
    scriptVersion = (/^\/\/\s+\@version\s+(.*)$/im.exec(userScriptFile))[1];

    // Get the def hash
    const definitionsFile = await readFile(defFinalLocation, {encoding: "utf-8"});
    defHash = createHash('sha256').update(definitionsFile).digest('hex');

    const utilsFile = await readFile(utilsFinalLocation, {encoding: "utf-8"});
    utilHash = createHash('sha256').update(utilsFile).digest('hex');

    // TODO: if TEST_USERSCRIPT is flagged, replace domain
    const getDeclare = (scriptName, hash) => {
      return `// @require      https://agenticalert.download/${scriptVersion}/${scriptName}.js#sha256=${hash}`;
    }

    // if in dev, write the definitions into the script for ez testing
    if (IN_DEV) {
      userScriptFile = userScriptFile.replace(definitionsKey, definitionsFile);
      userScriptFile = userScriptFile.replace(utilsKey, utilsFile);
    } else {
      userScriptFile = userScriptFile.replace("// @adddef", getDeclare("agentdetections", defHash));
      userScriptFile = userScriptFile.replace("// @addutils", getDeclare("agentutils", utilHash))
      userScriptFile = userScriptFile.replace(definitionsKey, "");
      userScriptFile = userScriptFile.replace(utilsKey, "");
    }
    await writeFile(scriptFinalLocation, userScriptFile);
    scriptHash = createHash('sha256').update(userScriptFile).digest('hex');
  }

  // for sitemap, literally stolen from skyscheduler lmao
  const SITE_URL = "https://agenticalert.download";
  const currentYear = (new Date()).getFullYear();

  // things that can be replaced in the section code
  const sectionFiller = new Map([
    ["{HASH}", scriptHash],
    ["{VERSION}", scriptVersion],
    ["{UTILHASH}", utilHash],
    ["{DEFHASH}", defHash],
    ["{DATE}", currentYear]
  ])

  // build out the HTML replacement code from each section file
  // keys are the filenames all uppercased
  for await (const sectionFile of glob("site/sections/*")) {
    const fileKey = sectionFile.replace(/(site\\sections\\|site\/sections\/|index|\.html)/g, "").toUpperCase();
    let fileContents = await readFile(sectionFile, {encoding: "utf-8"});
    sectionFiller.forEach((value, key) => {
      fileContents = fileContents.replace(key, value);
    });
    sections.set(fileKey, fileContents);
  }

  const skipSitemapRegex = new RegExp(`(${skipSitemapPages.map((itm) => itm.replace(/(\.|\/)/g, "\\$1").replace(/(\*\*)/, ".*")).join("|")})`, "i");

  // match swap with dynamic content
  const sectionInjection = (_match, p1) => {
    if (!sections.has(p1)) {
      console.error(`SITE BUILD - Missing section key ${p1}`);
      return "";
    }
    return sections.get(p1);
  };

  const sitemap_pages = [];
  // build each page in the pages dir
  for await (const pageFile of glob("site/pages/*", {exclude: skipBuildPages})) {
    if (skipSitemapRegex.test(pageFile) === false) {
      sitemap_pages.push({
        url: pageFile.replace(/(site\\pages\\|site\/pages\/|index|\.html)/g, ""),
        lastMod: statSync(pageFile).mtime.toISOString()
      });
    }
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
  console.info("build complete");
}

buildSite();