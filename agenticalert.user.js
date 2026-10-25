// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://socksthewolf.com/
// @run-at       document-end
// @version      1.1.04
// @description  Puts a notice if an AI Agent was used in a GitHub repository
// @tag          utilities
// @connect      raw.githubusercontent.com
// @icon         https://raw.githubusercontent.com/SocksTheWolf/AgenticAlert/refs/heads/main/icon.png
// @iconURL      https://raw.githubusercontent.com/SocksTheWolf/AgenticAlert/refs/heads/main/icon.png
// @icon64URL    https://raw.githubusercontent.com/SocksTheWolf/AgenticAlert/refs/heads/main/icon.png
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @updateURL    https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @top-level-await
// @noframes
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
// TODO: Consider encapsulation to prevent less cases of potential var stomps (as unlikely as that is).

// GitHub agent ids / agent names
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
// checks are done without casing but we can leave
// this list as lower case, but it doesn't have to be
const aiFileMarkers = [
  "claude.md",
  "gemini.md",
  "install_for_agents.md",
  ".superpowers",
  ".codex",
  ".hermes",
  ".?skills",
  ".claude",
  ".agents?",
  ".clinerules",
  ".kiro",
  ".qoder",
  ".chatgpt",
  ".cursor",
  "^mcp",
  ".opencode",
  ".windsurf",
  ".codex",
  ".?openclaw",
  "openclaw.mjs",
  ".?mcp.json",
  ".?coderabbit.yaml",
  ".?kimi[\\q{\\-code}]?",
  ".playwright-mcp"
];

// dynamic regex of the above, global because it's used in two places with no changes.
const aiFileNameRegex = new RegExp("(" + aiFileMarkers.map((itm) => itm.replace(/\./g, "\\.")).join("|") + ")", "ig");

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
  // this is the dumbest thing but it helps fight against GitHub's DOM reflows
  if (watchMutation) {
    aiMutationObservation.observe(document.body, { subtree: true, childList: true });
  }
}
const aiMutationObservation = new MutationObserver(async (_mutations) => {
  if (!document.getElementById("agenticAlertLabel")) {
    // if our label is gone, push a new one immediately.
    addAILabelElement(false);
  }
  // if a repo title element still exists, then we should check to see
  // if we should run the scan; this fights react reflow bs from GitHub
  if (document.getElementById("repo-title-component") && scanCheck !== null) {
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

  // hadNetworkError: undefined|true
  // hasGitIgnore: undefined|true
  // hasPotentialCopilot: undefined|true

  constructor(url) {
    this.create(url);
  }

  reset() {
    delete this.hasPotentialCopilot;
    delete this.hadNetworkError;
    delete this.hasGitIgnore;
  }

  // in the future, we want to be able to reuse objects against Github's react behaviors
  create(url) {
    this.reset();
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

  async fetchGithub(url, headers, max_attempts=5) {
    let attempts = 0, gotData = false, data = null;
    const initialText = aiLabelElement.innerText;
    while (attempts < max_attempts) {
      updateAILabelElement("text", `${initialText} - Fetching GitHub data...`);
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
      updateAILabelElement("text", `${initialText} - Waiting to retry in 5s. Attempt: ${attempts}/${max_attempts}`);
      await new Promise(r => setTimeout(r, 5000));
    }
    if (gotData) {
      return await data.text();
    }
    return null;
  }

  async scanContribData() {
    updateAILabelElement("text", "Loading Repo Git Data");

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
          this.hasPotentialCopilot = true;
          return false;
        } else {
          updateAILabelElement("style", "color: red");
          updateAILabelElement("title", "Github git contribution data shows genAI agent usage");
          updateAILabelElement("text", `Uses AI: ${matchResults.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      this.hadNetworkError = true;
    }
    return false;
  }
  async scanMetadata() {
    updateAILabelElement("text", "Checking Github Metadata");
    const sidebarData =
      await this.fetchGithub(`https://github.com/${this.username}/${this.repo}/_sidebar`,
        {"X-GitHub-UI-Service": true});

    if (sidebarData !== null) {
      updateAILabelElement("text", "Parsing Repo Metadata Results...");
      // much apologies to nancylyn, Microsoft has co-opted your id (1693627) to make it Copilot's avatar.
      const sidebarRegex = new RegExp('avatars\.githubusercontent\.com\/(?:u|in)\/(1693627|' + aiAgentIds + ')\\?', 'ig');
      let execRes, names = [], copilotCount = 0, nonCopilot = 0;
      // loop through regex matches
      while ((execRes = sidebarRegex.exec(sidebarData)) !== null) {
        // our match will always be in index 1
        const num = Number(execRes[1]);
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
          this.hasPotentialCopilot = true;
          return false;
        } else {
          updateAILabelElement("style", "color: red");
          updateAILabelElement("title", "Github metadata shows genAI agent usage");
          updateAILabelElement("text", `Uses AI: ${names.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      this.hadNetworkError = true;
    }
    return false;
  }
  scanSubModules() {
    updateAILabelElement("text", "Checking for AI Submodules");
    const submoduleMatches = [];
    const submoduleRegex = new RegExp('^(' + aiRecompModules.join("|") + ')', 'i');
    const submodules = document.querySelectorAll(`.react-directory-truncate a:not([href^="/${this.username}/${this.repo}"]) span`);
    submodules.forEach((itm) => {
      // we need to check visibility here because GitHub likes to have hidden views for small and large screens.
      // so you get double the data (dawg wtf)
      if (submoduleRegex.test(itm.innerText)) {
        // we just want the submodule name, so remove everything else
        const submoduleName = itm.innerText.split(" @", 1)[0];
        if (!submoduleMatches.includes(submoduleName)) {
          submoduleMatches.push(submoduleName);
        }
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
    updateAILabelElement("text", "Checking for AI files");
    const fileList = document.querySelectorAll(".react-directory-filename-cell a"), matches = [];
    let hasAgents = false;
    fileList.forEach((itm) => {
      const fileName = itm.innerText;
      // I hate this check, but GitHub will otherwise send us duplicate elements
      if (!matches.includes(fileName)) {
        if (fileName === ".gitignore") {
          this.hasGitIgnore = true;
        } else if (fileName === "AGENTS.md") {
          hasAgents = true;
        } else if (aiFileNameRegex.test(fileName)) {
          matches.push(fileName);
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
  async scanGitIgnore() {
    updateAILabelElement("text", "Checking for hidden AI markers");
    const branchPicker = document.getElementById("ref-picker-repos-header-ref-selector");
    if (branchPicker && this.hasGitIgnore) {
      const branchName = branchPicker.getAttribute("aria-label").split(" ")[0];
      const response = await GM.xmlHttpRequest(
        {url: `https://raw.githubusercontent.com/${this.username}/${this.repo}/refs/heads/${branchName}/.gitignore`, method: "GET"}
      ).catch(e => console.error(`AgenticAlert: fetching .gitignore failed with ${e}`));

      if (response.status === 200) {
        const gitIgnoreContents = response.responseText;
        const matches = gitIgnoreContents.match(aiFileNameRegex);
        const hasAgents = (/agents\.md/ig).test(gitIgnoreContents);
        if (matches !== null && matches.length > 0) {
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
          updateAILabelElement("title", `Hidden markers are:\n${findings}`);
          updateAILabelElement("text", `Detected ${count} hidden genAI file markers: ${findings.replace(/\n/g, ", ")}`);
          return true;
        } else if (hasAgents) {
          updateAILabelElement("style", "color: orange");
          updateAILabelElement("title", `Hidden markers are:\nAGENTS.md`);
          updateAILabelElement("text", `Detected hidden genAI file marker: AGENTS.md`);
          return true;
        }
      } else {
        console.warn(`AgenticAlert: Could not get .gitignore file data, got return ${response.status}`);
        this.hadNetworkError = true;
      }
    }
    return false;
  }
  clearRepo() {
    // The copilot check
    if (this.hasPotentialCopilot) {
      updateAILabelElement("style", "color: orange");
      updateAILabelElement("title", "Copilot usage may have been intentional or a fallout from Microsoft's many mistakes");
      updateAILabelElement("text", "Detected: Potential Copilot usage");
      return;
    }

    // if we encountered any errors
    if (this.hadNetworkError) {
      updateAILabelElement("text", "Encountered Network Error, but other scans were clean, try refresh");
      updateAILabelElement("style", "color: orange");
      return;
    }

    // fork check!!!!!!
    const checkFork = document.querySelector("span[data-testid=\"fork-parent\"]");
    if (checkFork !== null) {
      updateAILabelElement("text", "Potentially Safe: Parent repo may use AI, but this fork has no genAI additions");
    } else {
      // we're all clear to go!!!
      updateAILabelElement("text", "Potentially Safe: No known genAI detected");
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
        if (!(await this.scanMetadata())) {
          // check submodules
          if (!this.scanSubModules()) {
            // check files
            if (!this.scanFiles()) {
              // check the .gitignore file
              if (!(await this.scanGitIgnore())) {
                // Clear the repository from using genAI
                this.clearRepo();
              }
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

    // add a style in here so that we stay readable at other sizes.
    GM_addStyle(`#agenticAlertLabel {max-width: 65%; height: unset !important;
      min-height: var(--base-size-20,1.25rem);
      white-space: normal; padding-left: 0.5rem;}`);

    // Create results object
    aiLabelElement = document.createElement("span");
    aiLabelElement.setAttribute("id", "agenticAlertLabel");
    aiLabelElement.setAttribute("data-size", "small");
    aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
    aiLabelElement.setAttribute("data-component", "Label");
    addAILabelElement(true);

    await scanCheck.runScan();

  } else {
    console.warn(`AgenticAlert: could not determine repository layout`);
  }
})();
