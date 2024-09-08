var port = chrome.runtime.connect({ name: 'knockknock' });

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

let attribuitions = null; //TOOD: null or {}?
let highlightedElement = null;
let observeMutations = false;

let bodyMutationTimeout;
let bodyMutationStopped = false;

let listingFound = false;

function initializeContent() {
  console.log('initializeContent');
}

chrome.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {});

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

let nodeCount = 0;

function isListing(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

  nodeCount++;

  const attributes = node.attributes;
  const attributeList = {};

  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    attributeList[attr.name] = attr.value;
  }

  node.setAttribute('jlf-found', 'found-tag');

  if (node.nodeType === Node.ELEMENT_NODE) {
    node.childNodes.forEach((child) => traverseNodes(child));
  }
}

function containsMoney(text) {
  const moneyRegex = /\$\d+/g;

  return moneyRegex.test(text);
}

function containsTimeAgo(text) {
  const timeAgoRegex = /(second|minute|hour|day|month|year)s?ago/g;

  return timeAgoRegex.test(text);
}

function containsWorkLocation(text) {
  const workLocationRegex = new RegExp(
    [
      'on[-]?site',
      'onsite',
      'officebased',
      'inoffice',
      'atoffice',
      'workonsite',
      'onlocation',
      'fullyremote',
      'remote',
      'remotework',
      'workremotely',
      'workfromhome',
      'wfh',
      'telecommute',
      'remoteoption',
      'remoteavailable',
      'remotefriendly',
      'homebased',
      'hybrid',
      'hybridwork',
      'workhybrid',
      'hybridremote',
      'partialremote',
      'flexiblelocation',
      'combinationofremoteandonsite',
      'mixofremoteandin[-]?office'
    ].join('|'),
    'i'
  );

  return workLocationRegex.test(text);
}

function extractCityStateFromSubstring(text) {
  const cityStateRegex = /[A-Z][a-zA-Z-]*,[A-Z]{2}/g;
  return cityStateRegex.test(text);
}

function highlightListingCell(element) {
  element.style.backgroundColor = '#d0f0c0';
  element.style.borderRadius = '4px';
  element.style.boxShadow = '0 0 5px rgba(0, 128, 0, 0.5)';
}

function isListingCell(element) {
  const descendants = element.querySelectorAll('*');
  const text = element.textContent.trim().replace(/\s+/g, '');

  if (descendants.length < 10 || descendants.length > 100) {
    return false;
  }

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (
      attr.name.toLowerCase().includes('job') ||
      attr.value.toLowerCase().includes('job')
    ) {
      const hasMoney = containsMoney(text);
      const hasTimeAgo = containsTimeAgo(text);
      const hasWorkLocation = containsWorkLocation(text);
      const hasCityState = extractCityStateFromSubstring(text);

      if (hasMoney || hasTimeAgo || hasWorkLocation || hasCityState) {
        highlightListingCell(element);

        console.log(element);
        console.log(text);
        console.log('hasMoney: ' + hasMoney);
        console.log('hasTimeAgo: ' + hasTimeAgo);
        console.log('hasWorkLocation: ' + hasWorkLocation);
        console.log('hasCityState: ' + hasCityState);
        console.log(descendants.length);
        console.log('==================');
      } else {
        console.log(element);
        console.log('==================');
      }
      return true;
    }
  }

  // TODO: potentially add text length limits and child list limits

  //node.setAttribute('jlf-found', 'found-tag');

  return true;
}

function onMutationStabilized(mutationsList, observer) {
  console.log('onMutationStabilized');
  console.time('findElementWithMatchingChildren');

  // TODO: some sites do not mention 'job', so in those cases, we may need to look at all elements.
  const allDivElements = document.body.getElementsByTagName('div');
  const allUlElements = document.body.getElementsByTagName('ul');
  const allArticleElements = document.body.getElementsByTagName('article');

  const allElements = [
    ...allDivElements,
    ...allUlElements,
    ...allArticleElements
  ];

  for (let element of allElements) {
    if (!element.hasAttribute('jlf-found')) {
      isListingCell(element);
    }
  }

  console.timeEnd('findElementWithMatchingChildren');
}

function onMutation(mutationsList, observer) {
  let relevantNodeFound = false;

  mutationsList.forEach((mutation) => {
    const isChildListMutation = mutation.type === 'childList';
    const hasAddedNodes = mutation.addedNodes.length > 0;
    const isRelevantTarget =
      mutation.target.nodeName === 'LI' || mutation.target.nodeName === 'DIV';

    if (!isChildListMutation || !hasAddedNodes || !isRelevantTarget) return;

    mutation.addedNodes.forEach((node) => {
      const isRelevantNode = node.nodeName === 'LI' || node.nodeName === 'DIV';

      if (!isRelevantNode) return;

      bodyMutationStopped = false;
      relevantNodeFound = true;
    });
  });

  if (relevantNodeFound) {
    clearTimeout(bodyMutationTimeout);
    bodyMutationTimeout = setTimeout(() => {
      bodyMutationStopped = true;
      onMutationStabilized();
    }, 500);
  }
}

initializeContent();
const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
