var port = chrome.runtime.connect({ name: 'knockknock' });

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

let attribuitions = null; //TOOD: null or {}?
let highlightedElement = null;
let observeMutations = false;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', automaticListingFinder);
} else {
  setTimeout(() => {
    automaticListingFinder();
  }, 3000);
}

function automaticListingFinder(
  minChildrenCount = 10,
  minFirstChildDescendants = 10
) {
  console.time('findElementWithMatchingChildren');

  const allDivElements = document.body.getElementsByTagName('div');
  const allUlElements = document.body.getElementsByTagName('ul');

  const allElements = [...allDivElements, ...allUlElements];

  for (let element of allElements) {
    //TODO: add filter that looks for elements that are not visible
    const directChildren = element.children;
    //TODO: find the most common child element type, which is most likely to be the actual list type. Use that index to check.
    const childIndexToCheck = 3;

    if (directChildren.length >= minChildrenCount) {
      const middleChildTag =
        directChildren[childIndexToCheck].tagName.toLowerCase();

      const matchingChildrenCount = Array.from(directChildren).filter(
        (child) => child.tagName.toLowerCase() === middleChildTag
      ).length;

      const matchingPercentage =
        (matchingChildrenCount / directChildren.length) * 100;

      if (matchingPercentage < 90) continue;

      const middleChildDescendants =
        directChildren[childIndexToCheck].getElementsByTagName('*');

      if (middleChildDescendants.length >= minFirstChildDescendants) {
        //TODO: include tie breakers. prioritise css selector with 'job'.
        console.log(
          'Found an element with at least',
          minChildrenCount,
          'direct children of the same tag type:',
          element
        );
        console.timeEnd('findElementWithMatchingChildren');
        return;
      }
    }
  }
  console.timeEnd('findElementWithMatchingChildren');
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request.action);
});

function removeListingHighlight() {
  if (highlightedElement) {
    highlightedElement.style.border = '';
  }
}

function highlightListing(listingElement) {
  if (highlightedElement !== null) {
    removeListingHighlight();
  }

  highlightedElement = listingElement;
  listingElement.style.border = '2px solid aqua';
}

const htmlElement = document.querySelector('html'); //TODO: Or document.querySelector('html');

htmlElement.addEventListener(
  'click',
  (event) => {
    const targetId = event.target.id;
  },
  true
);

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

      console.log('listingMutated');
    });
  });
}

function getElementAttributes(element) {
  let attributesObj = {};

  if (element === null || element.attributes === null) {
    return null;
  } else {
    Array.from(element.attributes).forEach((attr) => {
      attributesObj[attr.name] = attr.value;
    });

    return attributesObj;
  }
}

const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
