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

function findNearestListing(element) {
  var currentElement = element.parentElement;

  while (currentElement !== null) {
    if (currentElement.tagName.toLowerCase() === 'ul') {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }

  currentElement = element.parentElement;

  while (currentElement !== null) {
    if (currentElement.tagName.toLowerCase() === 'div') {
      var divChildren = Array.from(currentElement.children).filter(
        (child) => child.tagName.toLowerCase() === 'div'
      );
      if (divChildren.length > 5) {
        return currentElement;
      }
    }
    currentElement = currentElement.parentElement;
  }

  return null;
}

function getElementAttributes(element) {
  let attributesObj = {};

  Array.from(element.attributes).forEach((attr) => {
    attributesObj[attr.name] = attr.value;
  });

  return attributesObj;
}

const htmlElement = document.querySelector('html'); // Or document.querySelector('html');

htmlElement.addEventListener(
  'click',
  (event) => {
    const listing = findNearestListing(event.target);

    let listingsAttributes = getElementAttributes(listing);

    console.log(listing);
    console.log('listingsAttributes:', listingsAttributes);
  },
  true
);

function listingMutated() {
  console.log('mutation observed');
}

function onMutation(mutationsList, observer) {
  mutationsList.forEach((mutation) => {
    const isChildListMutation = mutation.type === 'childList';
    const hasAddedNodes = mutation.addedNodes.length > 0;
    const isRelevantTarget =
      mutation.target.nodeName === 'LI' || mutation.target.nodeName === 'DIV';

    if (!isChildListMutation || !hasAddedNodes || !isRelevantTarget) return;

    mutation.addedNodes.forEach((node) => {
      const isRelevantNode = node.nodeName === 'LI' || node.nodeName === 'DIV';

      if (!isRelevantNode) return;

      listingMutated();
    });
  });
}

const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
