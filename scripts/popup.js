'use strict';

let filtersEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    let url = new URL(activeTab.url);
    let domain = url.hostname;

    console.log('Current tab domain: ' + url);
    console.log('Current tab domain: ' + domain);

    checkStorageForAttr(domain);
  });
});

function initializePopup() {
  chrome.storage.local.get('filtersEnabled', (result) => {
    const storedFiltersEnabled =
      result.filtersEnabled !== undefined ? result.filtersEnabled : true;
    filtersEnabled = storedFiltersEnabled;

    const buttonText = filtersEnabled ? 'Disable Filters' : 'Enable Filters';
    document.getElementById('jlf_toggle_filters_button').textContent =
      buttonText;
  });
}

document
  .getElementById('jlf_toggle_filters_button')
  .addEventListener('click', () => {
    filtersEnabled = !filtersEnabled;

    chrome.storage.local.set({ filtersEnabled }, () => {
      console.log('filtersEnabled updated:', filtersEnabled);
    });

    const buttonText = filtersEnabled ? 'Disable Filters' : 'Enable Filters';
    document.getElementById('jlf_toggle_filters_button').textContent =
      buttonText;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleFilters',
        enabled: filtersEnabled
      });
    });

    // window.close(); //TODO: enabled after QA
  });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'sendListingAttributes') {
    console.log(
      'Message received from content via background.js: ' + request.message
    );
  }
});

function checkStorageForAttr(key) {
  chrome.storage.local.get([key], function (result) {
    if (result[key]) {
      console.log(`Data found for key "${key}":`, result[key]);
    } else {
      console.log(`No data found for key "${key}".`);
    }
  });
}

const keywordInputElements = document.querySelectorAll('.jlf_keyword-input');
const addKeywordBtnElements = document.querySelectorAll('.jlf_add-keyword-btn');
const easyQuickApplyCheckbox = document.getElementById('jlf_easy-quick-apply');
const excludePromotedCheckbox = document.getElementById('jlf_exclude-promoted');
const onSiteCheckbox = document.getElementById('jlf_on-site');
const hybridCheckbox = document.getElementById('jlf_hybrid');
const remoteCheckbox = document.getElementById('jlf_remote');

function addKeyword(inputId, keywordsListId, keyword) {
  if (keyword.trim() === '') return;

  const keywordsList = document.getElementById(keywordsListId);

  const keywordBubble = document.createElement('div');
  keywordBubble.classList.add('jlf_keyword-bubble');
  keywordBubble.textContent = keyword;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'x';
  removeBtn.addEventListener('click', () => {
    keywordsList.removeChild(keywordBubble);
  });

  keywordBubble.appendChild(removeBtn);
  keywordsList.appendChild(keywordBubble);

  document.getElementById(inputId).value = '';

  console.log(`Keyword added to ${keywordsListId}: ${keyword}`);
}

function handleInput(e) {
  if (e.key === ',') {
    e.preventDefault();
    const input = e.target;
    const inputId = input.id;
    const keywordsListId = `jlf_keywords-list-${inputId.split('-')[2]}`;
    addKeyword(inputId, keywordsListId, input.value.trim());
  }
}

keywordInputElements.forEach((input) => {
  input.addEventListener('keypress', handleInput);
});

addKeywordBtnElements.forEach((btn) => {
  btn.addEventListener('click', () => {
    const inputId = `jlf_keyword-input-${btn.getAttribute('data-id')}`;
    const keywordsListId = `jlf_keywords-list-${btn.getAttribute('data-id')}`;
    addKeyword(
      inputId,
      keywordsListId,
      document.getElementById(inputId).value.trim()
    );
  });
});

easyQuickApplyCheckbox.addEventListener('change', () => {
  console.log('Easy or Quick Apply filter:', easyQuickApplyCheckbox.checked);
});

excludePromotedCheckbox.addEventListener('change', () => {
  console.log(
    'Exclude Promoted/Ad/Sponsored/Featured filter:',
    excludePromotedCheckbox.checked
  );
});

function handleCheckboxChange() {
  const selectedWorkTypes = [];
  if (onSiteCheckbox.checked) selectedWorkTypes.push('On-Site');
  if (hybridCheckbox.checked) selectedWorkTypes.push('Hybrid');
  if (remoteCheckbox.checked) selectedWorkTypes.push('Remote');

  console.log('Work types selected:', selectedWorkTypes.join(', '));
}

initializePopup();

onSiteCheckbox.addEventListener('change', handleCheckboxChange);
hybridCheckbox.addEventListener('change', handleCheckboxChange);
remoteCheckbox.addEventListener('change', handleCheckboxChange);
