(function () {
  const STORAGE_KEY = 'blog:preferred-language';

  function supportedLanguages() {
    return Array.from(document.querySelectorAll('[data-lang-panel]'))
      .map((panel) => panel.getAttribute('data-lang-panel'))
      .filter(Boolean);
  }

  function preferredLanguage(languages, fallback) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && languages.includes(stored)) return stored;
    if (languages.includes(fallback)) return fallback;
    return languages[0] || fallback;
  }

  function setLanguage(lang) {
    const page = document.querySelector('[data-lang-page]');
    const description = document.querySelector('meta[name="description"]');
    const panels = Array.from(document.querySelectorAll('[data-lang-panel]'));
    const titles = Array.from(document.querySelectorAll('[data-lang-text]'));
    const buttons = Array.from(document.querySelectorAll('[data-lang-button]'));

    panels.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-lang-panel') !== lang;
    });

    titles.forEach((title) => {
      title.hidden = title.getAttribute('data-lang-text') !== lang;
    });

    buttons.forEach((button) => {
      const isActive = button.getAttribute('data-lang-button') === lang;
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    document.documentElement.lang = lang;
    if (page && description) {
      const nextDescription = page.getAttribute('data-description-' + lang);
      if (nextDescription) description.setAttribute('content', nextDescription);
    }
    window.localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('blog:languagechange', { detail: { lang } }));
  }

  function initLanguageToggle() {
    const root = document.querySelector('[data-lang-root]');
    if (!root) return;

    const languages = supportedLanguages();
    if (languages.length === 0) return;

    const fallback = root.getAttribute('data-default-lang') || document.documentElement.lang || 'en';
    setLanguage(preferredLanguage(languages, fallback));

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-lang-button]');
      if (!button) return;

      const lang = button.getAttribute('data-lang-button');
      if (!languages.includes(lang)) return;
      setLanguage(lang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageToggle, { once: true });
  } else {
    initLanguageToggle();
  }
})();
