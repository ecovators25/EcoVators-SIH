// Enhanced language switching logic for EcoVators
const availableLangs = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  // Add Marathi, Tamil etc later
];

// Cache for translations to avoid repeated fetching
const translationsCache = {};

// Preload translations for faster switching
async function preloadTranslations() {
  for (const lang of availableLangs) {
    if (!translationsCache[lang.code]) {
      const module = await getTranslationFile(lang.code);
      translationsCache[lang.code] = module.translations;
    }
  }
}

function getTranslationFile(langCode) {
  switch (langCode) {
    case 'hi':
      return import('./lang-hi.js');
    // Add cases for other languages
    case 'en':
    default:
      return import('./lang-en.js');
  }
}

function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  updateTranslations(lang);
  // Update language selector if it exists
  const langSelector = document.getElementById('lang-selector');
  if (langSelector) {
    langSelector.value = lang;
  }
}

function getSavedLanguage() {
  return localStorage.getItem('lang') || 'en';
}

// Get translation for a specific key
function getTranslation(key, lang) {
  const currentLang = lang || getSavedLanguage();
  if (translationsCache[currentLang] && translationsCache[currentLang][key]) {
    return translationsCache[currentLang][key];
  }
  // Fallback to English if translation not found
  if (translationsCache['en'] && translationsCache['en'][key]) {
    return translationsCache['en'][key];
  }
  return key; // Return the key itself if no translation found
}

// Expose getTranslation to global scope for use in HTML
window.getTranslation = getTranslation;

window.updateTranslations = async function(selectedLang) {
  const lang = selectedLang || getSavedLanguage();
  
  // Load translations if not cached
  if (!translationsCache[lang]) {
    const translationModule = await getTranslationFile(lang);
    translationsCache[lang] = translationModule.translations;
  }
  
  const translations = translationsCache[lang];
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      el.setAttribute('placeholder', translations[key]);
    }
  });
  
  // Update titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (translations[key]) {
      el.setAttribute('title', translations[key]);
    }
  });
  
  // Update values for buttons and inputs
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    if (translations[key]) {
      el.setAttribute('value', translations[key]);
    }
  });
  
  // Dispatch event for custom components that need to know language changed
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
};

// Create Language Selector UI with improved styling
function injectLangSelector() {
  const nav = document.querySelector('.navbar') || document.body;
  let langContainer = document.getElementById('lang-container');
  
  if (!langContainer) {
    langContainer = document.createElement('div');
    langContainer.id = 'lang-container';
    langContainer.style.display = 'inline-block';
    langContainer.style.marginLeft = '16px';
    langContainer.style.position = 'relative';
    
    const langSel = document.createElement('select');
    langSel.id = 'lang-selector';
    langSel.style.padding = '5px 10px';
    langSel.style.borderRadius = '4px';
    langSel.style.border = '1px solid #ccc';
    langSel.style.backgroundColor = '#fff';
    langSel.style.cursor = 'pointer';
    
    availableLangs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.name;
      langSel.appendChild(opt);
    });
    
    langSel.value = getSavedLanguage();
    langSel.addEventListener('change', e => setLanguage(langSel.value));
    
    langContainer.appendChild(langSel);
    nav.appendChild(langContainer);
  }
}

// Initialize language system
document.addEventListener('DOMContentLoaded', async function() {
  // Preload translations for faster switching
  await preloadTranslations();
  
  // Create language selector
  injectLangSelector();
  
  // Apply initial translations
  updateTranslations();
});
