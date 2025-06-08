async function loadTranslations(lang) {
  try {
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
      throw new Error(`Could not load ${lang}.json`);
    }
    return await response.json();
  } catch (error) {
    console.error('Translation loading failed:', error);
    // Fallback to Polish if the requested language fails
    if (lang !== 'pl') {
      return await loadTranslations('pl');
    }
  }
}

function translatePage(translations) {
  document.querySelectorAll('[data-i18n-key]').forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    const translation = key.split('.').reduce((obj, k) => (obj || {})[k], translations);
    
    if (translation) {
      // Handle different types of elements
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.placeholder) {
           element.placeholder = translation;
        }
      } else {
        element.innerHTML = translation;
      }
    } else {
        console.warn(`No translation found for key: ${key}`);
    }
  });
}

async function setLanguage(lang) {
  if (lang !== 'pl' && lang !== 'en') {
    lang = 'pl';
  }
  localStorage.setItem('language', lang);
  const translations = await loadTranslations(lang);
  
  // Update dynamic content language if applicable
  if(typeof updateContentForLanguage === "function") {
    updateContentForLanguage(translations);
  } else {
    // Default translation for static elements
    translatePage(translations);
  }

  // Update language button text if it exists
  const langButton = document.getElementById('language-button-text');
  if (langButton) {
      langButton.textContent = lang.toUpperCase();
  }
}

function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'pl';
    const newLang = currentLang === 'pl' ? 'en' : 'pl';
    setLanguage(newLang);
}

document.addEventListener('DOMContentLoaded', () => {
    const userLang = localStorage.getItem('language') || 'pl';
    setLanguage(userLang);
}); 