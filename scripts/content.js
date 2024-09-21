var port = chrome.runtime.connect({ name: 'knockknock' });

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

let attribuitions = null; //TOOD: null or {}?
let highlightedElement = null;
let observeMutations = false;

let bodyMutationTimeout;
let bodyMutationStopped = false;

let listFindAttempts = 0;
let listingNode = null;

let sweepCount = 0;

let currentBaseUrl = window.location.origin + window.location.pathname;

function initializeContent() {
  console.log('initializeContent');
}

chrome.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {});

function onBaseUrlChange(newBaseUrl) {
  currentBaseUrl = newBaseUrl;

  listFindAttempts = 0;
  listingNode = null;

  sweepCount = 0;
}

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
  const abbreviationRegex = /\b\d+[smhdwy]\b/g;
  const commonPhrasesRegex = /\b(yesterday|today)\b/g;
  const timeWithUnitsRegex = /\b\d+\s(week|day|month|year)s?\sago\b/g;

  // New regexes to handle additional cases
  const lastTimePeriodRegex = /\b(last\s(week|month|year))\b/g;
  const fewTimeAgoRegex =
    /\b(a\s(few|couple|several)\s(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\sago)\b/g;
  const justNowRegex = /\b(just\snow)\b/g;
  const pastTimePeriodRegex =
    /\b(in\s(the\s(past|last))\s\d+\s(day|week|month|year)s?)\b/g;
  const standaloneTimeUnitsRegex = /\b\d+\s(week|month|year)s?\b/g;
  const earlierTimePeriodRegex =
    /\b(earlier\s(this\s(week|month|year|day)))\b/g;
  const withinTimePeriodRegex =
    /\b(within\s(the\s(last|past))\s\d+\s(day|week|month|year)s?)\b/g;
  const recentlyRegex = /\b(recently|recent)\b/g;

  return (
    timeAgoRegex.test(text) ||
    abbreviationRegex.test(text) ||
    commonPhrasesRegex.test(text) ||
    timeWithUnitsRegex.test(text) ||
    lastTimePeriodRegex.test(text) ||
    fewTimeAgoRegex.test(text) ||
    justNowRegex.test(text) ||
    pastTimePeriodRegex.test(text) ||
    standaloneTimeUnitsRegex.test(text) ||
    earlierTimePeriodRegex.test(text) ||
    withinTimePeriodRegex.test(text) ||
    recentlyRegex.test(text)
  );
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
}

function isListingCell(element) {
  const descendants = element.querySelectorAll('*');
  const text = element.textContent.trim().replace(/\s+/g, '');

  const containsCorrectNumberOfDescendants =
    descendants.length >= 10 && descendants.length <= 100;
  const containsJob = listingNode
    ? true
    : Array.from(element.attributes).some(
        (attr) =>
          attr.name.toLowerCase().includes('job') ||
          attr.value.toLowerCase().includes('job')
      );

  if (containsJob && containsCorrectNumberOfDescendants) {
    const hasMoney = containsMoney(text);
    const hasTimeAgo = containsTimeAgo(text);
    const hasWorkLocation = containsWorkLocation(text);
    const hasCityState = extractCityStateFromSubstring(text);
    // TODO: add another filter for general listing cell terms (Actively Hiring, Apply Now, etc)
    // TODO: potentially add text length limits and child list limits

    if (hasMoney || hasTimeAgo || hasWorkLocation || hasCityState) {
      // console.log(element);
      // console.log(text);
      // console.log('text.length: ' + text.length);
      // console.log('descendants.length: ' + descendants.length);
      // console.log('hasMoney: ' + hasMoney);
      // console.log('hasTimeAgo: ' + hasTimeAgo);
      // console.log('hasWorkLocation: ' + hasWorkLocation);
      // console.log('hasCityState: ' + hasCityState);
      // console.log('==================');

      return true;
    }
  }

  return false;
}

function hasJobInTagName(element) {
  return element.tagName.toLowerCase().includes('job');
}

function automaticListingFinder(element, minChildrenCount = 10) {
  const directChildren = [...element.children];

  if (directChildren.length < minChildrenCount) return false;

  const childrenWithEnoughDescendants = directChildren.filter((child) => {
    const text = child.textContent.trim().replace(/\s+/g, '');

    const hasMoney = containsMoney(text);
    const hasTimeAgo = containsTimeAgo(text);
    const hasWorkLocation = containsWorkLocation(text);
    const hasCityState = extractCityStateFromSubstring(text);

    return hasMoney || hasTimeAgo || hasWorkLocation || hasCityState;
  }).length;

  if (childrenWithEnoughDescendants < 5) return false;

  listingNode = element;

  return true;
}

var cellsFound = 0;

function onMutationStabilized(mutationsList, observer) {
  let allElements = [];

  if (!listingNode) {
    console.log('looking in entire site');
    const allDivElements = document.body.querySelectorAll(
      'div:not([jlf_element])'
    );
    const allUlElements = document.body.querySelectorAll(
      'ul:not([jlf_element])'
    );
    const allArticleElements = document.body.querySelectorAll(
      'article:not([jlf_element])'
    );
    const allLinkElements = document.body.querySelectorAll(
      'a:not([jlf_element])'
    );
    const elementsWithJobInTagName = findElementsWithJobInTagName(
      document.body
    );

    function findElementsWithJobInTagName(rootElement) {
      const allElements = rootElement.getElementsByTagName('*');

      return Array.from(allElements).filter(
        (element) =>
          hasJobInTagName(element) && !element.hasAttribute('jlf_element')
      );
    }

    allElements = [
      ...allDivElements,
      ...allUlElements,
      ...allArticleElements,
      ...allLinkElements,
      ...elementsWithJobInTagName
    ];
  } else {
    console.log('looking in listing');
    const allDivElements = listingNode.querySelectorAll(
      'div:not([jlf_element])'
    );
    const allUlElements = listingNode.querySelectorAll('li:not([jlf_element])');
    const allArticleElements = listingNode.querySelectorAll(
      'article:not([jlf_element])'
    );
    const allLinkElements = listingNode.querySelectorAll(
      'a:not([jlf_element])'
    );
    const elementsWithJobInTagName = findElementsWithJobInTagName(listingNode);

    function findElementsWithJobInTagName(rootElement) {
      const allElements = rootElement.getElementsByTagName('*');

      return Array.from(allElements).filter(
        (element) =>
          hasJobInTagName(element) && !element.hasAttribute('jlf_element')
      );
    }

    allElements = [
      ...allDivElements,
      ...allUlElements,
      ...allArticleElements,
      ...allLinkElements,
      ...elementsWithJobInTagName
    ];
  }

  for (let element of allElements) {
    if (!element.hasAttribute('jlf_element') && isListingCell(element)) {
      cellsFound++;
      element.setAttribute('jlf_element', 'jlf_listing-cell');
    } else {
      element.setAttribute('jlf_element', 'jlf_non-job');
    }
  }
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
      if (sweepCount > 3 && cellsFound < 5) return;

      const newBaseUrl = window.location.origin + window.location.pathname;
      if (newBaseUrl !== currentBaseUrl) {
        onBaseUrlChange(newBaseUrl);
      }

      console.log(currentBaseUrl);

      console.time('findElementWithMatchingChildren');

      bodyMutationStopped = true;

      if (!listingNode && listFindAttempts < 5) {
        const allUlElementsToSearch = document.body.querySelectorAll('ul');

        let listingFound = false;
        for (let element of allUlElementsToSearch) {
          listingFound = automaticListingFinder(element);
          if (listingFound) {
            element.setAttribute('jlf_element', 'jlf_job-listing');
          } else {
            element.setAttribute('jlf_element', 'jlf_non-job-listing');
          }
        }

        if (!listingFound) {
          listFindAttempts++;
        }
      }

      console.log('onMutationStabilized');

      onMutationStabilized();

      if (cellsFound > 5) {
        const elements = document.querySelectorAll(
          '[jlf_element="jlf_listing-cell"]'
        );

        for (let element of elements) {
          highlightListingCell(element);
          highlightListingCell(element.children[0]);
          element.setAttribute('jlf_element', 'jlf_listing-cell-color');
        }
      }

      console.timeEnd('findElementWithMatchingChildren');

      sweepCount++;
    }, 100); //TODO: verify if this limit has any effect
  }
}

initializeContent();
const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
