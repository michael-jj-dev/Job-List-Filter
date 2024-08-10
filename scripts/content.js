var port = chrome.runtime.connect({ name: 'knockknock' });

chrome.runtime.sendMessage(
  {
    message: 'Content script injected'
  },
  function (response) {
    console.log(
      'Message sent to background script or service worker:',
      response
    );
  }
);
