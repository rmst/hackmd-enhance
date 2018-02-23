// this is the code which will be injected into a given page...

const ENTER = 13;
const ESCAPE = 27;
const KEY_N = 78;

const DEFAULT_OPTIONS = '{\n"new_doc" : "alt+n" \n}';


// var x = document.getElementsByClassName("ui-edit-area")[0];
// x.focus();


let options = null;
chrome.storage.sync.get({
  options: DEFAULT_OPTIONS
}, function(items) {
  options = JSON.parse(items.options)
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function makeNewDoc() {
  let iframe = document.createElement("iframe");
  iframe.setAttribute("src", "https://hackmd.io/MYUw7AzADATArADgLQBYYE4qpXLCYTBJQBGIAZgsAIZzkgrpA===");
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  // run loop for 5 seconds max
  for( let i=0; i < 100; i++) {
    let path = iframe.contentWindow.location.pathname;

    if (path !== 'new' && path !== 'blank') {
      let url = iframe.contentWindow.location.href;
      // console.log("created " + url)
      iframe.outerHTML = "";
      return url
    }

    await sleep(50)
  }
}

var newDocumentDialogInstance = null;

async function NewDocumentDialog(){
  let self = {};

  if (newDocumentDialogInstance !== null)
    return newDocumentDialogInstance;
  else
    newDocumentDialogInstance = self;

  let previousFocus = document.activeElement;

  self.doc = null;
  self.div = document.createElement("div");
  document.body.appendChild(self.div);
  self.div.style = "position: fixed; right: 0; left: 0; top:0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 10000";

  let inp = document.createElement("input");
  inp.type = "text";
  inp.value = "";
  inp.placeholder = "New Document Name";
  inp.style = "position: absolute; top: 13%; left: 35%; margin: 10px; width: 30%; z-index: 10001; font-size: 35px; box-shadow: 0px 0px 24px -1px rgba(56, 56, 56, 1);";

  self.div.appendChild(inp);

  await sleep(50);  // necessary for subsequent focus
  inp.focus();

  self.cleanup = function(){
    self.div.outerHTML = "";
    document.removeEventListener('keyup', self.docKeyUp, true);
    previousFocus.focus();
    console.log('clean foc')

    newDocumentDialogInstance = null
  };

  inp.addEventListener('keypress', async (e) => {
    // e.stopPropagation();
    if(self.doc === null)
      self.doc = makeNewDoc();

    if(e.which === ENTER){
      let name = inp.value;
      self.cleanup();

      let url = await self.doc;

      // console.log("here " + url);
      document.execCommand("insertHTML", false, '[' + name + '](' + url + ')');

      if(e.shiftKey){
        // window.open(await self.doc);
        chrome.runtime.sendMessage({url: url + '?both'}, function(response) {

        });
      }
    }
  });

  inp.addEventListener('click', (e) => e.stopPropagation());

  self.docKeyUp = (e) => {
    if(e.which === ESCAPE)
      self.cleanup();
  };

  document.addEventListener('keyup', self.docKeyUp , true);
  inp.addEventListener('keyup', self.docKeyUp , true);

  self.div.addEventListener('click', self.cleanup);

  return self;
}


document.addEventListener('keydown', (e) => {
  keys = options.new_doc.split('+');
  mod = keys.slice(0, -1);
  key = keys[keys.length-1];

  // console.log(mod.indexOf("ctrl") >= 0)
  // console.log(mod.indexOf("alt") >= 0)
  // console.log(mod.indexOf("shift") >= 0)
  // console.log(key.charCodeAt(0))
  // console.log(key)
  // console.log(e.key)
  // console.log(e.which)
  if (e.ctrlKey === (mod.indexOf("ctrl") >= 0) &&
      e.altKey === (mod.indexOf("alt") >= 0) &&
      e.shiftKey === (mod.indexOf("shift") >= 0) &&
      e.key.toLowerCase() === key) {
    NewDocumentDialog()
  }
}, true);
