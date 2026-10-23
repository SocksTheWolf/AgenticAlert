// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://socksthewolf.com/
// @run-at       document-end
// @version      1.0.14
// @description  Puts a notice if an AI Agent was used in a github repository
// @tag          utilities
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @updateURL    https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @grant        none
// @top-level-await
// ==/UserScript==

/*
  AgenticAlert - a notifier for slop/vibe/gpt repositories
  Copyright (C) 2026-present SocksTheWolf

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see {http://www.gnu.org/licenses/}.

  Home: https://github.com/socksthewolf/agenticalert
*/

/*************************************************/
// DATA TRACKING
/*************************************************/
// these are up here for easy access to edit, but they do waste (the most insubstantial) memory if we aren't on our matches

// github agent ids / agent names
const aiAgents = new Map([
  [199161495, "cursor"],
  [81847, "claude"],
  [158243242, "devin ai"],
  [175728472, "copilot PR"],
  [198982749, "copilot swe"],
  [223556219, "copilot cli"],
  [267193182, "codex"],
  [207944715, "replit agent"],
  [200291788, "gemini bot"],
  [176961590, "gemini"],
  [132028505, "coderabbit pr"],
  [191113872, "cubicdev pr"],
  [312387581, "breken ai"],
  [289058786, "ampagent"],
  [219766164, "opencode agent"]
]);

// helpful pre-transfer of ids to regexian style string
const aiAgentIds = Array.from(aiAgents.keys()).join("|");

// these are submodule names of known submodules that were made with genAI, prevents owners
// from claiming their repo doesn't use genAI, when it's completely based in it.
// pretty much anything from the "R.A.I.D. community" can be thrown in here
const aiRecompModules = [
  "psxrecomp",
  "segagenesisrecomp",
  "ndsrecomp",
  "gbarecomp",
  "snesrecomp",
  "recomp-ui"
];

// AGENTS.md SHOULD NEVER BE IN THIS LIST.
// checks are done without casing but we can leave it
// as lower case
const aiFileMarkers = [
  "claude.md",
  "gemini.md",
  ".superpowers",
  ".codex",
  ".?skills",
  ".claude",
  ".cursor",
  "^mcp",
  ".opencode",
  ".codex",
  ".openclaw",
  "openclaw.mjs",
  ".?mcp.json",
  ".?coderabbit.yaml",
  ".?kimi[\\q{\\-code}]?"
]

/*************************************************/
// Label and Reflow Prevention
/*************************************************/

// this is our label element, if it ever gets removed, this is reinjected.
let aiLabelElement = null;
// this is our scan class, and we use it for evil.
let scanCheck = null;

function updateAILabelElement(tag, value) {
  const shouldRemove = (value === null);
  const activeElement = document.getElementById("agenticAlertLabel") ?? aiLabelElement;
  if (shouldRemove) {
    activeElement.removeAttribute(tag);
    aiLabelElement.removeAttribute(tag);
  } else if (tag === "text") {
    activeElement.innerText = aiLabelElement.innerText = value;
  } else {
    activeElement.setAttribute(tag, value);
    aiLabelElement.setAttribute(tag, value);
  }
}

function addAILabelElement(watchMutation) {
  if (aiLabelElement === null) {
    console.error("AgenticAlert: Attempted to add label but element was null");
    return;
  }
  // disconnect any observers, we'll re-add them at the end.
  if (watchMutation) {
    aiMutationObservation.disconnect();
  }
  const titleComp = document.getElementById("repo-title-component");
  if (titleComp) {
    titleComp.firstChild.appendChild(aiLabelElement);
  }
  // this is the dumbest thing but it helps fight against github's DOM reflows
  if (watchMutation) {
    // remove any mutations we were watching originally
    aiMutationObservation.disconnect();
    aiMutationObservation.observe(document.body, { subtree: true, childList: true });
  }
}
const aiMutationObservation = new MutationObserver(async (_mutations) => {
  if (!document.getElementById("agenticAlertLabel")) {
    // if our label is gone, push a new one immediately.
    addAILabelElement(false);
  }
  // if a repo title element still exists, then we should check to see
  // if we should run the scan; this fights react bs from github
  if (document.getElementById("repo-title-component")) {
    await scanCheck.shouldRunScan(document.location.href);
  }
});

/*************************************************/
// The actual scanner
/*************************************************/
class AgenticAlertScan {
  // username: undefined|string
  // repo: undefined|string
  // url: undefined|string
  // hadContribError: undefined|true

  constructor(url) {
    this.create(url);
  }

  // in the future, we want to be able to reuse objects against Github's react behaviors
  create(url) {
    delete this.hadContribError;
    const githubURIRegex = /https:\/\/(?:www\.)?github\.com\/(?<username>[a-z0-9_-]+)\/(?<project>[\w\.\-]+)/i;
    const match = githubURIRegex.exec(url);
    if (match !== null && match.length === 3) {
      this.username = match[1];
      this.repo = match[2];
      this.url = url;
      return true;
    }
    return false;
  }

  isValid() {
    return this.username !== undefined && this.repo !== undefined;
  }

  warnAboutCopilot() {
    updateAILabelElement("style", "color: orange");
    updateAILabelElement("title", "Copilot usage may have been intentional or a fallout from Microsoft's many mistakes");
    updateAILabelElement("text", "Detected: Potential Copilot usage");
  }

  async fetchGithub(url, headers, max_attempts=5) {
    let attempts = 0, gotData = false, data = null;
    while (attempts < max_attempts) {
      updateAILabelElement("text", "Fetching data...");
      data = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          ...headers
        }
      });
      if (data.ok && data.status === 200) {
        gotData = true;
        break;
      } else if (data.status === 429) {
        // we have hit a rate limit, so we're going to just break out
        // it's unlikely this will happen to anyone
        break;
      }
      ++attempts;
      // dumb attempt at sleeping
      updateAILabelElement("text", "Waiting to Refetch in 5s");
      await new Promise(r => setTimeout(r, 5000));
    }
    if (gotData) {
      return await data.text();
    }
    return null;
  }

  async scanContribData() {
    updateAILabelElement("text", "Loading Repo Data...");

    const contribData =
      await this.fetchGithub(`https://github.com/${this.username}/${this.repo}/graphs/contributors-data`,
        {"Github-Verified-Fetch": true});

    if (contribData !== null) {
      updateAILabelElement("text", "Parsing Repo Data Results...");
      // generate the regex
      const aiAgentsRegex = new RegExp(`"id":(` + aiAgentIds + `),`, "gm");
      // do this evil to get the names of the ai agents used
      const matches = contribData.match(aiAgentsRegex);

      if (matches !== null && matches.length > 0) {
        let copilotCount = 0, nonCopilot = 0;
        const matchResults = matches.map((id) => {
          const num = Number(id.replace(`"id":`, "").replace(",", ""));
          if (num === 175728472 || num === 198982749 || num === 223556219) {
            ++copilotCount;
          } else {
            ++nonCopilot;
          }
          return aiAgents.get(num);
        });
        if (copilotCount === 1 && nonCopilot === 0) {
          this.warnAboutCopilot();
        } else {
          updateAILabelElement("style", "color: red");
          updateAILabelElement("text", `Uses AI: ${matchResults.join(", ").toLowerCase()}`);
        }
        return true;
      }
      return false;
    } else {
      this.hadContribError = true;
    }
  }
  scanSubModules() {
    const submoduleMatches = [];
    const submoduleRegex = new RegExp('^(' + aiRecompModules.join("|") + ')', 'i');
    const submodules = document.querySelectorAll(`.react-directory-truncate a:not([href^="/${this.username}/${this.repo}"]) span`);
    submodules.forEach((itm) => {
      // we need to check visibility here because github likes to have hidden views for small and large screens.
      // so you get double the data (dawg wtf)
      if (submoduleRegex.test(itm.innerText) && itm.checkVisibility()) {
        // we just want the submodule name, so remove everything else
        submoduleMatches.push(itm.innerText.split(" @", 1)[0]);
      }
    });

    // submodule result check!!!!
    if (submoduleMatches.length > 0) {
      updateAILabelElement("style", "color: orange");
      updateAILabelElement("title", "This isn't perfect because it has to check name data, which can be inaccurate");
      updateAILabelElement("text", `Detected: Potential genAI submodules: ${submoduleMatches.join(", ")}`);
      return true;
    }
    return false;
  }
  scanFiles() {
    const fileList = document.querySelectorAll(".react-directory-filename-cell a");
    // yet another dynamic regex, wowee!!!
    const fileNameRegex = new RegExp("(" + aiFileMarkers.map((itm) => itm.replace(/\./g, "\\.")).join("|") + ")", "ig");
    let matches = [], hasAgents = false;
    fileList.forEach((itm) => {
      if (itm.checkVisibility()) {
        if (itm.innerText === "AGENTS.md") {
          hasAgents = true;
          return;
        }
        if (fileNameRegex.test(itm.innerText)) {
          matches.push(itm.innerText);
        }
      }
    });
    if (matches.length > 0) {
      if (matches.length >= 2) {
        updateAILabelElement("style", "color: red");
      } else {
        updateAILabelElement("style", "color: orange");
      }
      let findings = matches.join("\n"), count = matches.length;
      if (hasAgents) {
        findings += "\nAGENTS.md";
        ++count;
      }
      updateAILabelElement("title", `Markers are:\n${findings}`);
      updateAILabelElement("text", `Detected ${count} genAI file markers: ${findings.replace(/\n/g, ", ")}`);
      return true;
    }
    return false;
  }
  async scanMetadata() {
    updateAILabelElement("text", "Loading Repo Metadata...");
    const sidebarData =
      await this.fetchGithub(`https://github.com/${this.username}/${this.repo}/_sidebar`,
        {"X-GitHub-UI-Service": true});

    if (sidebarData !== null) {
      updateAILabelElement("text", "Parsing Repo Metadata Results...");
      // much apologies to nancylyn, Microsoft has co-opted your id (1693627) to make it Copilot's avatar.
      const sidebarRegex = new RegExp('avatars\.githubusercontent\.com\/(?:u|in)\/(1693627|' + aiAgentIds + ')\\?', 'ig');
      let execArr, names = [], copilotCount = 0, nonCopilot = 0;
      // loop through regex matches
      while ((execArr = sidebarRegex.exec(sidebarData)) !== null) {
        // our match will always be in index 1
        const num = Number(execArr[1]);
        if (num === 1693627) {
          ++copilotCount;
          names.push("copilot");
        } else if (num === 175728472 || num === 198982749 || num === 223556219) {
          ++copilotCount;
        } else {
          ++nonCopilot;
        }
        names.push(aiAgents.get(num));
      }

      // if we have any name data, then AI was detected.
      if (names.length > 0) {
        if (copilotCount === 1 && nonCopilot === 0) {
          this.warnAboutCopilot();
        } else {
          updateAILabelElement("style", "color: red");
          updateAILabelElement("text", `Uses AI: ${names.join(", ").toLowerCase()}`);
        }
        return true;
      }
    }
    return false;
  }
  clearRepo() {
    if (this.hadContribError) {
      updateAILabelElement("text", "Encountered Network Error, but other scans were clean, try refresh");
      updateAILabelElement("style", "color: orange");
      return;
    }
    // fork check!!!!!!
    const checkFork = document.querySelector("span[data-testid=\"fork-parent\"]");
    if (checkFork !== null) {
      updateAILabelElement("text", "Likely Safe: Parent repo may use AI, but this fork has no genAI additions");
    } else {
      // we're all clear to go!!!
      updateAILabelElement("text", "Likely Safe: No known genAI detected");
    }
    updateAILabelElement("style", "color: green");
  }
  async runScan() {
    // reset
    updateAILabelElement("title", null);
    updateAILabelElement("style", "color: gray");
    updateAILabelElement("text", "Scanning for genAI...");

    // dante's genAI inferno
    try {
      // check contribs
      if (!(await this.scanContribData())) {
        // check sidebar metadata
        updateAILabelElement("text", "Checking Github Metadata");
        if (!(await this.scanMetadata())) {
          // check submodules
          updateAILabelElement("text", "Checking for AI Submodules");
          if (!this.scanSubModules()) {
            // check files
            if (!this.scanFiles()) {
              // Clear the repository from using genAI
              this.clearRepo();
            }
          }
        }
      }
    } catch (err) {
      console.error(`AgenticAlert: encountered error: ${err}`);
      updateAILabelElement("style", "style: orange");
      updateAILabelElement("text", "Encountered Error, submit bug report with data from console");
    }
  }
  async shouldRunScan(url) {
    if (this.url !== url) {
      console.warn(`AgenticAlert: Detected url change, reshifting scanner target`);
      this.create(url);
    } else {
      // no need to shift to any other targets, just early out instead
      return;
    }

    if (!this.isValid()) {
      console.warn(`AgenticAlert: Repo/User info is invalid!`);
      updateAILabelElement("text", "Warning! Unable to determine repo data, try refreshing");
      updateAILabelElement("style", "color: orange");
      return;
    }

    await this.runScan();
  }
}

await (async function() {
  'use strict';

  // check to see if we're on a repo page or not
  if (document.getElementById("repo-title-component")) {
    // create our scanner object
    scanCheck = new AgenticAlertScan(document.location.href);

    // Create results object
    aiLabelElement = document.createElement("span");
    aiLabelElement.setAttribute("id", "agenticAlertLabel");
    aiLabelElement.setAttribute("data-size", "small");
    aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
    aiLabelElement.setAttribute("data-component", "Label");
    addAILabelElement(true);

    await scanCheck.runScan();

  } else {
    console.error(`AgenticAlert: could not determine repository layout`);
  }
})();
