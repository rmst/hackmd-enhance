// Saves options to chrome.storage

const DEFAULT_OPTIONS = '{\n  "link_doc": "alt+l", \n  "open_doc": "alt+o", \n  "backlink": true \n}';


function save_options() {
  var options = document.getElementById('options').value;
  chrome.storage.sync.set({
    options: options
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    // status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    options: DEFAULT_OPTIONS
  }, function(items) {
    document.getElementById('options').innerHTML = items.options
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);