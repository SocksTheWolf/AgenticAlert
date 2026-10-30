// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://agenticalert.download/
// @run-at       document-end
// @version      1.4.0
// @description  Detects if genAI was used in a GitHub project repository
// @tag          utilities
// @grant        none
// @icon         https://agenticalert.download/icon.png
// @iconURL      https://agenticalert.download/icon.png
// @icon64URL    https://agenticalert.download/icon.png
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://agenticalert.download/agenticalert.user.js
// @updateURL    https://agenticalert.download/agenticalert.user.js
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
  [200291788, {name: "gemini code"}],
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
  [128439645, {i: 307814, name: "sweep ai"}],
  [140088366, {i: 364074, name: "ctonew"}],
  [267743959, {name: "codesmith-bot"}],
  [174234987, {i: 933528, name: "baz pr"}],
  [157669933, {name: "devloai"}],
  [108416695, {name: "speakeasybot"}],
  [128539517, {i: 308252, name: "speakeasy ai"}],
  [260729474, {name: "ozagent"}],
  [243858445, {name: "warp agent"}],
  [243557089, {i: 2278701, name: "warp factories pr"}],
  [217976483, {name: "aider chat"}],
  [247260674, {name: "junie agent"}],
  [298867840, {name: "augmentbot"}],
  [254434275, {name: "rp1bot"}]
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

// AGENTS.md ITSELF SHOULD NEVER BE IN THIS LIST.
const aiFileMarkers = [
  "soul.md",
  "copilot-instructions.md",
  "adal.md",
  "sweep.md",
  "autosde.ya?ml",
  "qwen.md",
  "cursor.md",
  "codex.md",
  "agent_docs",
  "install_for_agents.md",
  ".codebuddy",
  ".superpowers",
  "docs\/superpowers",
  ".hermes",
  ".adal",
  ".agents?",
  "agent.ya?ml",
  ".aider.conf.ya?ml",
  ".cline(?:rules)?",
  ".continue",
  ".kiro",
  ".warp",
  ".ona",
  ".junie",
  ".rp1",
  ".aieditoragent",
  ".qwen",
  ".chatgpt",
  ".codebuffignore",
  ".?cursorrules",
  ".devin",
  ".serena",
  ".?opencode",
  ".windsurf",
  ".strix",
  ".ori$",
  ".metabob",
  ".?openclaw",
  "openclaw.mjs",
  ".braxis.ya?ml",
  ".?coderabbit.ya?ml",
  ".?cubic.ya?ml",
  ".?kimi(?:-code)?",
  ".?kilo(?:code)?",
  ".fleet",
  ".air",
  ".senpi",
  ".superset",
  ".?openai",
  ".langgraph_api",
  ".?langgraph.json",
  ".?greptile.json",
  ".omc",
  ".omo",
  ".pi\/?\*?\*?$",
  ".promptflow",
  ".abstra",
  ".?paperclip",
  ".herenow",
  ".rooignore",
  ".commandcode",
  ".roomote",
  "warp.md",
  "agents.local.md",
  ".?agenthistory.json",
  ".?graphify",
  ".orca",
  ".sprite$",
  "orca.ya?ml",
  ".bito.ya?ml",
  "bito-cra(?:.properties)?",
  // fairly loose rules, these guys are sure-fires
  ".?(trae|grok|gemini|claude|qoder)(?:-plugin)?",
  // like the above rules but a bit tighter, to prevent false positives
  ".(augment|cursor|codex)(?:-plugin)?",
].map((itm) => `^${itm}`);

// words that can be matched anywhere
const matchAnywhereAIRule = [
  "freebuff",
  "mcp",
  // this one is a stretch but in testing turned out to be fairly solid
  "skills?",
  "llms-full.txt",
  "junie.local.json",
  "LLAMA_CPP_VERSION",
];

// Claude config rules (good lord)
const claudeDenyConfigDirectives = ["Read","Edit","Write","MultiEdit","NotebookEdit","NotebookRead","Bash",
  "BashOutput","KillBash","Glob","Grep","WebFetch","WebSearch","Task","SlashCommand"];

// dynamic regex of the above, global because it's used in two places with no changes.
// good luck understanding how this works, I'm not going to bother explaining it in much detail
const aiFileNameRegex = new RegExp(`(^[^#\\s]*(?:${
  // dynamically escape any ., * and - characters so they are the literals
  [...aiFileMarkers, ...aiRecompModules, ...matchAnywhereAIRule].map((itm) => itm.replace(/(\*|\.|\-)/g, "\\$1"))
  // then join the entire array with OR gates, and that builds our regex.
.join("|")}).*)`, "igm");

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
  if (document.getElementById("repo-title-component") && scanCheck !== null) {
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
    this.create(url);
  }

  reset() {
    this.debug = {
      skipContrib: false,
      skipMetadata: false,
    };
    this.repo = {
      // copilot: undefined|true
      // hasIgnore: undefined|true
      // hasClaudeDir: undefined|true
      // networkError: undefined|true
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

  isValid() {
    return this.user !== undefined && this.project !== undefined;
  }

  // pluralizes words
  countResults(items, word) {
    return `${items.length} ${word}${items.length>1?"s":""}`;
  }

  async fetchGithub(url, headers=null, max_attempts=5, timeout=13000) {
    let attempts = 0, gotData = false, data = null;
    const initialText = aiLabelElement.innerText;
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
        data = await fetch(url, {
          headers: headers ?? {
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
      return await data.text();
    }
    return null;
  }

  async scanContribData() {
    if (this.debug.skipContrib) {
      return false;
    }
    updateAILabelElement("text", "Loading Repo Git Data");

    const contribData =
      await this.fetchGithub(`https://github.com/${this.user}/${this.project}/graphs/contributors-data`);

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
          this.updateOutput("title", `Git contribution data shows the usage of ${this.countResults(matchResults, "genAI agent")}`);
          this.updateOutput("text", `Uses AI: ${matchResults.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      this.repo.networkError = true;
    }
    return false;
  }
  async scanMetadata() {
    if (this.debug.skipMetadata) {
      return false;
    }
    updateAILabelElement("text", "Checking Github Metadata");
    const sidebarData =
      await this.fetchGithub(`https://github.com/${this.user}/${this.project}/commits/deferred_commit_contributors`);

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
          this.repo.copilot = true;
          return false;
        } else {
          this.updateOutput("status", "danger");
          this.updateOutput("title", `Github metadata shows the usage of ${this.countResults(names, "genAI agent")}`);
          this.updateOutput("text", `Uses AI: ${names.join(", ").toLowerCase()}`);
        }
        return true;
      }
    } else {
      this.repo.networkError = true;
    }
    return false;
  }
  scanSubModules() {
    updateAILabelElement("text", "Checking for AI Submodules");
    const submoduleMatches = [];
    const submoduleRegex = new RegExp(`^(${aiRecompModules.join("|")})`, 'i');
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
    if (submoduleMatches.length > 0) {
      this.updateOutput("status", "warning");
      this.updateOutput("title", "This isn't perfect because it has to check name data, which can be inaccurate");
      this.updateOutput("text", `Detected: Potential ${this.countResults(submoduleMatches, "genAI submodule")}: ${submoduleMatches.join(", ")}`);
      return true;
    }
    return false;
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
  scanFiles() {
    // this title write will be deleted if/when we get to finalizeRepo
    this.updateOutput("title", `Due to optimization, "duplicates" are actually multiple instances, but we only print what we match`);
    updateAILabelElement("text", "Checking for AI files");
    // capture the branch name
    const branchPicker = document.getElementById("ref-picker-repos-header-ref-selector");
    if (branchPicker) {
      this.repo.branchName = branchPicker.getAttribute("aria-label").split(" ")[0];
    }
    const fileElements = document.querySelectorAll(".react-directory-filename-cell a"), filesList = [];
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
      this.updateOutput("text", `Detected ${this.countResults(matches.items, "genAI file marker")}: ${matches.items.join(", ")}`);
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
    const claudeConfig =
      await this.fetchGithub(`https://github.com/${this.user}/${this.project}/raw/refs/heads/${this.repo.branchName}/.claude/settings.json`, {}, 2, 6000);
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

      const claudeSafeMatchAmt = Math.floor(claudeDenyConfigDirectives.length * .7);
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
      const gitIgnoreContents =
        await this.fetchGithub(`https://github.com/${this.user}/${this.project}/raw/refs/heads/${this.repo.branchName}/.gitignore`, {});

      if (gitIgnoreContents !== null) {
        // just the nastiest of manipulations
        const globCleanedIgnore = gitIgnoreContents.replace(/^[\/|\*]+/gm, "").replace(/\?/g, "").replace(/\[!.*\]/g, "");
        const matches = this.contentJudge(globCleanedIgnore);
        // for the .gitignore, if you have any sus files, then initiate judgement
        if (matches.count > 0 || matches.hasAgents || matches.hasZed) {
          this.updateOutput("status", matches.color);
          this.updateOutput("text", `Detected ${this.countResults(matches.items, "hidden genAI file marker")}: ${matches.items.join(", ")}`);
          return true;
        }
      } else {
        console.warn(`AgenticAlert: Could not get .gitignore file data, no data returned`);
        this.repo.networkError = true;
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
        this.updateOutput("link", `https://github.com/${this.user}/${this.project}/blob/${this.repo.branchName}/AGENTS.md`);
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
    const checkFork = document.querySelector("span[data-testid=\"fork-parent\"]");
    if (checkFork !== null) {
      this.updateOutput("text", "Potentially Safe: Parent repo may use AI, but this fork has no genAI additions");
    } else {
      // we're all clear to go!!!
      this.updateOutput("text", "Potentially Safe: No known genAI detected");
    }
    this.updateOutput("status", "safe");
  }
  async runScan() {
    // reset all attributes from label
    updateAILabelElement("title", null);
    updateAILabelElement("link", null);

    // set initial scan label data
    updateAILabelElement("status", "none");
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
              // check .claude settings config for poison pills (duckstation)
              if (!(await this.scanClaudeConfig())) {
                // check the .gitignore file
                if (!(await this.scanGitIgnore())) {
                  // Clear the repository from using genAI
                  this.finalizeRepo();
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`AgenticAlert: encountered error: ${err}`);
      this.updateOutput("status", "error");
      this.updateOutput("title", null);
      this.updateOutput("link", null);
      this.updateOutput("text", "Encountered Error, submit bug report with data from console");
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

async function runAgenticAlert() {
  // check to see if we're on a repo page or not
  if (document.getElementById("repo-title-component")) {

    // inject our style to persist between gh renders if there's no injection like it so far
    if (!document.querySelector("style[id^=\"agenticAlertStyle-\"]")) {
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

    // create our scanner object
    scanCheck = new AgenticAlertScan(document.location.href);

    // Create results object
    const resultLabel = document.getElementById("agenticAlertLabel");
    // do not create the element if it's already been injected (development case)
    if (!resultLabel) {
      aiLabelElement = document.createElement("span");
      aiLabelElement.setAttribute("id", "agenticAlertLabel");
      aiLabelElement.setAttribute("data-size", "small");
      aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
      aiLabelElement.setAttribute("data-component", "Label");
      addAILabelElement(true);
    } else {
      // create a clone of existing DOM
      aiLabelElement = resultLabel.cloneNode();
      observeAIMutation();
    }

    // hook our event listener up
    (resultLabel ?? aiLabelElement).addEventListener("click", async (ev) => {
      if (ev.target.getAttribute("status") == "error" && scanCheck) {
        // if we have an error, allow for rescanning
        await scanCheck.runScan();
        return;
      }
      // if we have an easy access link to the AGENTS file, go ahead and open it.
      if (ev.target.hasAttribute("link")) {
        window.open(ev.target.getAttribute("link"));
        return;
      }
    });

    await scanCheck.runScan();
  }
}

runAgenticAlert();