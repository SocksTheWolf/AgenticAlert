// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://socksthewolf.com/
// @run-at       document-end
// @version      1.3.0
// @description  Puts a notice if an AI Agent was used in a GitHub repository
// @tag          utilities
// @connect      raw.githubusercontent.com
// @icon         https://agenticalert.download/icon.png
// @iconURL      https://agenticalert.download/icon.png
// @icon64URL    https://agenticalert.download/icon.png
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://agenticalert.download/agenticalert.user.js
// @updateURL    https://agenticalert.download/agenticalert.user.js
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

// GitHub account ids -> {integration id/agent names}
const aiAgents = new Map([
  [199161495, {name: "cursor"}],
  [206951365, {i: 1210556, name: "cursor pr"}],
  [81847,     {name: "claude"}],
  [209825114, {i: 1236702, name: "claude pr"}],
  [158243242, {i: 811515, name: "devin ai"}],
  [175728472, {i: 946600, name: "copilot PR"}],
  [198982749, {i: 1143301, name: "copilot swe"}],
  [223556219, {i: 1693627, name: "copilot cli"}],
  [267193182, {name: "codex"}],
  [207944715, {name: "replit agent"}],
  [200291788, {name: "gemini bot"}],
  [176961590, {i: 956858, name: "gemini"}],
  [136622811, {i: 347564, name: "coderabbit pr"}],
  [191113872, {i: 1082092, name: "cubicdev pr"}],
  [312387581, {name: "breken ai"}],
  [289058786, {name: "ampagent"}],
  [219766164, {i: 1549082, name: "opencode agent"}],
  [271391591, {name: "paperclip"}],
  [311835222, {i: 211522643, name: "roomote cloud ai"}],
  [301996811, {i: 4262291, name: "roomote ai"}],
  [133978099, {name: "autogpt"}],
  [254786068, {i: 2652220, name: "firecrawl ai"}],
  [230910855, {i: 1915919, name: "capy ai"}],
  [165735046, {i: 867647, name: "greptile pr"}],
  [138933559, {i: 358017, name: "factory droid"}],
  [175740463, {name: "openhands ai"}],
  [311266734, {name: "ouroboros agent"}],
  [232216315, {name: "leeroo coder"}],
  [159090032, {name: "ellipsis agent"}],
  [65095814,  {i: 64358, name: "ellipsisdev"}],
  [248236658, {name: "compozybot"}],
  [161369871, {i: 842251, name: "google jules"}],
  [43742164,  {name: "rtBot"}],
  [149573631, {i: 416801, name: "entelligence ai pr"}],
  [265127642, {name: "commandcode bot"}],
  [148906541, {i: 413177, name: "codeflash ai"}],
  [179624822, {i: 980774, name: "devsy pr ai"}],
  [240665456, {i: 2193792, name: "kilocode"}],
  [138030887, {i: 353721, name: "builderio ai"}],
  [159125892, {i: 818760, name: "lovable ai"}],
  [151058649, {i: 484649, name: "qodo ai pr"}],
  [189517486, {i: 1068000, name: "qodo oss pr"}],
  [328778573, {i: 4931833, name: "lia ai"}],
  [244629292, {name: "kiro agent"}],
  [230936708, {i: 1916892, name: "continue ai"}],
  [119856028, {i: 268977, name: "aikido pr"}],
  [276134852, {i: 3381200, name: "cline cloud"}],
  [58596630,  {i: 48477, name: "sourcery pr"}],
  [248968518, {name: "adal cli"}],
  [220387035, {name: "trae agent"}],
  [258877100, {i: 2780473, name: "aether pr"}],
  [224887109, {i: 1734312, name: "freebuff ai"}],
  [230265268, {name: "tambobot"}],
  [281769369, {i: 3601981, name: "tambobot cloud"}],
  [198680274, {i: 1140780, name: "charliecreates pr"}],
  [197835787, {name: "charliehelps"}],
  [238992291, {name: "sisyphus ai"}],
  [192355599, {i: 1093193, name: "askmanu"}],
  [226033991, {i: 1768019, name: "pullfrog pr"}],
  [280122609, {i: 3535277, name: "openclaw cloud"}],
  [274271284, {i: 3306130, name: "clawsweeper ai"}],
  [280513762, {name: "clawsweeper"}],
  [309084314, {name: "roboclaw"}],
  [222613912, {i: 1658531, name: "linear code pr"}],
  [44709815,  {i: 20150, name: "linear code"}],
  [114527992, {i: 242248, name: "what the diff pr"}],
  [151821869, {i: 646884, name: "codeant pr"}],
  [257055122, {i: 2724203, name: "ecctools"}],
  [125450591, {i: 293841, name: "fineai pr"}],
  [208079219, {i: 1220912, name: "amazon q"}],
  [131922026, {i: 324583, name: "dosubot pr"}],
  [281726552, {name: "dosubot"}],
  [62050782,  {i: 57168, name: "deepsource pr"}],
  [47775046,  {i: 25603, name: "codefactor pr"}],
  [125169248, {i: 292659, name: "crgpt"}],
  [234243425, {i: 2008959, name: "zippy"}],
  [157525551, {name: "bito agent"}],
  [188872107, {i: 1061978, name: "bito pr"}],
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
  "recomp-ui",
];

// AGENTS.md SHOULD NEVER BE IN THIS LIST.
// checks are done without casing but we can leave
// this list as lower case, but it doesn't have to be
const aiFileMarkers = [
  "claude.md",
  "claude.local.md",
  "gemini.md",
  "gemini.local.md",
  "copilot-instructions.md",
  "adal.md",
  "autosde.ya?ml",
  "qwen.md",
  "skills?.md",
  "cursor.md",
  "install_for_agents.md",
  "LLAMA_CPP_VERSION",
  ".superpowers",
  ".codex",
  ".hermes",
  ".?skills",
  ".claude",
  ".adal",
  ".agents?",
  ".clinerules",
  ".continue",
  ".kiro",
  ".aieditoragent",
  ".qoder",
  ".?trae",
  ".qwen",
  ".gemini",
  ".chatgpt",
  ".grok-plugin",
  ".cursor",
  "^mcp",
  ".devin",
  ".serena",
  ".opencode",
  ".windsurf",
  ".metabob",
  ".?openclaw",
  "openclaw.mjs",
  "llms-full.txt",
  "gemini-extension",
  ".?mcp.json",
  ".?coderabbit.ya?ml",
  ".?cubic.ya?ml",
  ".?kimi[\\q{-code}]?",
  ".?kilo[\\q{code}]?",
  ".playwright-mcp",
  ".fleet",
  ".air",
  "freebuff",
  ".senpi",
  ".?openai",
  ".langgraph_api",
  ".?langgraph.json",
  ".?greptile.json",
  ".omc?p?",
  ".pi\/?\*?\*?$",
  ".promptflow",
  ".abstra",
  ".?paperclip",
  ".herenow",
  ".rooignore",
  ".commandcode",
  ".roomote",
  "agents.local.md",
  "agenthistory.json",
  ".?graphify",
  ".orca",
  "orca.ya?ml",
  ".bito.ya?ml",
  "bito-cra.properties",
];

// dynamic regex of the above, global because it's used in two places with no changes.
const aiFileNameRegex = new RegExp(`(${[...aiFileMarkers, ...aiRecompModules].map((itm) => itm.replace(/(\*|\.|\-)/g, "\\$1")).join("|")})`, "ig");

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

  async fetchGithub(url, headers={}, max_attempts=5) {
    let attempts = 0, gotData = false, data = null;
    const initialText = aiLabelElement.innerText;
    while (attempts < max_attempts) {
      updateAILabelElement("text", `${initialText} - Fetching GitHub data...`);
      data = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Github-Verified-Fetch": true,
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
      await this.fetchGithub(`https://github.com/${this.username}/${this.repo}/graphs/contributors-data`);

    if (contribData !== null) {
      updateAILabelElement("text", "Parsing Repo Data Results...");
      // generate the regex
      const aiAgentsRegex = new RegExp(`"id":(${aiAgentIds}),`, "gm");
      // do this evil to get the names of the ai agents used
      const matches = contribData.match(aiAgentsRegex);
      if (matches !== null && matches.length > 0) {
        let copilotCount = 0, nonCopilot = 0;
        const matchResults = matches.map((id) => {
          const num = Number(id.replace(aiAgentsRegex, "$1"));
          if (num === 175728472 || num === 198982749 || num === 223556219) {
            ++copilotCount;
          } else {
            ++nonCopilot;
          }
          return aiAgents.get(num).name;
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
      await this.fetchGithub(`https://github.com/${this.username}/${this.repo}/commits/deferred_commit_contributors`);

    if (sidebarData !== null) {
      updateAILabelElement("text", "Calculating Integration Ids...");
      // Github Bot Integration Ids -> Agents
      // Used for metadata as a quicker way to do reverse lookup
      const aiAgentAvatars = new Map();
      aiAgents.forEach(((value, key) => {
        if (value.i !== undefined) {
          aiAgentAvatars.set(value.i, key);
        }
      }));

      updateAILabelElement("text", "Parsing Repo Metadata Results...");
      const integrationIDs = Array.from(aiAgentAvatars.keys()).join("|");
      // yeah good luck reversing this one, buddy.
      const metadataRegex = new RegExp(`u\/(${aiAgentIds})|in\/(${integrationIDs})\\?v=`, 'ig');
      let execRes, names = [], copilotCount = 0, nonCopilot = 0;
      // loop through regex matches
      while ((execRes = metadataRegex.exec(sidebarData)) !== null) {
        // cleanup bad entries
        execRes = execRes.filter((itm) => itm !== undefined);
        // our match will always be in index 1
        let num = Number(execRes[1]);
        if (execRes[0].includes("in/")) {
          num = aiAgentAvatars.get(num);
        }

        if (num === 175728472 || num === 198982749 || num === 223556219) {
          ++copilotCount;
        } else {
          ++nonCopilot;
        }
        names.push(aiAgents.get(num).name);
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
    const submoduleRegex = new RegExp(`^(${aiRecompModules.join("|")})`, 'i');
    const submodules = document.querySelectorAll(`.react-directory-truncate a:not([href^="/${this.username}/${this.repo}"]) span`);
    submodules.forEach((itm) => {
      if (submoduleRegex.test(itm.innerText)) {
        // we just want the submodule name, so remove everything else
        const submoduleName = itm.innerText.split(" @", 1)[0];
        // Check for duplicates because github loves to give us dupes
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
      console.warn(`AgenticAlert: Detected url change to ${url}, reshifting scanner target`);
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
      white-space: normal; padding: 0.34rem;}`);

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
