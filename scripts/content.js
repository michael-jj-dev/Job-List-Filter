var port = chrome.runtime.connect({ name: 'knockknock' });

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

let targetterEnabled = false;
let attribuitions = null; //TOOD: null or {}?
let highlightedElement = null;
let observeMutations = false;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScript);
} else {
  initializeScript();
}

function initializeScript() {
  console.log('Content script has been injected and DOM is fully loaded.');

  //TODO: check if attribuitions is null or in storage
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //TODO: check if already injected. but is this even a realistic use case?
  if (request.action === 'toggleTargetter') {
    targetterEnabled = true;

    injectPrompt();
  }
});

function injectUI(htmlPath, cssPath, containerId, callback) {
  fetch(chrome.runtime.getURL(htmlPath))
    .then((response) => response.text())
    .then((html) => {
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        existingContainer.remove();
      }

      const container = document.createElement('div');
      container.id = containerId;
      container.innerHTML = html;
      document.body.appendChild(container);

      return fetch(chrome.runtime.getURL(cssPath));
    })
    .then((response) => response.text())
    .then((css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);

      if (typeof callback === 'function') {
        callback();
      }
    })
    .catch((error) =>
      console.error(`Failed to load resources for ${containerId}:`, error)
    );
}

function removeUI() {
  const promptContainer = document.getElementById('jlf_prompt_container');
  const retryPromptContainer = document.getElementById(
    'jlf_retry_prompt_container'
  );
  const confirmationContainer = document.getElementById(
    'jlf_confirmation_container'
  );

  if (promptContainer) {
    promptContainer.remove();
  }
  if (retryPromptContainer) {
    retryPromptContainer.remove();
  }
  if (confirmationContainer) {
    confirmationContainer.remove();
  }
}

function injectPrompt() {
  removeUI();
  injectUI(
    'ui/prompt/prompt.html',
    'ui/prompt/prompt.css',
    'jlf_prompt_container'
  );
}

function injectRetryPrompt() {
  removeUI();
  injectUI(
    'ui/retryPrompt/retryPrompt.html',
    'ui/retryPrompt/retryPrompt.css',
    'jlf_retry_prompt_container'
  );
}

function injectConfirmation(listingsAttributes) {
  removeUI();
  injectUI(
    'ui/confirmation/confirmation.html',
    'ui/confirmation/confirmation.css',
    'jlf_confirmation_container',
    () => {
      const confirmButton = document.getElementById(
        'jlf_confirmation_container_confirm_button'
      );
      const declineButton = document.getElementById(
        'jlf_confirmation_container_decline_button'
      );

      if (confirmButton) {
        confirmButton.addEventListener('click', () =>
          onConfirmClick(listingsAttributes)
        );
      }
      if (declineButton) {
        declineButton.addEventListener('click', onDeclineClick);
      }
    }
  );
}

function onConfirmClick(listingsAttributes) {
  attribuitions = listingsAttributes; //TODO: attribuitions or attributes
  console.log(listingsAttributes);
  removeUI();

  //TODO: add temporary prompt that automatically disappears after a couple of seconds
}

function onDeclineClick() {
  removeUI();
  injectPrompt();
  removeListingHighlight();
  targetterEnabled = true;
}

function removeListingHighlight() {
  highlightedElement.style.border = '';
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
    if (targetterEnabled) {
      const listing = findNearestListing(event.target);
      const listingsAttributes = getElementAttributes(listing);

      if (listingsAttributes === null) {
        injectRetryPrompt();
      } else {
        targetterEnabled = false;

        highlightListing(listing);
        injectConfirmation(listingsAttributes);
      }
    }
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

      listingMutated();
    });
  });
}

function listingMutated() {
  console.log('listingMutated');
}

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
      const children = Array.from(currentElement.children);
      const divChildren = children.filter(
        (child) => child.tagName.toLowerCase() === 'div'
      );

      if (divChildren.length >= 10 && children.length === divChildren.length) {
        return currentElement;
      }
    }
    currentElement = currentElement.parentElement;
  }

  return null;
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
