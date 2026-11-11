// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://agenticalert.download/
// @run-at       document-end
// @version      1.5.8
// @description  Detects if genAI was used in a GitHub project repository
// @tag          utilities
// @grant        none
// @addutils
// @adddef
// @icon         https://agenticalert.download/icon.png
// @iconURL      https://agenticalert.download/icon.png
// @icon64URL    https://agenticalert.download/icon.png
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://agenticalert.download/agenticalert.user.js
// @updateURL    https://agenticalert.download/agenticalert.user.js
// @supportURL   https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose
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
// {-UTILS-}
// {-DEFINITIONS-}
/*************************************************/
// Label and Reflow Prevention
/*************************************************/
// this is our label element, if it ever gets removed, this is reinjected.
let aiLabelElement = null;
// this is our scan class, and we use it for evil.
let scanCheck = null;

// List of github elements, for easy of maintaining and updating later :)
const ghElements = {
  readme: ".markdown-body",
  title: "repo-title-component",
  gitModule: ".react-directory-filename-cell a[title='.gitmodules']",
  files: ".react-directory-filename-cell a",
  fork: `span[data-testid="fork-parent"]`,
  branchName: "#ref-picker-repos-header-ref-selector * span:last-of-type",
  description: "p[class*='description']",
}

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
  const titleComp = document.getElementById(ghElements.title);
  if (titleComp) {
    titleComp.firstChild.appendChild(aiLabelElement);
  }
  // this is the dumbest thing but it helps fight against GitHub's DOM reflows
  if (watchMutation) {
    observeAIMutation();
  }
}

function observeAIMutation() {
  aiMutationObservation.observe(document.body, { subtree: true, childList: true });
}
const aiMutationObservation = new MutationObserver(async (_mutations) => {
  if (!document.getElementById("agenticAlertLabel")) {
    // if our label is gone, push a new one immediately.
    addAILabelElement(false);
  }
  // if a repo title element still exists, then we should check to see
  // if we should run the scan; this fights react reflow bs from GitHub
  if (document.getElementById(ghElements.title) && scanCheck !== null) {
    await scanCheck.shouldRunScan(document.location.href);
  }
});

/*************************************************/
// The actual scanner
/*************************************************/
class AgenticAlertScan {
  // user: undefined|string
  // project: undefined|string
  // url: undefined|string

  // debug: {}
  // repo: {}
  // output: {}

  constructor(url) {
    this.reset();
    if (url !== null) {
      this.create(url);
    }
  }

  reset() {
    this.debug = {
      skipContrib: false,
      skipMetadata: false,
      skipDescription: false,
    };
    this.repo = {
      // networkError: undefined|true
      // copilot: undefined|true
      // hasIgnore: undefined|true
      // hasClaudeDir: undefined|true
      // hasAgents: undefined|true
      // branchName: undefined|string
    };
    this.output = {
      // text
      // title
      // status
      // link
    }
  }

  create(url) {
    this.reset();
    const githubURIRegex = /https:\/\/(?:www\.)?github\.com\/([a-z0-9_-]+)\/([\w\.\-]+)/i;
    const match = githubURIRegex.exec(url);
    if (match !== null && match.length === 3) {
      this.user = match[1];
      this.project = match[2];
      this.url = url;
      return true;
    }
    return false;
  }

  updateOutput(key, value) {
    if (value === null) {
      delete this.output[key];
    } else {
      this.output[key] = value;
    }
  }

  writeOutput() {
    const propertiesDefined = Object.getOwnPropertyNames(this.output);
    propertiesDefined.forEach((prop) => {
      updateAILabelElement(prop, this.output[prop]);
    });
  }

  contentJudge(content) {
    const results = {
      items: content.match(aiFileNameRegex) ?? [],
      count: 0,
      color: "warning",
      hasAgents: false,
      hasClaudeDir: false,
      hasZed: false
    };
    // snapshot of the results before we add special items
    results.count = results.items.length;
    // determine if we should elevate the response
    if (results.count >= 2) {
      results.color = "danger";
    }
    // push our special detections if we have other markers
    if ((/agents\.md/i).test(content)) {
      results.items.push("AGENTS.md");
      results.hasAgents = true;
    }
    if ((/^\.zed/im).test(content)) {
      results.items.push(".zed");
      results.hasZed = true;
    }
    if ((/^\.claude/im).test(content)) {
      results.hasClaudeDir = true;
    }
    // if you have both special flags, that's a massive red flag
    if (results.hasZed && results.hasAgents) {
      results.color = "danger";
      results.count += 2;
    }
    return results;
  }

  countJudge(resultNum) {
    return resultNum >= 2 ? "danger" : "warning";
  }

  isValid() {
    return this.user !== undefined && this.project !== undefined;
  }

  makeGithubLink(path) {
    return `https://github.com/${this.user}/${this.project}/${path}`;
  }

  async fetchGithub(url, fetchOptions={}, max_attempts=5, timeout=13000) {
    let attempts = 0, gotData = false, data = null;
    const initialText = aiLabelElement.innerText;
    const githubURL = this.makeGithubLink(url);
    // lambda for writing out progress text good
    const getAttemptString = (words) => {
      return `${initialText} - ${words}. Attempt: ${attempts}/${max_attempts}`;
    };
    // lambda for adding a delay between requests, default ~5s
    const sleepRequest = async (time=5000) => {
      await new Promise(r => setTimeout(r, time));
    };
    while (attempts < max_attempts) {
      const fetchTimeout = new AbortController();
      updateAILabelElement("text", `${initialText} - Fetching GitHub data...`);
      try {
        ++attempts;
        const timeoutWatcher = setTimeout(function(){ fetchTimeout.abort(); }, timeout);
        // go fetch, setTimeout will sit in the bg
        data = await fetch(githubURL, {
          method: fetchOptions.method ?? "GET",
          headers: fetchOptions.headers ?? {
            "X-Requested-With": "XMLHttpRequest",
            "Github-Verified-Fetch": true,
          },
          signal: fetchTimeout.signal
        });
        // if we get a promise return, kill the timeout so we don't throw
        clearTimeout(timeoutWatcher);
        if (data.ok && data.status === 200) {
          gotData = true;
          break;
        } else if (data.status === 429 || data.status === 404) {
          // we have hit a rate limit, so we're going to just break out
          // it's unlikely this will happen to anyone
          break;
        } else if (data.status === 400) {
          const errData = (await data.text()) ?? "";
          // if the contrib data is absolute garbage, do not continue
          // trying to fetch, instead get out immediately.
          if (errData === `{"unusable":true}`) {
            console.warn(`AgenticAlert: fetch returned explicit unusable JSON structure`);
            break;
          }
        } else if (data.status >= 500) {
          // github is down, break out.
          break;
        }
        updateAILabelElement("text", getAttemptString("Waiting 5s to retry"));
        await sleepRequest(5000);
      } catch (err) {
        console.warn(`AgenticAlert - Encountered timeout on ${url} - ${attempts} of ${max_attempts}`);
        // Ignore all errors, retry (nearly) immediately
        updateAILabelElement("text", getAttemptString("Timed out, retrying"));
        await sleepRequest(2000);
      }
    }
    if (gotData) {
      if (fetchOptions.output === "json") {
        return (await data.json()) ?? {};
      }
      return (await data.text()) ?? "";
    }
    return null;
  }

  async scanContribData() {
    if (this.debug.skipContrib) {
      return false;
    }
    updateAILabelElement("text", "Loading Repo Git Data");

    const contribData = await this.fetchGithub(`graphs/contributors-data`);
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
          this.repo.copilot = true;
          return false;
        } else {
          this.updateOutput("status", "danger");
          this.updateOutput("title", `Git contribution data shows the usage of ${pluralize(matchResults, "genAI agent")}`);
          this.updateOutput("text", `Uses AI: ${matchResults.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      console.warn(`AgenticAlert: Git Contrib data was empty`);
      this.repo.networkError = true;
    }
    return false;
  }
  async scanMetadata() {
    if (this.debug.skipMetadata) {
      return false;
    }
    updateAILabelElement("text", "Checking Github Metadata");
    const metadataData = await this.fetchGithub(`commits/deferred_commit_contributors`);

    if (metadataData !== null) {
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
      while ((execRes = metadataRegex.exec(metadataData)) !== null) {
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
          this.repo.copilot = true;
          return false;
        } else {
          this.updateOutput("status", "danger");
          this.updateOutput("title", `Github metadata shows the usage of ${pluralize(names, "genAI agent")}`);
          this.updateOutput("text", `Uses AI: ${names.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      console.warn(`AgenticAlert: Metadata was empty`);
      this.repo.networkError = true;
    }
    return false;
  }
  async scanSubModules() {
    updateAILabelElement("text", "Checking for AI Submodules");
    const submoduleMatches = [];
    const submoduleRegex = new RegExp(`^(${recompDetectionStr})`, 'i');
    const hasGitModules = document.querySelector(ghElements.gitModule) !== null;
    const submodules = document.querySelectorAll(`.react-directory-truncate a:not([href^="/${this.user}/${this.project}"]) span`);
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
    const submoduleCount = submoduleMatches.length;
    if (submoduleCount > 0) {
      this.updateOutput("status", this.countJudge(submoduleCount));
      this.updateOutput("title", "This project has links to known slop modules");
      this.updateOutput("text", `Detected: Link to ${pluralize(submoduleMatches, "known genAI submodule")} - ${submoduleMatches.join(", ")}`);
      return true;
    } else if (hasGitModules && this.repo.branchName !== undefined) {
      updateAILabelElement("text", "Fetching Submodule Configuration");
      const gitModulesContents = await this.fetchGithub(`raw/${this.repo.branchName}/.gitmodules`,
        {method: "GET", headers: {}});
      if (gitModulesContents !== null) {
        updateAILabelElement("text", "Parsing Submodule Configuration");
        const gitmodulesRegex = new RegExp(`^\\s+?url\\s+?=\\s+?.*\\/(${recompDetectionStr})`, 'igm');
        const gitModuleMatches = compactRegexResult(gitModulesContents, gitmodulesRegex);
        const modNumbers = gitModuleMatches.length;
        if (modNumbers > 0) {
          this.updateOutput("status", this.countJudge(modNumbers));
          this.updateOutput("title", ".gitmodules points to a known genAI slop submodule name");
          this.updateOutput("text", `Detected: Includes ${pluralize(gitModuleMatches, "known genAI submodule")} - ${gitModuleMatches.join(", ")}`);
          return true;
        }
      } else {
        console.warn(`AgenticAlert: No response when trying to fetch .gitmodules`);
        this.repo.networkError = true;
      }
    }
    return false;
  }
  async scanBranchPrefixes() {
    updateAILabelElement("text", "Fetching branch names");

    const branchNameFetch = await this.fetchGithub(`refs?type=branch`, {headers: {"Accept": "application/json"}, output: "json"});
    if (branchNameFetch != null && branchNameFetch.refs !== undefined) {
      if (branchNameFetch.refs.length > 0) {
        updateAILabelElement("text", "Scanning branch names");
        const aiBranchPrefixRegex = new RegExp(`^(${aiBranchPrefixNames.join("|")})`, "im");
        let nameMatches = [];
        branchNameFetch.refs.forEach((name) => {
          if (aiBranchPrefixRegex.test(name)) {
            nameMatches.push(name);
          }
        });

        const matchCount = nameMatches.length;
        if (matchCount > 0) {
          const max_results = 10;
          if (matchCount > max_results) {
            nameMatches = nameMatches.slice(0, max_results);
            nameMatches.push("...");
          }
          this.updateOutput("status", this.countJudge(matchCount));
          this.updateOutput("title", `Many cloud agents will fingerprint their branch names. Results are truncated to ${max_results} values`);
          this.updateOutput("text", `Detected: ${pluralize(matchCount, "genAI branch prefix", "es")} - ${nameMatches.join(", ")}`);
          return true;
        }
      }
    } else {
      console.warn(`AgenticAlert: No branches were detected, object was potentially invalid.`);
      this.repo.networkError = true;
    }
    return false;
  }
  scanFiles() {
    // this title write will be deleted if/when we get to finalizeRepo
    this.updateOutput("title", `Due to optimization, "duplicates" are actually multiple instances, but we only print what we match`);
    updateAILabelElement("text", "Checking for AI files");
    const fileElements = document.querySelectorAll(ghElements.files), filesList = [];
    // dedupe the element list, as github will give us duplicates
    fileElements.forEach((itm) => {
      const fileName = itm.innerText;
      if (!filesList.includes(fileName)) {
        filesList.push(fileName);
      }
      if (fileName === ".gitignore") {
        this.repo.hasIgnore = true;
      }
    });
    const matches = this.contentJudge(filesList.join("\n"));
    if (matches.count > 0) {
      this.updateOutput("status", matches.color);
      this.updateOutput("text", `Detected ${pluralize(matches.items, "genAI file marker")}: ${matches.items.join(", ")}`);
      if (matches.hasClaudeDir && matches.count <= 2) {
        this.repo.hasClaudeDir = true;
        return false;
      }
      return true;
    }
    if (matches.hasAgents) { // make sure to save if we found AGENTS.md
      this.repo.hasAgents = true;
    }
    return false;
  }
  // This is so much work for so little gain.
  async scanClaudeConfig() {
    if (this.repo.hasClaudeDir !== true || this.repo.branchName === undefined) {
      // skip anything that doesn't have a claude dir
      return false;
    }
    updateAILabelElement("text", "Fetching .claude settings for poison");
    // Attempt to grab the claude config file
    const claudeConfig = await this.fetchGithub(`raw/${this.repo.branchName}/.claude/settings.json`,
      {method: "GET", headers: {}}, 2, 6000);
    if (claudeConfig !== null) {
      // don't bother processing if anything is "allowed"/"ask"
      if ((/\"(allow|ask)\"/mi).test(claudeConfig)) {
        console.debug(`AgenticAlert - Claude config had "allow" or "ask" which is not allowed.`);
        return true;
      }
      updateAILabelElement("text", "Scanning .claude settings data");
      // Now we have to check denials to make sure you're not false flagging us
      // this will look for denials anywhere in the structure and only capture denials
      const claudeDenyCapture = /"permissions":\s*{.+?"deny":\s*\[\s*("[^\[\]]*?")\s*\]/ims;
      const claudeConfigDeny = (claudeConfig.match(claudeDenyCapture) ?? []).pop() ?? null;
      // if no matches, use previous judgement
      if (claudeConfigDeny === null) {
        return true;
      }

      const claudeConfigDenyCleaned = claudeConfigDeny.replace(/\s|"/g, "");
      const claudeDenialCompRegex = new RegExp(`(${claudeDenyConfigDirectives.join("|")})`, "ig");
      const claudeConfigDenialMatches = [];
      // yet another awful match, with a bonus dedupe operation
      (claudeConfigDenyCleaned.match(claudeDenialCompRegex) ?? []).forEach((val) => {
        if (!claudeConfigDenialMatches.includes(val)) {
          claudeConfigDenialMatches.push(val);
        }
      });

      if (claudeConfigDenialMatches.length >= claudeSafeMatchAmt) {
        // Change the response, they have enough denials to give them an alert.
        this.updateOutput("status", "info");
        this.updateOutput("title", `The .claude/settings.json has poison instructions to hurt Claude from working.
          Detected ${claudeConfigDenialMatches.length} actions`);
        this.updateOutput("text", "Detected: Presence of LLM files but they have anti-LLM data in them. Might be safe");
        return true;
      }
    }
    // They were previously judged. You cannot last this long here, so kill.
    return true;
  }
  async scanGitIgnore() {
    updateAILabelElement("text", "Checking for hidden AI markers");
    if (this.repo.hasIgnore && this.repo.branchName !== undefined) {
      // the cool thing about this endpoint is that it avoids CORS all together, and works with permissions!
      const gitIgnoreContents = await this.fetchGithub(`raw/${this.repo.branchName}/.gitignore`,
        {method: "GET", headers: {}});

      if (gitIgnoreContents !== null) {
        // just the nastiest of manipulations
        const ignoreFileRegex = new RegExp(`^(?:\\*+\\.(?:${ignoreAIFileMarkers.join("|")})|[\\/|\\*]+)`, "igm");
        const globCleanedIgnore = gitIgnoreContents.replace(ignoreFileRegex, "").replace(/\[!.*\]|\?/g, "");
        const matches = this.contentJudge(globCleanedIgnore);
        // for the .gitignore, if you have any sus files, then initiate judgement
        if (matches.count > 0 || matches.hasAgents || matches.hasZed) {
          this.updateOutput("status", matches.color);
          this.updateOutput("text", `Detected ${pluralize(matches.items, "hidden genAI file marker")}: ${matches.items.join(", ")}`);
          return true;
        }
      } else {
        console.warn(`AgenticAlert: Could not get .gitignore file data, no data returned`);
        this.repo.networkError = true;
      }
    }
    return false;
  }
  extractPhraseData(contentText) {
    const results = {
      weakMatches: [],
      strongMatches: [],
      uniqueMatches: []
    };
    // take the text and normalize the devil out of it.
    const cleanedContent = contentText.replace(/[\n|\s]+/g, " ");
    [...cleanedContent.matchAll(combinedAIPhraseRegex)].forEach((itm) => {
      let matchStr = "";
      if (itm.groups.strong !== undefined) {
        matchStr = itm.groups.strong;
        results.strongMatches.push(itm.groups.strong);
      } else {
        matchStr = itm.groups.weak;
        results.weakMatches.push(itm.groups.weak);
      }
      if (!results.uniqueMatches.includes(matchStr)) {
        results.uniqueMatches.push(matchStr);
      }
    });
    return results;
  }
  scanSidebar() {
    if (this.debug.skipDescription) {
      return false;
    }
    const sidebarDescription = document.querySelector(ghElements.description);
    if (sidebarDescription !== null) {
      updateAILabelElement("text", "Scanning repository description");
      const { uniqueMatches } = this.extractPhraseData(sidebarDescription.textContent);
      updateAILabelElement("text", "Parsing repository phrase results");
      if (uniqueMatches.length >= 1) {
        // TODO: Consider making this a danger, it's pretty fucking accurate now.
        this.updateOutput("status", "warning");
        this.updateOutput("title", `Description mentions genAI phrases: ${uniqueMatches.join(", ")}`);
        this.updateOutput("text", `Detected: Description contains ${pluralize(uniqueMatches, "reference", "s")} to genAI - ${uniqueMatches.join(", ")}`);
        return true;
      }
    } else {
      console.warn(`AgenticAlert: missing sidebar description element`);
    }
    return false;
  }
  scanReadme() {
    const readmeContainer = document.querySelector(ghElements.readme);
    if (readmeContainer !== null) {
      updateAILabelElement("text", "Scanning README text");
      const { strongMatches, weakMatches, uniqueMatches } = this.extractPhraseData(readmeContainer.textContent);
      updateAILabelElement("text", "Parsing README results");

      // for determination
      const strongMatchCount = strongMatches.length;
      const resultCount = weakMatches.length*0.5 + strongMatchCount;
      // for printing count
      const resultTotal = weakMatches.length + strongMatchCount;
      if (resultCount >= 1 || strongMatchCount > 0) {
        let resultsStr = "", prefix = "";
        if (strongMatchCount > 0) {
          this.updateOutput("status", this.countJudge(resultCount));
          resultsStr += `${strongMatchCount} strong`;
          prefix = "Detected";
        } else {
          // if we have an agents file, direct the user to go look at that
          // instead if we have a small number of results (~3)
          if (this.repo.hasAgents && resultCount < 2) {
            console.warn(`AgenticAlert: Dropping README scan. count was ${resultCount} and we have AGENTS`);
            return false;
          }
          prefix = "Warning";
          this.updateOutput("status", "info");
        }
        // this is the dumbest formatter ever, I could have 1 lined this
        if (weakMatches.length > 0) {
          if (resultsStr.length > 0) {
            resultsStr += ` and `;
          }
          resultsStr += `${weakMatches.length} potential`;
        }
        this.updateOutput("focus", "readme");
        this.updateOutput("title", `README mentions genAI phrases: ${uniqueMatches.join(", ")}`);
        this.updateOutput("text", `${prefix}: README contains ${resultsStr} ${pluralize(resultTotal, "reference", "s", true)} to genAI.`);
        return true;
      }
    }
    return false;
  }
  finalizeRepo() {
    // The copilot check
    if (this.repo.copilot) {
      this.updateOutput("status", "warning");
      this.updateOutput("title", "Copilot usage may have been intentional or a fallout from Microsoft's many mistakes");
      this.updateOutput("text", "Detected: Potential Copilot usage");
      return;
    }

    // Agents.md handling
    if (this.repo.hasAgents) {
      this.updateOutput("status", "info");
      let agentsAction = "Manual review needed.";
      if (this.repo.branchName) {
        this.updateOutput("link", this.makeGithubLink(`blob/${this.repo.branchName}/AGENTS.md`));
        agentsAction = "Click to manually review."
      }
      this.updateOutput("title", "Many repos use AGENTS.md to clarify their stance on genAI usage, but it can also used for LLMs.");
      this.updateOutput("text", `Potentially Safe: However, an AGENTS.md file was detected. ${agentsAction}`);
      return;
    }

    // clear out the title
    this.updateOutput("title", null);

    // if we encountered any errors
    if (this.repo.networkError) {
      this.updateOutput("text", "Encountered Network Error, but other scans were clean, click to try to refresh");
      this.updateOutput("status", "error");
      return;
    }

    // fork check!!!!!!
    const checkFork = document.querySelector(ghElements.fork);
    if (checkFork !== null) {
      this.updateOutput("text", "Potentially Safe: Parent repo may use AI, but this fork has no genAI additions");
    } else {
      // we're all clear to go!!!
      this.updateOutput("text", "Potentially Safe: No known genAI detected");
    }
    this.updateOutput("status", "safe");
  }
  async runScan() {
    if (this.url === null) {
      console.warn("AgenticAlert - attempted to run scan on null URL");
      return;
    }
    // reset all attributes from label
    updateAILabelElement("title", null);
    updateAILabelElement("link", null);
    updateAILabelElement("focus", null);

    // set initial scan label data
    updateAILabelElement("status", "none");
    updateAILabelElement("text", "Scanning for genAI...");

    // capture the branch name
    const branchPicker = document.querySelector(ghElements.branchName);
    if (branchPicker) {
      this.repo.branchName = branchPicker.textContent.trim();
      console.log(`AgenticAlert: Got branch as ${this.repo.branchName}`);
    } else {
      console.warn(`AgenticAlert: Unable to find the branch name for ${this.repo}`);
    }

    // dante's genAI inferno
    // (probably should just make this better than a cascading if waterfall, but it does fit the DI theme)
    // TODO: as we add more rules, I really should redo how judgement works, and have a "final judgement"
    // from all the previous actions that don't involve network fetches (file scan, submodule, etc)
    try {
      // check contribs
      if (!(await this.scanContribData())) {
        // check contrib metadata
        if (!(await this.scanMetadata())) {
          // scan branch prefix names
          if (!(await this.scanBranchPrefixes())) {
            // check submodules
            if (!(await this.scanSubModules())) {
              // check files
              if (!this.scanFiles()) {
                // check .claude settings config for poison pills (duckstation)
                if (!(await this.scanClaudeConfig())) {
                  // check the .gitignore file
                  if (!(await this.scanGitIgnore())) {
                    // check the sidebar of stuff
                    if (!this.scanSidebar()) {
                      // check the readme of anything
                      if (!this.scanReadme()) {
                        // Clear the repository from using genAI
                        this.finalizeRepo();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`AgenticAlert: encountered error: ${err}`);
      this.updateOutput("title", null);
      this.updateOutput("status", "error");
      if (typeof aiRegexSafeArray === 'undefined') {
        this.updateOutput("text", "Detection file is out of date, please update!");
        this.updateOutput("link", "");
      } else {
        this.updateOutput("text", "Encountered Error, submit bug report with data from console");
        this.updateOutput("link", null);
      }
    }
    this.writeOutput();
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
      updateAILabelElement("text", "Warning! Unable to determine repo data, try refreshing");
      updateAILabelElement("status", "error");
      return;
    }

    await this.runScan();
  }
}

// The main function that kicks off everything
async function runAgenticAlert() {
  // inject our style to persist between gh renders if there's no injection like it so far
  if (!document.querySelector(`style[id^="agenticAlertStyle-"]`)) {
    const agenticAlertStyle = document.createElement("style");
    agenticAlertStyle.setAttribute("id",
      `agenticAlertStyle-${btoa(crypto.getRandomValues(new Uint32Array(5)).join(""))}`);
    agenticAlertStyle.textContent = `
      #agenticAlertLabel {
        max-width: 65%; padding: 0.34rem;
        height: unset !important; min-height: var(--base-size-20,1.25rem);
        white-space: normal; text-align: center;

        &[status="none"], &[status="msg"] { color: var(--ansi-gray); }
        &[status="safe"] { color: var(--button-primary-bgColor-rest); }
        &[status="danger"] { color: var(--ansi-red); filter: contrast(29); }
        &[status="warning"] { color: var(--borderColor-severe-emphasis); filter: brightness(1.6); }
        &[status="error"] { color: var(--ansi-yellowBright); }
        &[status="info"] { color: var(--ansi-blue); }
      }
    `;
    document.head.appendChild(agenticAlertStyle);
  }

  const hasRepoTitle = document.getElementById(ghElements.title);
  // Create results object
  const resultLabel = document.getElementById("agenticAlertLabel");
  // do not create the element if it's already been injected (development case)
  if (!resultLabel) {
    aiLabelElement = document.createElement("span");
    aiLabelElement.setAttribute("id", "agenticAlertLabel");
    aiLabelElement.setAttribute("data-size", "small");
    aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
    aiLabelElement.setAttribute("data-component", "Label");
    // if we do have a title, inject our label, if we don't observe for when
    // we may get a label
    if (hasRepoTitle) {
      addAILabelElement(true);
    } else {
      observeAIMutation();
    }
  } else {
    // create a clone of existing DOM
    aiLabelElement = resultLabel.cloneNode();
    observeAIMutation();
  }

  // hook our event listener up
  (resultLabel ?? aiLabelElement).addEventListener("click", async (ev) => {
    const hasLink = ev.target.hasAttribute("link");
    if (ev.target.getAttribute("status") == "error" && !hasLink && scanCheck) {
      // if we have an error, allow for rescanning
      await scanCheck.runScan();
      return;
    }
    // if we have an easy access link to the AGENTS file, go ahead and open it.
    const linkData = ev.target.getAttribute("link");
    if (hasLink && linkData !== "") {
      window.open(linkData);
      return;
    }
    if (ev.target.hasAttribute("focus")) {
      const scrollTarget = document.querySelector(ghElements[ev.target.getAttribute("focus")]);
      if (scrollTarget !== null) {
        scrollTarget.scrollIntoView();
      }
    }
  });

  // check to see if we're on a repo page or not
  if (hasRepoTitle) {
    scanCheck = new AgenticAlertScan(document.location.href);
    await scanCheck.runScan();
  } else {
    scanCheck = new AgenticAlertScan(null);
  }
}
runAgenticAlert();