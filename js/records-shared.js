// Small helpers for the records list (js/records-wall.js).
(function () {
  function stars(n) {
    return n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';
  }

  // Wire up filter chips; calls onChange(value) with "all", "5", "4" or "note".
  function chips(root, onChange) {
    const buttons = root.querySelectorAll('[data-rw-filter]');
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onChange(b.dataset.rwFilter);
    }));
  }

  function passes(filter, rating, hasNote) {
    if (filter === '5') return rating === 5;
    if (filter === '4') return rating >= 4;
    if (filter === 'note') return hasNote;
    return true;
  }

  window.HDRecords = { stars, chips, passes };
})();
