chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('filtersEnabled', (result) => {
    if (result.filtersEnabled === undefined) {
      chrome.storage.local.set({ filtersEnabled: true });
    }
  });
});

chrome.runtime.onConnect.addListener(function (port) {
  console.log('Connected to:', port.name);

  if (port.name === 'knockknock') {
    port.onMessage.addListener(function (msg) {
      console.log('Message received:', msg);
    });
  }
});

chrome.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {});
