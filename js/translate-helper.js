/**
 * Translation Helper Script
 * This script provides utility functions to easily apply translations to all pages
 */

// Apply translations to the entire page automatically
function autoTranslateAll() {
  // Get all text nodes in the document
  const textNodes = getAllTextNodes(document.body);
  
  // Get current language
  const currentLang = getSavedLanguage();
  
  // Process each text node
  textNodes.forEach(node => {
    // Skip nodes that are already handled by data-i18n
    if (node.parentElement && node.parentElement.hasAttribute('data-i18n')) {
      return;
    }
    
    // Skip empty text or just whitespace
    const text = node.textContent.trim();
    if (!text || text.length === 0) {
      return;
    }
    
    // Skip if parent has certain tags (like script, style)
    const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
    if (['script', 'style', 'select', 'option'].includes(parentTag)) {
      return;
    }
    
    // Skip numbers-only content
    if (/^\d+(\.\d+)?$/.test(text)) {
      return;
    }
    
    // Create a key from the text
    const key = 'auto.' + text.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 30);
    
    // Add data-i18n attribute to parent if possible
    if (node.parentElement && !node.parentElement.hasAttribute('data-i18n')) {
      node.parentElement.setAttribute('data-i18n', key);
      
      // Add to auto-translation collection for later export
      if (window.autoTranslations) {
        window.autoTranslations[key] = text;
      }
    }
  });
  
  // Apply translations
  updateTranslations(currentLang);
}

// Get all text nodes in an element
function getAllTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}

// Initialize auto-translation collection
window.autoTranslations = {};

// Export collected auto-translations to console
function exportAutoTranslations() {
  console.log(JSON.stringify(window.autoTranslations, null, 2));
}

// Apply translations to all pages
document.addEventListener('DOMContentLoaded', function() {
  // Initialize auto-translation system
  setTimeout(autoTranslateAll, 500); // Delay to ensure all dynamic content is loaded
  
  // Add export button for developers (hidden in production)
  // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  //   const exportBtn = document.createElement('button');
  //   exportBtn.textContent = 'Export Translations';
  //   exportBtn.style.position = 'fixed';
  //   exportBtn.style.bottom = '10px';
  //   exportBtn.style.right = '10px';
  //   exportBtn.style.zIndex = '9999';
  //   exportBtn.addEventListener('click', exportAutoTranslations);
  //   document.body.appendChild(exportBtn);
  // }
});