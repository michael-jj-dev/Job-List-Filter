var port = chrome.runtime.connect({ name: 'knockknock' });

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

let targetterEnabled = false;
let attribuitions = null; //TOOD: null or {}?

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
    console.log('Command received from popup via background.js');

    injectPrompt();

    targetterEnabled = true;
  }
});

function injectPrompt() {
  fetch(chrome.runtime.getURL('ui/prompt/prompt.html'))
    .then((response) => response.text())
    .then((html) => {
      const uiContainer = document.createElement('div');
      uiContainer.id = 'jlf_prompt_container';
      uiContainer.innerHTML = html;
      document.body.appendChild(uiContainer);

      return fetch(chrome.runtime.getURL('ui/prompt/prompt.css'));
    })
    .then((response) => response.text())
    .then((css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch((error) => console.error('Failed to load resources:', error));
}

function injectConfirmation() {
  fetch(chrome.runtime.getURL('ui/confirmation/confirmation.html'))
    .then((response) => response.text())
    .then((html) => {
      const promptContainer = document.getElementById('jlf_prompt_container');
      if (promptContainer) {
        promptContainer.remove();
      }

      const uiContainer = document.createElement('div');
      uiContainer.id = 'jlf_confirmation_container';
      uiContainer.innerHTML = html;
      document.body.appendChild(uiContainer);

      return fetch(chrome.runtime.getURL('ui/confirmation/confirmation.css'));
    })
    .then((response) => response.text())
    .then((css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);

      document.getElementById('myButton').addEventListener('click', () => {
        handleButtonClick();
      });
    })
    .catch((error) => console.error('Failed to load resources:', error));
}

function handleButtonClick() {
  const uiContainer = document.getElementById('jlf_confirmation_container');
  if (uiContainer) {
    uiContainer.remove();
  }
}

const htmlElement = document.querySelector('html'); //TODO: Or document.querySelector('html');

htmlElement.addEventListener(
  'click',
  (event) => {
    if (targetterEnabled) {
      const listing = findNearestListing(event.target);
      const listingsAttributes = getElementAttributes(listing);

      injectConfirmation();

      targetterEnabled = false;
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

  if (element.attributes !== null) {
    Array.from(element.attributes).forEach((attr) => {
      attributesObj[attr.name] = attr.value;
    });
  }

  return attributesObj;
}

const observer = new MutationObserver(onMutation);
observer.observe(document.body, { childList: true, subtree: true });
