// Projects page: a timeline of works built from the cards' dates.
// Each mark links to its card; hovering either one lights up the other.
(function () {
  const strip = document.querySelector('[data-works-timeline]');
  const cards = Array.from(document.querySelectorAll('.work-card[data-date]'));
  if (!strip || !cards.length) return;

  const toYear = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return y + ((m - 1) + (d - 1) / 31) / 12;
  };
  const dated = cards.filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.dataset.date));
  if (!dated.length) return;

  const years = dated.map((c) => toYear(c.dataset.date));
  const first = Math.floor(Math.min(...years));
  const last = Math.max(Math.floor(Math.max(...years)), new Date().getFullYear()) + 1;
  const span = last - first;
  const pos = (t) => ((t - first) / span) * 100;

  for (let y = first; y < last; y++) {
    const tick = document.createElement('span');
    tick.className = 'wt-year';
    tick.style.left = pos(y) + '%';
    tick.textContent = y;
    strip.append(tick);
  }

  const placed = [];
  dated.forEach((card, i) => {
    const id = card.id || 'work-' + (i + 1);
    card.id = id;
    const x = pos(toYear(card.dataset.date));
    // Stack marks that would overlap, like books leaning on a shelf.
    let level = 0;
    while (placed.some((p) => p.level === level && Math.abs(p.x - x) < 1.2)) level += 1;
    placed.push({ x, level });

    const title = card.querySelector('.work-title');
    const mark = document.createElement('a');
    mark.className = 'wt-mark';
    mark.href = '#' + id;
    mark.style.left = x + '%';
    mark.style.bottom = (level * 7) + 'px';
    mark.setAttribute('aria-label', (title ? title.textContent.trim() : id) + ', ' + card.dataset.date);
    mark.title = mark.getAttribute('aria-label');
    strip.append(mark);

    const light = (on) => {
      mark.classList.toggle('is-lit', on);
      card.classList.toggle('is-lit', on);
    };
    [mark, card].forEach((el) => {
      el.addEventListener('mouseenter', () => light(true));
      el.addEventListener('mouseleave', () => light(false));
      el.addEventListener('focusin', () => light(true));
      el.addEventListener('focusout', () => light(false));
    });
  });

  strip.hidden = false;
})();
