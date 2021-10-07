# Be Productive
- A simple time interval tracking utility with no external dependencies
- s = start, c = cancel, enter = end
- localstorage allows persistence while refreshing page
- controls to manually add intervals
- save intervals to local json file

## Setup
- `npm install` (need node version >= 13 for async/module support)
- `node index.js`
- run `nohup node index.js >/dev/null 2>&1 &` to run in the background

## TODO
- convert server file ops to async
- clean up hacky modal logic
- interval backing on google sheets
- handle multi week?
- editable descriptions for each time interval?
