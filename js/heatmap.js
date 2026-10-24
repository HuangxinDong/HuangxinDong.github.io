// Heatmaps of Douban records (rendered at build time by Douban/Heatmap.hs).
//
// Home page: hovering or tapping a day shows what was marked on it.
// Records page: category buttons recolour every year's grid and summary.
(function () {
  const KIND = { book: 'book', film: 'film', music: 'music', game: 'game' };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const ORDER = ['film', 'book', 'music', 'game'];

  // Same colouring as Douban/Heatmap.hs: one hue per category, three
  // shades, horizontal stripes when a day holds several categories.
  function background(d, only) {
    const parts = ORDER
      .filter((k) => !only || only === k)
      .map((k) => [k, Number(d[k]) || 0])
      .filter(([, n]) => n > 0);
    if (!parts.length) return '';
    const swatch = ([k, n]) => 'var(--hm-' + k + '-' + Math.min(3, n) + ')';
    if (parts.length === 1) return swatch(parts[0]);
    const stop = (i) => Math.floor((i * 100) / parts.length) + '%';
    return 'linear-gradient(' + parts.map((p, i) => swatch(p) + ' ' + stop(i) + ' ' + stop(i + 1)).join(', ') + ')';
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d + ' ' + MONTHS[m - 1] + ' ' + y;
  }

  // ---- Day details (home page) ---------------------------------------
  function setupDetails(root) {
    const info = root.querySelector('.hm-info');
    if (!info) return;
    const dateEl = info.querySelector('.hm-info-date');
    const list = info.querySelector('.hm-info-list');
    let active = null;

    function show(cell) {
      if (!cell || !cell.dataset.items) return;
      if (active) active.classList.remove('is-active');
      active = cell;
      cell.classList.add('is-active');
      dateEl.textContent = formatDate(cell.dataset.date);
      list.replaceChildren();
      const lines = cell.dataset.items.split('\n');
      lines.slice(0, 4).forEach((line) => {
        const first = line.indexOf('|');
        const second = line.indexOf('|', first + 1);
        const kind = line.slice(0, first);
        const rating = Number(line.slice(first + 1, second)) || 0;
        const title = line.slice(second + 1);

        const li = document.createElement('li');
        const t = document.createElement('span');
        t.className = 'hm-info-title';
        t.textContent = title;
        const k = document.createElement('span');
        k.className = 'hm-info-kind';
        k.dataset.kind = kind;
        k.textContent = KIND[kind] || kind;
        li.append(t, k);
        if (rating) {
          const r = document.createElement('span');
          r.className = 'hm-info-rating';
          r.setAttribute('aria-label', rating + ' out of 5');
          r.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          li.append(r);
        }
        list.append(li);
      });
      if (lines.length > 4) {
        const more = document.createElement('li');
        more.className = 'hm-info-more';
        more.textContent = 'and ' + (lines.length - 4) + ' more';
        list.append(more);
      }
    }

    root.addEventListener('mouseover', (event) => show(event.target.closest('.hm-cell')));
    root.addEventListener('click', (event) => show(event.target.closest('.hm-cell')));

    const filled = root.querySelectorAll('.hm-cell[data-items]');
    if (filled.length) show(filled[filled.length - 1]);
  }

  // ---- Category switch (records page) --------------------------------
  function setupCategories(root) {
    const buttons = root.querySelectorAll('[data-hm-cat]');
    if (!buttons.length) return;
    const cells = root.querySelectorAll('.hm-cell:not(.hm-out)');
    const sums = root.querySelectorAll('.hm-sum');

    function apply(cat) {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hmCat === cat)));
      cells.forEach((cell) => {
        if (!cell.dataset.date) return;
        cell.style.background = background(cell.dataset, cat === 'all' ? null : cat);
      });
      sums.forEach((p) => {
        const text = p.getAttribute('data-sum-' + cat);
        if (text) p.textContent = text;
      });
    }

    buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.hmCat)));
    root.querySelector('.hm-cats').hidden = false;
  }

  // On narrow screens the grid scrolls sideways; start at the newest weeks.
  document.querySelectorAll('.hm-recent .hm-scroll').forEach((box) => {
    box.scrollLeft = box.scrollWidth;
  });

  // ---- Years (records page) -----------------------------------------
  // Show the most recent year; the list beside it switches to the others.
  function setupYears(root) {
    const nav = root.querySelector('.hm-yearnav');
    const years = Array.from(root.querySelectorAll('.hm-year'));
    if (!nav || years.length < 2) return;
    const buttons = years.map((section, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = section.dataset.year;
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        years.forEach((y) => { y.hidden = y !== section; });
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      nav.append(b);
      return b;
    });
    years.forEach((y, i) => { y.hidden = i !== 0; });
    nav.hidden = false;
  }

  document.querySelectorAll('[data-heatmap]').forEach((root) => {
    setupDetails(root);
    setupCategories(root);
    setupYears(root);
  });
})();
