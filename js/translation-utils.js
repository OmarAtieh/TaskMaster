async function loadTranslations(locale = 'en') {
    try {
      const response = await fetch(`./locales/${locale}.json`);
      if (!response.ok) {
        // Handle HTTP errors (404, 500, etc.)
        if (response.status === 404) {
          console.warn(`Translation file for '${locale}' not found. Falling back to 'en'.`);
          return await loadTranslations('en'); // Fallback to English
        } else {
          throw new Error(`Failed to load translations for '${locale}': ${response.status} ${response.statusText}`);
        }
      }
      const translations = await response.json();
      return translations;
    } catch (error) {
      console.error(`Error loading translations for '${locale}':`, error);
      // Consider a more sophisticated error handling strategy here, 
      // such as displaying a user-friendly message or using a default translation set.
      return {}; // Return an empty object as a fallback
    }
  }
  
  // Export the function to make it accessible from other modules
  export { loadTranslations };