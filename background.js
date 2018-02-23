chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  chrome.tabs.create({'url': request.url}, function(tab) {
    
  });
});