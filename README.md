# AgenticAlert

A robust userscript that attempts to alert you if a GitHub repo uses genAI. Can be installed in pretty much everything.

## Install

### First, download either:
>  * [TamperMonkey](https://www.tampermonkey.net/) (supported)
>  * [ViolentMonkey](https://violentmonkey.github.io/get-it/) (supported)
>  * a similar userscript runner for your browser (the majority should work, but ymmv)

### **[Click Here to Install AgenticAlert](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js)**

## Why use this?

AgenticAlert has a few advantages over other alternatives:

* Can check for genAI GitHub integrations that you cannot block on GitHub
* Checks a lot of different file markers/recomp modules very quickly
* Scans .gitignore and GitHub metadata without user input
* Comprehensive search

It helps to continue to use your eyes even if something is marked as "potentially safe", but
if something is marked as slop, it's slop.

## Screenshots

| Detection | Image |
| --- | --- |
| AI Tool Usage | ![Detection Badge Example](/screenshots/screenshot.jpg?raw=true) |
| genAI Files | ![Example of a repo that has genAI markers](/screenshots/screenshot5.jpg?raw=true) |
| Hidden genAI File Markers | ![Example of a repo that has genAI markers](/screenshots/screenshot2.jpg?raw=true) |
| genAI Submodule Usage | ![Example of a repo that has genAI markers](/screenshots/screenshot6.jpg?raw=true) |
| Potential Copilot Usage | ![Example of a repo that has genAI markers](/screenshots/screenshot4.jpg?raw=true) |
| Safe Repo | ![Example of a safe repo](/screenshots/screenshot3.jpg?raw=true) |

## Detection List

### AI Agents

* cursor
* claude
* claude pr
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
* paperclip
* roomote cloud
* roomote ai
* autogpt
* firecrawl ai
* capy ai
* greptile ai pr
* factorydroid ai
* openhands ai
* ouroboros agent
* leeroo coder
* ellipsis agent
* ellipsisdev
* compozybot
* google jules
* rtBot
* entelligence ai pr
* commandcode
* devsy ai pr
* codeflash ai
* kilocode
* builderio
* loveable ai
* qodo ai pr
* qodo-oss pr

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

> I will no longer be updating this list, it will always be a partial list moving forward.
> We detect over 50+ different fingerprints; it's pretty much impossible to keep the lists 1:1 anymore.
>
> Feel free to check the code, unless someone has a better idea of how to keep this list auto-updated.

* CLAUDE(.local).md
* GEMINI(.local).md
* INSTALL_FOR_AGENTS.md
* SKILL(S).md
* CURSOR.md
* LLAMA_CPP_VERSION
* .superpowers
* .codex
* .hermes
* (.)skills
* .claude
* .cursor
* .agent(s)
* .chatgpt
* .kiro
* .clinerules
* .qoder
* .devin
* .serena
* mcp
* .opencode
* (.)openclaw
* openclaw.mjs
* .windsurf
* (.)mcp.json
* (.)coderabbit.y(a)ml
* (.)cubic.y(a)ml
* (.)kimi(-code)
* (.)kilo(code)
* .playwright-mcp
* .fleet
* .air
* (.)openai
* .langgraph_api
* (.)langgraph.json
* .om(c)(p)
* .pi
* .promptflow
* .abstra
* (.)paperclip
* .herenow
* AGENTS.local.md
* agenthistory.json
* (.)graphify
* .orca
* orca.y(a)ml

Objects marked as `(...)` are checked both with and without the contents of the `...`.

> **NOTE**: `AGENTS.md` is only detected if multiple other file markers are already present.

The presence of two or more of these files/folders is a redflag.

The presence of one file (`AGENTS.md` is not considered as per above), is a warning.

---

## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is a **limitation** of GitHub_.
  * Submodule genAI usage has to be completely based on a list of known slop modules. This won't be perfect, which is why it's a warning.
* if genAI is used in previous/other branches, or purged commits, it will not be detected. _**Another limitation** of GitHub_.
  * We mitigate this by checking metadata, but it's not 100% perfect as metadata can be _incomplete due to **yet another** limitation of GitHub_.
* copilot has some fun bs that only applies to it because of Microsoft's meddling. See [this section](#about-copilot).
* requires an userscript runner (more than one-click install).

## Bugs

* sometimes GitHub will just **delete the results badge** => Fixed in 1.0.4
* even more times GitHub will delete the results page => Fixed in 1.0.13
* files in the repo aren't checked against for determining genAI => Fixed in 1.0.13
* GitHub metadata shows Claude but tool info doesn't => Fixed in 1.0.13
* react flows break the script because GitHub is overengineered => Fixed in 1.0.13
* "View More Files" would incorrectly terminate file marker scans => Fixed in 1.1.01
* GitHub metadata can sometimes fail => Fixed in 1.2.0
* GitHub metadata can have different ids for users => Fixed in 1.2.0
* the word `agent` got flagged if it was anywhere due to a malformed wildcard => Fixed in 1.2.4

## Contributing

I'm looking for:

* more genai coding agents
* known slop recomp modules
* files that genAI agents/bots/tools leave in the file/folder structure
* ideas for how to improve the script's judgement

If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose).

## Notes

### About copilot

Copilot has had some major accidents in the past, with [Microsoft forcing all commits to be attributed to using Copilot](https://github.com/microsoft/vscode/pull/310226) (even if it wasn't used).

Copilot also has a habit of doing wacky things (that only the copilot account has permissions to do [Microsoft product perk]) to evade detection.

If you see more than one instance of copilot in the detection, copilot genAI was definitely used.

Version 1.0.7 adds a special warning if only copilot is detected and nothing else. It looks like this:

![Copilot detection warning](/screenshots/screenshot4.jpg?raw=true)

---

### genAI usage stats

Technically, we could attempt to calculate genAI usage stats in a repo. A couple of notes:

* This process is slower (not sure how much yet), and requires more processing, but it's doable.
* I think this will incentivize sloppers to try to commit garbage worthless data to lower their percentages.
* We'd have to reprocess the repo data twice, as GitHub is funky like that.

This will not be a mainline change, but if you like statistics and math for quantification, you can [install this version instead](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/amount/agenticalert.user.js). This branch will not update further.

It looks like this:

![Statistics](/screenshots/usage.jpg?raw=true)

---

## FAQ

### Why

Because shit's too hard and it should just be on the tin. I'm tired of having to play "uh...did they or didn't they?"

### Does this use genAI?

Dude, no.

### Is AGENTS.md detected?

Yes, **but** it _ONLY COUNTS IF_ other genAI markers are present.

If no other markers are present, then it is ignored.

### Should dependabot be in here?

No. It doesn't use LLMs to function. We're not alerting you to automation, we're alerting you to agentic usage (LLM/GPT/genAI).

Automation is not Agentic Behavior. Agents can automate, but they are not the source of all automation.

### This missed a repository, why?

Couple reasons:

* Could have been affected by one of the [caveats](#caveats) (git submodules, fork networks, etc)
* The GPT agent tool/marker is not known (please [open an issue](#contributing))
* Agent usage history is incomplete for the repository
* GitHub only returned partial data, so [this bug was involved](https://github.com/SocksTheWolf/AgenticAlert/issues/8)
  * Mitigated as of version 1.0.16

### My repo was tagged and I did not use genAI

Besides the:

* Copilot incident
* Submodule flags

This is 100% accurate if it detects you used genAI.
If the script is not sure, it's marked as a warning.
