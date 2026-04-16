/**
 * js/bilingual.js
 * Handles language switching for dual-language posts.
 */

document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.querySelector('.bilingual-switcher');
    if (!switcher) return;

    const btnZh = switcher.querySelector('.btn-zh');
    const btnEn = switcher.querySelector('.btn-en');
    
    if (!btnZh || !btnEn) return;

    const setLanguage = (lang) => {
        if (lang === 'en') {
            document.body.classList.add('lang-en-active');
            document.body.classList.remove('lang-zh-active');
            btnEn.classList.add('active');
            btnZh.classList.remove('active');
            btnEn.setAttribute('aria-pressed', 'true');
            btnZh.setAttribute('aria-pressed', 'false');
        } else {
            document.body.classList.add('lang-zh-active');
            document.body.classList.remove('lang-en-active');
            btnZh.classList.add('active');
            btnEn.classList.remove('active');
            btnZh.setAttribute('aria-pressed', 'true');
            btnEn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('preferred-lang', lang);
    };

    // Load preference
    const preferredLang = localStorage.getItem('preferred-lang');
    if (preferredLang) {
        setLanguage(preferredLang);
    } else {
        // Fallback to document language or default 'zh'
        const docLang = document.documentElement.lang || 'zh';
        setLanguage(docLang.startsWith('en') ? 'en' : 'zh');
    }

    btnZh.addEventListener('click', () => setLanguage('zh'));
    btnEn.addEventListener('click', () => setLanguage('en'));
});
