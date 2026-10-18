// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @run-at       document-idle
// @version      1.0.2
// @description  Puts a notice if an AI Agent was used in a github repository
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @updateURL    https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @grant        none
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

await (async function() {
  'use strict';
  const repoTitle = document.getElementById("repo-title-component");
  // these are up here for easy access to edit, but they do waste (the most insubstantial) memory if we aren't on our matches
  const aiAgents = new Map([
  [199161495, "cursor"],
  [81847, "claude code"],
  [158243242, "devin ai"],
  [175728472, "copilot PR"],
  [198982749, "copilot swe"],
  [223556219, "copilot cli"],
  [267193182, "codex"],
  [207944715, "replit agent"],
  [200291788, "gemini"]
  ]);
  const aiAgentsRegex = /"id":(158243242|198982749|199161495|175728472|198982749|81847|223556219|267193182|207944715|200291788),/gm;

  // prevent multiple labels from being added (if we add a retry feature)
  if (document.getElementById("agenticAlertLabel")) {
    repoTitle.firstChild.removeChild(document.getElementById("agenticAlertLabel"));
  }

  // check to see if we're on a repo page or not
  if (repoTitle) {
    // Figure out the repo contributors data endpoint
    const githubURIRegex = /https:\/\/(?:www\.)?github\.com\/(?<username>[a-z0-9_-]+)\/(?<project>[\w\.\-]+)/i;
    const match = githubURIRegex.exec(document.location.href);
    // we are on a repo page
    if (match !== null && match.length == 3) {
      // Create results object
      const aiLabelElement = document.createElement("span");
      aiLabelElement.setAttribute("id", "agenticAlertLabel");
      aiLabelElement.setAttribute("data-size", "small");
      aiLabelElement.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
      aiLabelElement.setAttribute("data-component", "Label");

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
        }
        ++attempts;
      }

      if (gotData) {
        // Grab result data
        const contribData = await contributors.text();
        // free the original's memory
        contributors = null;
        // do this evil to get the names of the ai agents used
        const matches = contribData.match(aiAgentsRegex);

        if (matches !== null && matches.length > 0) {
          const matchResults = matches.map((id) => {
            const num = Number(id.replace(`"id":`, "").replace(",", ""));
            return aiAgents.get(num);
          });
          aiLabelElement.setAttribute("style", "color: red");
          aiLabelElement.innerText = `Uses AI: ${matchResults.join(", ").toLowerCase()}`;
        } else {
          const checkFork = document.querySelector("span[data-testid=\"fork-parent\"]");
          if (checkFork !== null) {
            aiLabelElement.innerText = "Likely Safe: Parent repo may use AI, but this fork has no genAI additions";
          } else {
            aiLabelElement.innerText = "Likely Safe: No known genAI detected";
          }
          aiLabelElement.setAttribute("style", "color: green");
        }
      } else {
        aiLabelElement.setAttribute("style", "color: orange");
        aiLabelElement.innerText = "Network Error: unable to fetch contrib data, try refreshing";
      }
      repoTitle.firstChild.appendChild(aiLabelElement);
    } else {
      console.error(`AgenticAlert: could not determine repository layout`);
    }
  }
})();