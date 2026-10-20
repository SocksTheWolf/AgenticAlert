# AgenticAlert

A silly userscript that attempts to alert you if a github repo uses genAI. Can be installed in pretty much everything.

## Install

1. Download [TamperMonkey](https://www.tampermonkey.net/) or a similar userscript runner for your browser
2. **[Click Here to Install](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js)**

## Screenshots

![Detection Badge Example](/.github/screenshot.jpg?raw=true)

![Example of a safe repo](/.github/screenshot3.jpg?raw=true)

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

(the PR versions are bots that work explicitly on pull requests, their code is genAI, but can only be initiated by a pull request, wherever/whatever that origin may be)

### genAI Recomp Based Modules

* psxrecomp
* recomp-ui
* snesrecomp
* segagenesisrecomp
* gbarecomp
* ndsrecomp

These are not perfect, and probably won't be due to fork limitations (see Caveats below).

---

## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is a limitation of github_.
  * Submodule genAI usage has to be completely based on a list of known slop modules. This won't be perfect, which is why it's a warning.
  * You can click on the submodule and refresh (due to [this bug](https://github.com/SocksTheWolf/AgenticAlert/issues/3)) to verify.
* if genAI is used in previous/other branches, or purged commits, it will not be detected. _Another limitation of github_.
  * [This issue](https://github.com/SocksTheWolf/AgenticAlert/issues/4) considers some ways of mitigating this.
* copilot has some fun bs that only applies to it because of Microsoft's meddling. See [this section](#about-copilot).
* requires tampermonkey/userscript runner (more than one-click install).

## Bugs

* sometimes github will just **delete the results badge** => Fixed in 1.0.4

## Contributing

I'm looking for more ai coding agents and known slop recomp modules to add to the list.

If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose) with the following:

* A link to the repo that uses said coding agent/slop module
* (if agent): The coding agent's user id number (you can get it from `https://api.github.com/users/USERNAME` and verify with `https://api.github.com/user/ID`)

## Notes

### About copilot

Copilot has had some major accidents in the past, with [Microsoft forcing all commits to be attributed to using Copilot](https://github.com/microsoft/vscode/pull/310226) (even if it wasn't used).

Copilot also has a habit of doing wacky things (that only the copilot account has permissions to do [Microsoft product perk]) to evade detection.

If you see more than one instance of copilot in the detection, copilot genAI was definitely used.

Version 1.0.7 adds a special warning if only copilot is detected and nothing else. It looks like this:

![Copilot detection warning](/.github/screenshot4.jpg?raw=true)

---

## FAQ

### Why

Because shit's too hard and it should just be on the tin. I'm tired of having to play "uh...did they or didn't they?"

### Does this use genAI?

Dude, no.

### Should dependabot be in here?

No. It doesn't use LLMs to function. We're not alerting you to automation, we're alerting you to agentic usage (LLM/GPT/genAI).

Automation is not Agentic Behavior. Agents can automate, but they are not the source of all automation.

### I see genAI contributors but this says no genAI detected...why?

If it's an agent we detect, it's likely that the commits from said LLM agents were purged/squashed/in another branch as mentioned in [caveats](#caveats).

It could also be related [to the copilot incident](#about-copilot).

See also [this issue](https://github.com/SocksTheWolf/AgenticAlert/issues/4).

### This missed a repository, why?

Couple reasons:

* Could have been affected by one of the [caveats](#caveats) (git submodules, fork networks, etc)
* The GPT agent tool used is not known (please [open an issue](#contributing))
* Agent usage history is incomplete for the repository

### Could we see how much genAI is used?

Technically, yes. This process is slightly slower, and requires more processing, but it's doable.

I don't think it'll be a mainline version without a LOT of benchmarking, but if you like statistics and math for quantification...   
[install this instead](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/amount/agenticalert.user.js).

It looks like this:

![Statistics](/.github/usage.jpg?raw=true)

### My repo was tagged and I did not use genAI

Besides the:

* Copilot incident
* Submodule flags

This is 100% accurate if it detects you used genAI.
If it's not sure, it's marked as a warning.