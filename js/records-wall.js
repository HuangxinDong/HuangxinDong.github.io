// Records page: the list under the heatmaps.
// The data is embedded in the page as JSON (see recordsJson in Douban/UI.hs).
// The category buttons above the heatmaps choose what the list shows; the
// status buttons switch between finished entries and the wishlist.
document.addEventListener('DOMContentLoaded', () => {
  const dataEl = document.getElementById('records-data');
  const root = document.querySelector('[data-records-list]');
  if (!dataEl || !root || !window.HDRecords) return;
  const R = window.HDRecords;
  const PAGE = 30;
  const DONE_LABEL = { all: 'Marked', book: 'Read', film: 'Watched', music: 'Listened', game: 'Played' };
  const DATE_LABEL = { book: 'Published', film: 'Released', music: 'Released', game: 'Released' };

  let all = [];
  try {
    all = JSON.parse(dataEl.textContent).map((a) => ({
      kind: a[0], status: a[1], title: a[2], alt: a[3], rating: a[4], logged: a[5],
      note: a[6], by: a[7], subject: a[8], link: a[9],
      haystack: (a[2] + ' ' + a[3] + ' ' + a[6] + ' ' + a[7]).toLowerCase(),
    }));
  } catch (e) {
    return;
  }

  const list = root.querySelector('.rl-list');
  const more = root.querySelector('.rw-more');
  const count = root.querySelector('.rw-count');
  const empty = root.querySelector('.rw-empty');
  const input = root.querySelector('.rw-search');
  const statusButtons = root.querySelectorAll('[data-rl-status]');
  const chipsBox = root.querySelector('.rw-chips');
  let cat = 'all';
  let status = 'done';
  let filter = 'all';
  let query = '';
  let shown = PAGE;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function metaLine(label, value) {
    const p = el('p', 'record-meta-line');
    p.append(el('span', 'record-meta-label', label), document.createTextNode(' ' + value));
    return p;
  }

  // Same markup as templates/douban-record-item.html.
  function row(r) {
    const li = el('li', 'record-card');
    const header = el('div', 'record-card-header');
    const h = el('h3', 'record-title');
    const titleText = r.alt ? r.title + ' / ' + r.alt : r.title;
    if (r.link) {
      const a = el('a', '', titleText);
      a.href = r.link;
      a.target = '_blank';
      a.rel = 'noreferrer';
      h.append(a);
    } else {
      h.textContent = titleText;
    }
    header.append(h);
    if (r.rating) {
      const tools = el('div', 'record-card-tools');
      const stars = el('span', 'record-stars', R.stars(r.rating));
      stars.setAttribute('aria-label', r.rating + ' out of 5');
      tools.append(stars);
      header.append(tools);
    }
    li.append(header);

    const meta = el('div', 'record-meta');
    if (r.by) meta.append(metaLine('By', r.by));
    if (r.subject) meta.append(metaLine(DATE_LABEL[r.kind] || 'Released', r.subject));
    if (r.logged) meta.append(metaLine('Logged', r.logged));
    li.append(meta);

    if (r.note) {
      const c = el('div', 'record-comment');
      c.append(el('span', 'record-comment-label', 'Review: '), el('span', 'record-comment-body', r.note));
      li.append(c);
    }
    return li;
  }

  function render() {
    const q = query.trim().toLowerCase();
    const inCat = all.filter((r) => cat === 'all' || r.kind === cat);
    root.querySelector('.rl-n-done').textContent = inCat.filter((r) => r.status === 'done').length;
    root.querySelector('.rl-n-wish').textContent = inCat.filter((r) => r.status === 'wish').length;
    root.querySelector('.rl-status-label').textContent = DONE_LABEL[cat];
    chipsBox.hidden = status === 'wish';

    const items = inCat.filter((r) => r.status === status
      && (status === 'wish' || R.passes(filter, r.rating, !!r.note))
      && (!q || r.haystack.includes(q)));
    list.replaceChildren(...items.slice(0, shown).map(row));
    empty.hidden = items.length > 0;
    more.hidden = items.length <= shown;
    count.textContent = items.length
      ? 'Showing ' + Math.min(shown, items.length) + ' of ' + items.length + ', newest first.'
      : '';
  }

  statusButtons.forEach((b) => b.addEventListener('click', () => {
    statusButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    status = b.dataset.rlStatus;
    shown = PAGE;
    render();
  }));
  R.chips(root, (value) => { filter = value; shown = PAGE; render(); });
  input.addEventListener('input', () => { query = input.value; shown = PAGE; render(); });
  more.addEventListener('click', () => { shown += PAGE; render(); });
  document.querySelectorAll('[data-hm-cat]').forEach((b) => b.addEventListener('click', () => {
    cat = b.dataset.hmCat;
    shown = PAGE;
    render();
  }));

  root.hidden = false;
  render();
});
