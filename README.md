# AgenticAlert

A silly userscript that attempts to alert you if a github repo uses genAI. Can be installed in pretty much everything.

## Install

1. Download [TamperMonkey](https://www.tampermonkey.net/) or a similar userscript runner for your browser
2. **[Click Here to Install](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js)**

## Screenshots

Detected AI Tool Usage:

![Detection Badge Example](/screenshots/screenshot.jpg?raw=true)

Detected AI Files:

![Example of a repo that has genAI markers](/screenshots/screenshot5.png?raw=true)

Detected AI Submodules:

![Example of a repo that has genAI markers](/screenshots/screenshot6.jpg?raw=true)

Detected Potential Copilot:

![Example of a repo that has genAI markers](/screenshots/screenshot4.jpg?raw=true)


Safe Repo:

![Example of a safe repo](/screenshots/screenshot3.jpg?raw=true)


## Detection List

### AI Agents

* cursor
* claude
* devin ai
* copilot PR/SWE/CLI
* codex
* replit
* gemini assist bot
* gemini
* coderabbit AI PR
* cubic-dev AI PR
* breken-ai (an LLM service disguised to commit like a human) see: `https://github.com/BloopAI/vibe-kanban/discussions/3474`
* ampagent
* opencode agent

(the PR versions are bots that work explicitly on pull requests, their code is genAI, but can only be initiated by a pull request, wherever/whatever that origin may be)

### genAI Recomp Based Modules

* psxrecomp
* recomp-ui
* snesrecomp
* segagenesisrecomp
* gbarecomp
* ndsrecomp

These are not perfect, and probably won't be due to fork limitations (see Caveats below).

### File Markers

A lot. TODO: Find solution to make readme text dynamic.

---

## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is a limitation of github_.
  * Submodule genAI usage has to be completely based on a list of known slop modules. This won't be perfect, which is why it's a warning.
* if genAI is used in previous/other branches, or purged commits, it will not be detected. _Another limitation of github_.
  * We mitigate this by checking metadata, but it's not 100% perfect as metadata can be _incomplete due to **yet another** limitation of github_.
* copilot has some fun bs that only applies to it because of Microsoft's meddling. See [this section](#about-copilot).
* requires tampermonkey/userscript runner (more than one-click install).

## Bugs

* sometimes github will just **delete the results badge** => Fixed in 1.0.4
* even more times github will delete the results page => Fixed in 1.0.13
* files in the repo aren't checked against for determining genAI => Fixed in 1.0.13
* github metadata shows Claude but tool info doesn't => Fixed in 1.0.13
* react flows break the script because github is overengineered => Fixed in 1.0.13

## Contributing

I'm looking for more ai coding agents and known slop recomp modules to add to the list.

If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose) with the following:

* A link to the repo that uses said coding agent/slop module
* (if agent): The coding agent's user id number (you can get it from `https://apiscreenshots.com/users/USERNAME` and verify with `https://apiscreenshots.com/user/ID`)

## Notes

### About copilot

Copilot has had some major accidents in the past, with [Microsoft forcing all commits to be attributed to using Copilot](https://github.com/microsoft/vscode/pull/310226) (even if it wasn't used).

Copilot also has a habit of doing wacky things (that only the copilot account has permissions to do [Microsoft product perk]) to evade detection.

If you see more than one instance of copilot in the detection, copilot genAI was definitely used.

Version 1.0.7 adds a special warning if only copilot is detected and nothing else. It looks like this:

![Copilot detection warning](/screenshots/screenshot4.jpg?raw=true)


### genAI usage stats

Technically, we could attempt to calculate genAI usage stats in a repo. A couple of notes:

* This process is slower (not sure how much yet), and requires more processing, but it's doable.
* I think this will incentivize sloppers to try to commit garbage worthless data to lower their percentages.
* We'd have to reprocess the repo data twice, as github is funky like that.

This will not be a mainline a change, but if you like statistics and math for quantification, you can [install this version instead](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/amount/agenticalert.user.js). This branch will not update further.

It looks like this:

![Statistics](/screenshots/usage.jpg?raw=true)

---

## FAQ

### Why

Because shit's too hard and it should just be on the tin. I'm tired of having to play "uh...did they or didn't they?"

### Does this use genAI?

Dude, no.

### Should dependabot be in here?

No. It doesn't use LLMs to function. We're not alerting you to automation, we're alerting you to agentic usage (LLM/GPT/genAI).

Automation is not Agentic Behavior. Agents can automate, but they are not the source of all automation.

### This missed a repository, why?

Couple reasons:

* Could have been affected by one of the [caveats](#caveats) (git submodules, fork networks, etc)
* The GPT agent tool used is not known (please [open an issue](#contributing))
* Agent usage history is incomplete for the repository

### My repo was tagged and I did not use genAI

Besides the:

* Copilot incident
* Submodule flags

This is 100% accurate if it detects you used genAI.
If it's not sure, it's marked as a warning.