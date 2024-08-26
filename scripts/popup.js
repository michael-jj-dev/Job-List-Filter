'use strict';

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

// document.getElementById('targetterBtn').addEventListener('click', () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     chrome.tabs.sendMessage(tabs[0].id, {
//       action: 'toggleTargetter'
//     });
//   });
//   window.close();
// });

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

const keywordInputElements = document.querySelectorAll('.keyword-input');
const addKeywordBtnElements = document.querySelectorAll('.add-keyword-btn');
const easyQuickApplyCheckbox = document.getElementById('easy-quick-apply');
const excludePromotedCheckbox = document.getElementById('exclude-promoted');

function addKeyword(inputId, keywordsListId, keyword) {
  if (keyword.trim() === '') return;

  const keywordsList = document.getElementById(keywordsListId);

  const keywordBubble = document.createElement('div');
  keywordBubble.classList.add('keyword-bubble');
  keywordBubble.textContent = keyword;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'x';
  removeBtn.addEventListener('click', () => {
    keywordsList.removeChild(keywordBubble);
  });

  keywordBubble.appendChild(removeBtn);
  keywordsList.appendChild(keywordBubble);

  document.getElementById(inputId).value = '';
}

function handleInput(e) {
  if (e.key === ',') {
    e.preventDefault();
    const input = e.target;
    const inputId = input.id;
    const keywordsListId = `keywords-list-${inputId.split('-')[2]}`;
    addKeyword(inputId, keywordsListId, input.value.trim());
  }
}

keywordInputElements.forEach((input) => {
  input.addEventListener('keypress', handleInput);
});

addKeywordBtnElements.forEach((btn) => {
  btn.addEventListener('click', () => {
    const inputId = `keyword-input-${btn.getAttribute('data-id')}`;
    const keywordsListId = `keywords-list-${btn.getAttribute('data-id')}`;
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
