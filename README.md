# AgenticAlert

A silly userscript that alerts you if a github repo uses genAI. Can be installed in pretty much everything.

## To Install

1. Download [TamperMonkey](https://www.tampermonkey.net/) for your browser
2. [Click Here to Install](https://github.com/SocksTheWolf/AgenticAlert/raw/refs/heads/main/agenticalert.user.js)


## Caveats

* genAI used in fork network commits will not be shown, unless the fork repository also uses genAI. _This is probably a limitation of github_.
* sometimes github will just **delete the results badge** because it feels like it. I'm not sure what causes that. **Refresh to bring it back**. (if you know what's causing this, feel free to open an issue with details, haven't had a chance to trace it yet)
* requires tampermonkey (more than one-click install)
* if genAI used in previous/other branches, or purged/rolledback commits, it will not be detected. Limitation of github (to my knowledge)


## Screenshots

![Detection Badge Example](/.github/screenshot.jpg?raw=true)

![Example of a safe repo](/.github/screenshot3.jpg?raw=true)


## Contributing

I'm looking for more ai coding agents to add to the list. If you find one, [open an issue](https://github.com/SocksTheWolf/AgenticAlert/issues/new/choose) with the following:

* A link to the repo that uses said coding agent
* The coding agent's user id number (if you don't know it, just give me the name and I can figure it out)

## Why

Because shit's too hard and it should just be on the tin.

## My repo was tagged and I did not use genAI

If this tool says you used genAI, then you used it. There's no false positives. Unlike you, I know how to write regex.
