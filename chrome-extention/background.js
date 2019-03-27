const DEFAULT_OPTIONS = '{\n  "link_doc": "alt+l", \n  "open_doc": "alt+o" \n}';


let options = null;
chrome.storage.sync.get({
  options: DEFAULT_OPTIONS
}, function(items) {
  console.log(items.options);
  options = JSON.parse(items.options);
});

function get(url){
  return new Promise(resolve => {
    let xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr)
    xhr.open("GET", url, true);
    xhr.send();
})}

function timeout(ms, ...args) {
  return new Promise(resolve => setTimeout(resolve, ms, ...args))
}

function loadJSON(url) {
  return get(url).then(req => {
    // console.log(req.responseText);
    return JSON.parse(req.responseText);
  })}

async function loadHistory(host){
  let url = "https://" + host + "/history";
  console.log("loadHistory url: " + url);
  let h1 = await Promise.race([loadJSON(url).then(x=>x.history), timeout(1000, [])])

  // console.log("loadHistory result: " + h1)
  
  let res = h1.map(doc => {
    doc.text = doc.text;
    doc.url = "https://" + host + "/" + doc.id
    return doc
  })
  // res.sort()
  return res
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // console.log(request)
  if(request.cmd == 'open'){
    chrome.tabs.create({'url': request.url}, sendResponse);
  }
  else if(request.cmd == 'history'){
    loadHistory(request.host).then(sendResponse)
    return true  // necessary for the response to be send
  }
});