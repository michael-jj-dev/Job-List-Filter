// Listener for messages from content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  sendResponse({ received: true });
});
