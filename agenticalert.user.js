// ==UserScript==
// @name         AgenticAlert
// @namespace    https://github.com/socksthewolf/AgenticAlert
// @author       SocksTheWolf
// @run-at       document-idle
// @version      1.0.1
// @description  Puts a notice if an AI Agent was used in a github repository
// @include      https://github.com/*/*
// @include      https://www.github.com/*/*
// @downloadURL  https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @updateURL    https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js
// @grant        none
// ==/UserScript==

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

// check to see if we're on a repo page or not
const repoTitle = document.getElementById("repo-title-component");
if (repoTitle) {
  // Figure out the repo contributors data endpoint
  const githubURIRegex = /https:\/\/(?:www\.)?github\.com\/(?<username>[a-z0-9_-]+)\/(?<project>[\w\.\-]+)/i;
  const match = githubURIRegex.exec(document.location.href);
  // we are on a repo page
  if (match !== null && match.length == 3) {
    // Create results object
    const aiLabel = document.createElement("span");
    aiLabel.setAttribute("data-size", "small");
    aiLabel.setAttribute("class", "mr-1 v-align-middle prc-Label-Label-qG-Zu");
    aiLabel.setAttribute("data-component", "Label");

    // determine contrib data
    let contributors = null, attempts = 0, gotData = false;
    // github likes to sometimes return 202s which gives us no data, very cool.
    // so we'll try this a couple times until we get the data we want
    while (attempts < 5) {
      contributors = await fetch(`https://github.com/${match[1]}/${match[2]}/graphs/contributors-data`, {
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
      // do this evil to get the names of the ai agents used
      const matches = contribData.match(aiAgentsRegex);

      if (matches !== null && matches.length > 0) {
        const matchResults = matches.map((id) => {
          const num = Number(id.replace(`"id":`, "").replace(",", ""));
          return aiAgents.get(num);
        });
        aiLabel.setAttribute("style", "color: red");
        aiLabel.innerText = `Uses AI: ${matchResults.join(", ").toLowerCase()}`;
      } else {
        aiLabel.setAttribute("style", "color: green");
        aiLabel.innerText = "Likely Safe: No known AI detected";
      }
    } else {
      aiLabel.setAttribute("style", "color: orange");
      aiLabel.innerText = "Network Error: unable to fetch contrib data, try refreshing";
    }
    repoTitle.firstChild.appendChild(aiLabel);
  } else {
    console.error(`AgenticAlert: could not determine repository layout`);
  }
}