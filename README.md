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
* gemini 

---

## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is (probably) a limitation of github_.
* this also applies to git submodules for the same reason (thus repositories that use `psxrecomp` and the like will not be flagged immediately).
* if genAI is used in previous/other branches, or purged commits, it will not be detected. _Limitation of github_.
* requires tampermonkey/userscript runner (more than one-click install).

## Bugs

* sometimes github will just **delete the results badge** because it feels like it. I'm not sure what causes that. **Refresh to bring it back**. (this might be fixed now? if not, I'll look into something more...immune)

## Contributing

I'm looking for more ai coding agents to add to the list. If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose) with the following:

* A link to the repo that uses said coding agent
* The coding agent's user id number (if you don't know it, just give me the name and I can figure it out)

## FAQ

### Why

Because shit's too hard and it should just be on the tin. I'm tired of having to play "uh did they or didn't they?"

### This missed a repository, why?

Couple reasons:

* Could have been affected by one of the [caveats](#caveats) (git submodules, fork networks, etc)
* The GPT agent tool used is not known (please [open an issue](#contributing))
* Agent usage history is incomplete for the repository

### My repo was tagged and I did not use genAI

If this tool says you used genAI, then you used it. There's no false positives. Unlike you, I know how to write regex.
