// Seals: small cellular automata grown from a title.
// The title seeds every random choice, so the same title always grows the
// same seal and no two titles share one. Used at the end of each post
// (with a caption built from the growth, unless the post sets `seal:` in its
// frontmatter) and on each card of the projects page.
(function () {
  const W = 32;
  const H = 16;

  function seeded(title) {
    // FNV-1a hash of the title, then mulberry32.
    let h = 2166136261;
    for (let i = 0; i < title.length; i++) {
      h ^= title.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let state = h >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function run(rule, start) {
    let row = start;
    const rows = [];
    for (let y = 0; y < H; y++) {
      rows.push(row);
      const next = new Array(W);
      for (let x = 0; x < W; x++) {
        const l = row[(x - 1 + W) % W];
        const c = row[x];
        const r = row[(x + 1) % W];
        next[x] = (rule >> ((l << 2) | (c << 1) | r)) & 1;
      }
      row = next;
    }
    return rows;
  }

  function interesting(rows) {
    const body = rows.slice(3);
    const filled = body.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
    const density = filled / (body.length * W);
    if (density < 0.15 || density > 0.75) return false;
    const keys = rows.map((r) => r.join(''));
    if (new Set(keys.slice(3)).size < H / 2) return false;
    const last = keys.length - 1;
    if (keys[last] === keys[last - 1] || keys[last] === keys[last - 2]) return false;
    const shifted = (row, k) => row.map((_, x) => row[(x - k + W) % W]).join('');
    let slides = 0;
    for (let y = H - 5; y < H; y++) {
      if ([1, -1, 2, -2].some((k) => shifted(rows[y - 1], k) === keys[y])) slides += 1;
    }
    return slides < 4;
  }

  function grow(title) {
    const rand = seeded(title);
    let rule = 0;
    let rows = [];
    for (let attempt = 0; attempt < 80; attempt++) {
      rule = Math.floor(rand() * 256);
      const start = new Array(W).fill(0);
      // Seed the first row with the title's letters themselves.
      for (let i = 0; i < title.length; i++) start[(title.charCodeAt(i) * (i + 1)) % W] ^= 1;
      if (attempt > 0) for (let x = 0; x < W; x++) if (rand() < 0.08) start[x] ^= 1;
      rows = run(rule, start);
      if (interesting(rows)) break;
    }
    return { rule, rows };
  }

  function paint(canvas, rows) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    const cell = canvas.width / W;
    ctx.fillStyle = getComputedStyle(canvas).color;
    rows.forEach((r, y) => r.forEach((v, x) => {
      if (v) ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
    }));
  }

  // Shared with the records pages, which grow a seal for every card.
  window.HDSeal = { grow, paint };

  // ---- Collage ---------------------------------------------------------
  // Cut the visible paragraphs of the post into clause-sized fragments and
  // join two or three at random, like a cut-up poem.
  function collectFragments() {
    const body = document.querySelector('.post-body');
    if (!body) return [];
    const paragraphs = Array.from(body.querySelectorAll('p, li, blockquote'))
      .filter((el) => !el.closest('.sidenote, .footnotes, figure, pre, .callout, [hidden], .post-seal'))
      .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const out = [];
    paragraphs.forEach((text) => {
      text.split(/[。！？；，、：,.;:!?“”"()（）《》\[\]]+/).forEach((piece) => {
        const frag = piece.trim();
        const cjk = (frag.match(/[\u4e00-\u9fff]/g) || []).length;
        const words = frag.split(/\s+/).length;
        if (cjk >= 4 && frag.length <= 22) out.push({ text: frag, zh: true });
        else if (!cjk && words >= 3 && words <= 9) out.push({ text: frag, zh: false });
      });
    });
    return out;
  }

  function makeCollage(fragments) {
    if (fragments.length < 2) return '';
    const zhCount = fragments.filter((f) => f.zh).length;
    const zh = zhCount >= fragments.length / 2;
    const pool = fragments.filter((f) => f.zh === zh);
    if (pool.length < 2) return '';
    const n = Math.min(pool.length, Math.random() < 0.5 ? 2 : 3);
    const picked = [];
    while (picked.length < n) {
      const f = pool[Math.floor(Math.random() * pool.length)].text;
      if (!picked.includes(f)) picked.push(f);
    }
    if (zh) return picked.join('，') + '。';
    const line = picked.map((f, i) => (i === 0 ? f : f.charAt(0).toLowerCase() + f.slice(1))).join(', ');
    return line.charAt(0).toUpperCase() + line.slice(1) + '.';
  }

  // ---- Post seal ------------------------------------------------------
  const postSeal = document.querySelector('.post-seal');
  if (postSeal) {
    const heading = document.querySelector('article h1');
    const enTitle = heading && heading.querySelector('[data-lang-text="en"]');
    const title = ((enTitle || heading || {}).textContent || document.title).trim();
    const { rule, rows } = grow(title);
    const canvas = postSeal.querySelector('canvas');
    if (canvas) paint(canvas, rows);

    const collage = postSeal.querySelector('[data-seal-collage]');
    const button = postSeal.querySelector('.post-seal-mark');
    if (collage) {
      const fragments = collectFragments();
      const write = () => {
        const line = makeCollage(fragments);
        if (line) collage.textContent = line;
      };
      write();
      if (button) button.addEventListener('click', write);
    } else if (button) {
      button.disabled = true;
    }
  }

  // ---- Project cards --------------------------------------------------
  document.querySelectorAll('canvas[data-seal]').forEach((canvas) => {
    const card = canvas.closest('.work-card');
    const titleEl = card && card.querySelector('.work-title');
    if (!titleEl) return;
    const { rule, rows } = grow(titleEl.textContent.trim());
    paint(canvas, rows);
    canvas.title = 'Grown from this title by rule ' + rule;
  });
})();
