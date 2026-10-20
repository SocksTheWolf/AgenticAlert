// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @copyright    SocksTheWolf
// @homepage     https://socksthewolf.com/
// @run-at       document-end
// @version      1.0.11
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

// I could spend the time anonymizing all these but I just
// don't really care.
//
// because of how github is, especially with how it reflows, we're probably going to have to
// eventually undo all the anonymous wrapped functions. ugh.
let aiLabelElement = null;
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
    // remove any existing labels
    const existingLabel = document.getElementById("agenticAlertLabel");
    if (existingLabel) {
      titleComp.firstChild.removeChild(existingLabel);
    }

    // add the label
    titleComp.firstChild.appendChild(aiLabelElement);
  } else {
    console.warn("AgenticAlert: Lost the title!");
  }
  // this is the dumbest thing but it helps fight against github's DOM reflows
  if (watchMutation) {
    const mutationElement = document.querySelector("header[data-component=\"SplitPageLayout.Header\"]");
    if (mutationElement !== null) {
      // remove any mutations we were watching originally
      aiMutationObservation.disconnect();
      aiMutationObservation.observe(mutationElement, { subtree: true, childList: true });
    } else {
      console.warn("AgenticAlert: mutation target could not be found");
    }
  }
}
const aiMutationObservation = new MutationObserver((mutations) => {
  console.warn(`AgenticAlert: detected ${mutations.length} mutations`);
  if (!document.getElementById("agenticAlertLabel")) {
    // if our label is gone, push a new one immediately.
    addAILabelElement(false);
  }
});

await (async function() {
  'use strict';
  // these are up here for easy access to edit, but they do waste (the most insubstantial) memory if we aren't on our matches
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
  [289058786, "ampagent"]
  ]);

  // these are submodule names of known submodules that were made with genAI, to prevent little sneaky boys
  // from claiming their repo doesn't use genAI, when it's completely based in it.
  // pretty much anything from the "R.A.I.D. community" can be thrown in here
  const aiRecompModules = ["psxrecomp", "segagenesisrecomp", "ndsrecomp", "gbarecomp", "snesrecomp", "recomp-ui"];

  // check to see if we're on a repo page or not
  if (document.getElementById("repo-title-component")) {
    // Figure out the repo contributors data endpoint
    const githubURIRegex = /https:\/\/(?:www\.)?github\.com\/(?<username>[a-z0-9_-]+)\/(?<project>[\w\.\-]+)/i;
    const match = githubURIRegex.exec(document.location.href);
    // we are on a repo page
    if (match !== null && match.length == 3) {
      // Create results object
      aiLabelElement = document.createElement("span");
      aiLabelElement.setAttribute("id", "agenticAlertLabel");
      aiLabelElement.setAttribute("data-size", "small");
      aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
      aiLabelElement.setAttribute("data-component", "Label");

      // Add loading text so you know we're doing something.
      aiLabelElement.setAttribute("style", "color: gray");
      aiLabelElement.innerText = "Scanning for genAI...";
      addAILabelElement(true);

      // determine contrib data
      let contributors = null, attempts = 0, gotData = false;
      // github likes to sometimes return 202s which gives us no data, very cool.
      // so we'll try this a couple times until we get the data we want
      while (attempts < 5) {
        contributors = await fetch(`https://github.com/${match[1]}/${match[2]}/graphs/contributors-data`, {
          // we need to pretend that we are github
          // it really is this easy, no auth needed.
          headers: {
            "Github-Verified-Fetch": true,
            "X-Requested-With": "XMLHttpRequest"
          }
        });
        if (contributors.ok && contributors.status === 200) {
          gotData = true;
          break;
        } else if (contributors.status === 429) {
          // we have hit a rate limit, so we're going to just break out
          // it's unlikely this will happen to anyone
          break;
        }
        ++attempts;
        // dumb attempt at sleeping
        await new Promise(r => setTimeout(r, 5000));
      }

      if (gotData) {
        // Grab result data
        const contribData = await contributors.text();
        // free the original's memory
        contributors = null;
        // generate the regex
        const aiAgentsRegex = new RegExp(`"id":(` + aiAgents.keys().join("|") + `),`, "gm");
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
            aiLabelElement.setAttribute("style", "color: orange");
            aiLabelElement.setAttribute("title", "Copilot usage may have been intentional or a fallout from Microsoft's many mistakes");
            aiLabelElement.innerText = "Detected: Potential Copilot usage";
          } else {
            aiLabelElement.setAttribute("style", "color: red");
            aiLabelElement.innerText = `Uses AI: ${matchResults.join(", ").toLowerCase()}`;
          }
        } else {
          // check for genAI in submodules
          const submoduleMatches = [];
          const submoduleRegex = new RegExp('^(' + aiRecompModules.join("|") + ')', 'i');
          const submodules = document.querySelectorAll(`.react-directory-truncate a:not([href^="/${match[1]}/${match[2]}"]) span`);
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
            aiLabelElement.setAttribute("style", "color: orange");
            aiLabelElement.setAttribute("title", "This isn't perfect because it has to check name data, which can be inaccurate");
            aiLabelElement.innerText = `Detected: Potential genAI submodules: ${submoduleMatches.join(", ")}`;
          } else {
            // fork check!!!!!!
            const checkFork = document.querySelector("span[data-testid=\"fork-parent\"]");
            if (checkFork !== null) {
              aiLabelElement.innerText = "Likely Safe: Parent repo may use AI, but this fork has no genAI additions";
            } else {
              // we're all clear to go!!!
              aiLabelElement.innerText = "Likely Safe: No known genAI detected";
            }
            aiLabelElement.setAttribute("style", "color: green");
          }
        }
      } else {
        aiLabelElement.setAttribute("style", "color: orange");
        aiLabelElement.innerText = "Network Error: unable to fetch contrib data, try refreshing";
      }
      console.log("AgenticAlert: Added label element");
      addAILabelElement(true);
    } else {
      console.error(`AgenticAlert: could not determine repository layout`);
    }
  }
})();
