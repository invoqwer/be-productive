# Be Productive
- A simple time interval tracking utility
- Goal: a fully featured lightweight app with as few dependencies as possible
- s = start, c = cancel, enter = end
- localstorage allows persistence while refreshing page

## Setup
- `npm install`
- `node index.js`
- run `nohup node index.js >/dev/null 2>&1 &` to run in the background

## TODO
- ES6 + add linter
- clean up hacky modal logic
- UI feedback on handle invalid interval post
- UI: add interval + delete interval buttons
- interval backing on google sheets
- handle multi week

- media queries / responsiveness
- editable descriptions for each time interval
- top navbar
- remove express: use node native http
- remove pug: write my own small templating engine (CSC324?)