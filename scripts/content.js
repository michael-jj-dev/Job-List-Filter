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

function listingMutated() {
  console.log('mutation observed');
}

function onMutation(mutationsList, observer) {
  mutationsList.forEach((mutation) => {
    const isChildListMutation = mutation.type === 'childList';
    const hasAddedNodes = mutation.addedNodes.length > 0;

    if (!isChildListMutation || !hasAddedNodes) return;

    mutation.addedNodes.forEach((node) => {
      const isRelevantNode = node.nodeName === 'LI' || node.nodeName === 'DIV';

      if (!isRelevantNode) return;

      listingMutated();
    });
  });
}

const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
