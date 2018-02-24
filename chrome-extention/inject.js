// this is the code which will be injected into a given page...

const ENTER = 13;
const ESCAPE = 27;
const KEY_N = 78;

const DEFAULT_OPTIONS = '{\n"link_doc": "alt+l", \n "open_doc": "alt+o" \n}';

let editor = document.getElementsByClassName('CodeMirror')[0];
// console.log(editor);


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


// this function is not working
async function makeNewDocWithIframe(text) {
  let iframe = document.createElement("iframe");
  iframe.setAttribute("src", "https://hackmd.io/new");
  iframe.style.visibility = 'hidden';
  // iframe.style = "position: fixed; right: 0; left: 0; top:0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 10000; overflow: hidden;";

  document.body.appendChild(iframe);

  iframe.onload = async () => {
    let cm = iframe.contentDocument.getElementsByClassName('CodeMirror')[0];
    console.log(cm);
    iframe.focus();
    cm.focus();
    // run loop for 5 seconds max
    // for( let i=0; i < 10; i++) {
    //   cm = iframe.contentDocument.getElementsByClassName('CodeMirror')[0];
    //   console.log(cm.CodeMirror);
    //
    //   if (cm.hasAttribute("CodeMirror")){
    //     cm.CodeMirror.setValue(text);
    //     console.log("written to new doc");
    //   }
    //   await sleep(500)
    // }

    await sleep(500);
    iframe.contentDocument.execCommand("insertHTML", false, '[fdfsads');


    await sleep(1000);

    // iframe.outerHTML = "";
  };

  // run loop for 5 seconds max
  for( let i=0; i < 100; i++) {
    let path = iframe.contentWindow.location.pathname;

    if (path !== 'new' && path !== 'blank') {
      let url = iframe.contentWindow.location.href;
      // console.log("created " + url)

      return url
    }

    await sleep(50)
  }
}

function makeNewDoc() {return new Promise(resolve => {
  let xhr = new XMLHttpRequest();
  xhr.onload = function () {
    console.log(xhr.responseURL);
    resolve(xhr.responseURL)
  };
  xhr.open('GET', "https://hackmd.io/new", true);
  xhr.send(null);
})}

function loadJSON(url) {return new Promise(resolve => {
  let xhr = new XMLHttpRequest();
  xhr.onload = function() {
    resolve(JSON.parse(xhr.responseText))
  };
  xhr.open("GET", url, true);
  xhr.send();
})}

var newDocumentDialogInstance = null;

async function NewDocumentDialog(link){
  let self = {};

  if (newDocumentDialogInstance !== null)
    return newDocumentDialogInstance;
  else
    newDocumentDialogInstance = self;

  let previousFocus = document.activeElement;

  self.doc = null;
  self.div = document.createElement("div");
  self.div.class = "ui-widget";
  self.div.id = "div";
  document.body.appendChild(self.div);
  document.body.style.overflow = "hidden";  // disable weird scroll bar
  self.div.style = "position: fixed; right: 0; left: 0; top:0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 10000; overflow: hidden;";

  let inp = document.createElement("input");
  inp.id = "tags";
  inp.type = "text";
  // inp.setAttribute("list", "doclist");  // setAttribute necessary because "list" attribute is "non-standard"
  inp.value = "";
  if (link)
    inp.placeholder = "Link to Document";
  else
    inp.placeholder = "Open Document";
  inp.style = "position: absolute; top: 13%; left: 35%; margin: 10px; width: 30%; z-index: 10001; font-size: 35px;";

  let history = await loadJSON("https://hackmd.io/history");
  history = history.history;
  console.log(history);

  let docnames = history.map(doc => doc.text);

  console.log(docnames);

  // let dl = document.createElement("datalist");
  // dl.setAttribute("id", "doclist");
  //
  // for(let doc in docList){
  //   let opt = document.createElement("option");
  //   opt.setAttribute("value", docList[doc]);
  //   dl.appendChild(opt);
  //   // console.log(opt);
  // }
  //
  // self.div.appendChild(dl);

  self.div.appendChild(inp);

  await sleep(50);  // necessary for subsequent focus
  inp.focus();

  let autocomplete = $( "#tags" ).autocomplete({
      source: docnames,
      appendTo: "#div",
      autoFocus: true,
      minLength: 0,
      classes: {
        "ui-autocomplete": "highlight"
      },
      delay: 50,
  });

  $("#tags").autocomplete("enable");

  self.cleanup = function(){
    self.div.outerHTML = "";
    document.removeEventListener('keyup', self.docKeyUp, true);
    previousFocus.focus();

    newDocumentDialogInstance = null
  };

  self.div.addEventListener('keydown', async (e) => {
    // e.stopPropagation();
    // if(self.doc === null)
    //   self.doc = makeNewDoc();
    console.log(e.key);
    if(e.key === "Tab"){
      // e.stopPropagation();
      e.preventDefault();  // do not switch focus
    }
    else if(e.which === ENTER){
      e.stopPropagation();  // no auto-complete on enter (use tab instead)

      let name = inp.value;

      self.cleanup();

      let url;

      if (docnames.indexOf(name) < 0) {
        self.doc = makeNewDoc();
        // self.doc = makeNewDocWithIframe("#" + name);

        url = await self.doc;
      }
      else {
        let id = history.filter(doc => doc.text === name)[0].id;
        url = "https://hackmd.io/" + id;
      }

      if (link)
        document.execCommand("insertHTML", false, '[' + name + '](' + url + ')');
      else if (! e.shiftKey)
        window.open(url + '?both', "_self");

      if(e.shiftKey){
        // window.open(await self.doc);
        chrome.runtime.sendMessage({url: url + '?both'}, function(response) {

        });
      }
    }
    else if(e.which === ESCAPE)
      self.cleanup();

  }, true);

  inp.addEventListener('click', (e) => e.stopPropagation());

  // self.docKeyUp = (e) => {
  //   if(e.which === ESCAPE)
  //     self.cleanup();
  // };
  //
  // document.addEventListener('keyup', self.docKeyUp , true);
  // inp.addEventListener('keyup', self.docKeyUp , true);

  self.div.addEventListener('click', self.cleanup);

  return self;
}

function compareKeys(e, str){
  keys = str.split('+');
  mod = keys.slice(0, -1);
  key = keys[keys.length-1];

  // console.log(mod.indexOf("ctrl") >= 0)
  // console.log(mod.indexOf("alt") >= 0)
  // console.log(mod.indexOf("shift") >= 0)
  // console.log(key.charCodeAt(0))
  // console.log(key)
  // console.log(e.key)
  // console.log(e.which)
  return  e.ctrlKey === (mod.indexOf("ctrl") >= 0) &&
          e.altKey === (mod.indexOf("alt") >= 0) &&
          e.shiftKey === (mod.indexOf("shift") >= 0) &&
          e.key.toLowerCase() === key
}

document.addEventListener('keydown', async (e) => {
  if (compareKeys(e, options.link_doc))
    await NewDocumentDialog(true);
  else if (compareKeys(e, options.open_doc))
    await NewDocumentDialog(false);

}, true);
