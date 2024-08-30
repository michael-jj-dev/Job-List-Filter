chrome.runtime.onConnect.addListener(function (port) {
  //long term connection
  console.log('Connected to:', port.name);

  if (port.name === 'knockknock') {
    port.onMessage.addListener(function (msg) {
      console.log('Message received:', msg);
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //one-time connection
  // if (request.action === 'toggleTargetter') {
  //   chrome.tabs.sendMessage(request.tabId, {
  //     action: request.action
  //   });
  // }
});
