// Runs at document_start to inject drag blocking before Knack's scripts load.
// Must be in the page world to register capture handlers before Knack.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('drag-block-page.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);
