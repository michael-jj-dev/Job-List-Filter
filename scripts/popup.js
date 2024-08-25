'use strict';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    let url = new URL(activeTab.url);
    let domain = url.hostname;

    console.log('Current tab domain: ' + url);
    console.log('Current tab domain: ' + domain);

    checkStorageForAttr(domain);
  });
});

document.getElementById('targetterBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'toggleTargetter'
    });
  });
  window.close();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'sendListingAttributes') {
    console.log(
      'Message received from content via background.js: ' + request.message
    );
  }
});

function checkStorageForAttr(key) {
  chrome.storage.local.get([key], function (result) {
    if (result[key]) {
      console.log(`Data found for key "${key}":`, result[key]);
    } else {
      console.log(`No data found for key "${key}".`);
    }
  });
}
