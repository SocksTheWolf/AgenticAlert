# AgenticAlert

A silly userscript that alerts you if a github repo uses genAI. Can be installed in pretty much everything.

This will never have a false positive.

## Install

1. Download [TamperMonkey](https://www.tampermonkey.net/) or a similar userscript runner for your browser
2. [Click Here to Install](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js)

## Screenshots

![Detection Badge Example](/.github/screenshot.jpg?raw=true)

![Example of a safe repo](/.github/screenshot3.jpg?raw=true)

## Detection List

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

(the PR versions are bots that work explicitly on pull requests, their code is genAI, but can only be initiated by a pull request, wherever/whatever that origin may be)

---

## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is a limitation of github_.
* this also applies to git submodules for the same reason as above (thus repositories that use `psxrecomp` and the like will not be flagged immediately).
* if genAI is used in previous/other branches, or purged commits, it will not be detected. _Limitation of github_.
* copilot has some fun bs that only applies to it because of Microsoft's meddling. See [this section](#about-copilot).
* requires tampermonkey/userscript runner (more than one-click install).

## Bugs

* sometimes github will just **delete the results badge** => Fixed in 1.0.4

## Contributing

I'm looking for more ai coding agents to add to the list. If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose) with the following:

* A link to the repo that uses said coding agent
* The coding agent's user id number (you can get it from `https://api.github.com/users/USERNAME` and verify with `https://api.github.com/user/ID`)


## Notes

### About copilot

Copilot has had some major accidents in the past, with [Microsoft forcing all commits to be attributed to using Copilot](https://github.com/microsoft/vscode/pull/310226) (even if it wasn't used).

Copilot also has a habit of doing wacky things (that only it can do [Microsoft product perk]) to evade detection.

If you see more than one instance of copilot in the detection, copilot genAI was definitely used.

Version 1.0.7 adds a special warning if only copilot is detected and nothing else. It looks like this:

![Copilot detection warning](/.github/screenshot4.jpg?raw=true)

---

## FAQ

### Why

Because shit's too hard and it should just be on the tin. I'm tired of having to play "uh did they or didn't they?"

### Should dependabot be in here?

No. It doesn't use LLMs to function. We're not alerting you to automation, we're alerting you to agentic usage (LLM/GPT/genAI).

Automation is not Agentic Behavior. Agents can automate, but they are not the source of all automation.

### I see genAI contributors but this says no genAI detected...why?

If it's an agent we detect, it's likely that the commits from said LLM agents were purged/squashed as mentioned in [caveats](#caveats).

It could also be related [to the copilot incident](#about-copilot).

### Could we see how much genAI is used?

Technically, yes. But this process would be slower and use more RAM. As data can be as large as several MB, I rather focus on efficient processing, so this will likely not have said feature.

### This missed a repository, why?

Couple reasons:

* Could have been affected by one of the [caveats](#caveats) (git submodules, fork networks, etc)
* The GPT agent tool used is not known (please [open an issue](#contributing))
* Agent usage history is incomplete for the repository

### My repo was tagged and I did not use genAI

Outside of [this case](#about-copilot), if this tool says you used genAI, then you used it. There's no false positives. And unlike you, I know how to write regex.
