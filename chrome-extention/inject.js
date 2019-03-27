// this is the code which will be injected into a given page...

if (document.body.innerHTML.includes("https://github.com/hackmdio/codimd")){
  console.log("CodiMD detected, injecting CodiMD Enhance");

  const DEFAULT_OPTIONS = '{\n  "link_doc": "alt+l", \n  "open_doc": "alt+o" \n}';

  // const ENTER = 13;
  // const ESCAPE = 27;
  // const KEY_N = 78;

  // console.log(editor);


  // var x = document.getElementsByClassName("ui-edit-area")[0];
  // x.focus();


  let options = null;
  chrome.storage.sync.get({
    options: DEFAULT_OPTIONS
  }, function(items) {
    console.log(items.options);
    options = JSON.parse(items.options)
  });

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function post(url, type, content){
    return new Promise(resolve => {
      let xhr = new XMLHttpRequest();
      xhr.onload = resolve
      xhr.open('POST', url, true);
      xhr.setRequestHeader("Content-Type", type)
      xhr.send(content);
  })}

  function makeNewDoc(content) {
    return post("/new", "text/markdown", content).then(e => {
      return e.target.responseURL
    })
  }

  function get(url){
    return new Promise(resolve => {
      let xhr = new XMLHttpRequest();
      xhr.onload = resolve
      xhr.open("GET", url, true);
      xhr.send();
  })}

  function loadJSON(url) {return get(url).then(req => JSON.parse(req.responseText))}

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

    // let history = await loadJSON("/history");
    // history = history.history;
    // console.log(history);
    // let docnames = history.map(doc => doc.text);

    let history = await new Promise(resolve => chrome.runtime.sendMessage({cmd: 'history', host: window.location.hostname}, x => {resolve(x)}));

    let docnames = history.map(doc => doc.text);

    // console.log(history, docnames);

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
      console.log("cleanup");
      // self.div.outerHTML = "";
      document.body.removeChild(self.div);
      // document.removeEventListener('keyup', self.docKeyUp, true);
      document.removeEventListener('keydown', self.docKeyDown, true);
      previousFocus.focus();
      newDocumentDialogInstance = null
    };

    div_key_down = async (e) => {
      console.log(e.key);
      if(e.key === "Tab"){
        e.preventDefault();  // do not switch focus
      }
      else if(e.key === "Enter"){
        e.stopPropagation();  // no auto-complete on enter (use tab instead)

        let name = inp.value;

        previousFocus.focus();
        // self.cleanup();

        let url;

        if (docnames.indexOf(name) < 0) {
          var content = "# " + name
          let potential_id = window.location.pathname.substring(1)
          current_doc = history.filter(doc => doc.id === potential_id)[0];
          console.log("make_doc current_doc = " + potential_id + " " + current_doc);

          if (current_doc != null){
            content = content + "\n" + "[↖ " + current_doc.text + "](/" + current_doc.id + ")";
          }

          url = await makeNewDoc(content);
        }
        else {
          url = history.filter(doc => doc.text === name)[0].url;
        }

        if (link)
          document.execCommand("insertHTML", false, '[' + name + '](' + url + ')');
        else if (! e.shiftKey)
          window.open(url + '?both', "_self");

        if(e.shiftKey){
          // window.open(await self.doc);
          chrome.runtime.sendMessage({cmd: 'open', url: url + '?both'}, function(response) {

          });
        }
      }
      else if(e.key === "Escape"){
        self.cleanup();
      }
    }
    
    inp.addEventListener("focusout", self.cleanup);
    self.div.addEventListener('keydown', div_key_down , true);

    // self.docKeyDown = e => {if(e.key === "Escape"){self.cleanup()}}
    // document.addEventListener('keydown', self.docKeyDown , true);

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
            e.metaKey === (mod.indexOf("meta") >= 0) &&
            e.key.toLowerCase() === key
  }

  document.addEventListener('keydown', async (e) => {
    if (compareKeys(e, options.link_doc))
      await NewDocumentDialog(true);
    else if (compareKeys(e, options.open_doc))
      await NewDocumentDialog(false);

  }, true);

}