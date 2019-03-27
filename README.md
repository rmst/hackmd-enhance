# HackMD-Enhance
A Google Chrome extension for https://hackmd.io

![ss](/screen.png)

### Open a document:
- press `alt + o`
- type the name of the doc (non-existing docs will be created)
- press enter (or `shift+enter` to open in a new tab)

### Link to a document:
- press `alt + l`
- type the name of the doc (non-existing docs will be created)
- press enter (or `shift+enter` to open the linked document in a new tab)

### Change shortcut
- open HackMD-Enhance options
- edit shortcut for command
- possible modifier include "alt", "ctrl", "shift", "meta"
- the actual key (e.g. l) has to come last and be lower case

### Manual Installation
- download zip and unpack or clone this repo
- go to `chrome://extensions` and check "Developer Mode"
- click "Load unpacked extention" and select folder

### Unofficial HackMD API
Revisions
```
https://hackmd.io/<DOCID>==/revision
	{"revision":[{"time":1519768768451,"length":9197},{"time":1519759464339,"length":9195},{"time":1519758825562,"length":0}]}
https://hackmd.io/<DOCID>/revision/1519759464339
```