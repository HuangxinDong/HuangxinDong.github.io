// Site mark: a one-dimensional cellular automaton grown afresh on every page load.
(function () {
  const SIZE = 24;

  const button = document.querySelector('.site-mark');
  if (!button) return;
  const canvas = button.querySelector('canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  function firstRow() {
    const row = new Array(SIZE).fill(0);
    const kind = Math.random();
    if (kind < 0.3) {
      row[SIZE >> 1] = 1;
    } else if (kind < 0.55) {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) row[Math.floor(Math.random() * SIZE)] = 1;
    } else {
      const density = 0.15 + Math.random() * 0.4;
      for (let i = 0; i < SIZE; i++) row[i] = Math.random() < density ? 1 : 0;
    }
    return row;
  }

  function run(rule, start) {
    let row = start;
    const rows = [];
    for (let y = 0; y < SIZE; y++) {
      rows.push(row);
      const next = new Array(SIZE);
      for (let x = 0; x < SIZE; x++) {
        const l = row[(x - 1 + SIZE) % SIZE];
        const c = row[x];
        const r = row[(x + 1) % SIZE];
        next[x] = (rule >> ((l << 2) | (c << 1) | r)) & 1;
      }
      row = next;
    }
    return rows;
  }

  function interesting(rows) {
    const body = rows.slice(4);
    const filled = body.reduce((sum, r) => sum + r.reduce((a, b) => a + b, 0), 0);
    const density = filled / (body.length * SIZE);
    if (density < 0.12 || density > 0.8) return false;
    const keys = rows.map((r) => r.join(''));
    const distinct = new Set(keys.slice(4)).size;
    if (distinct < SIZE / 3) return false;
    const last = keys.length - 1;
    // Reject patterns that settle into a period of one or two generations.
    if (keys[last] === keys[last - 1] || keys[last] === keys[last - 2]) return false;
    // Reject rules that only slide the starting row sideways
    const shifted = (row, k, flip) => row.map((_, x) => row[(x - k + SIZE) % SIZE] ^ flip).join('');
    const SHIFTS = [0, 1, -1, 2, -2, 3, -3];
    let slides = 0;
    for (let y = SIZE - 8; y < SIZE; y++) {
      const prev = rows[y - 1];
      if (SHIFTS.some((k) => shifted(prev, k, 0) === keys[y] || shifted(prev, k, 1) === keys[y])) slides += 1;
    }
    if (slides >= 5) return false;
    return true;
  }

  function grow() {
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const rule = Math.floor(Math.random() * 256);
      const rows = run(rule, firstRow());
      best = { rule, rows };
      if (interesting(rows)) break;
    }
    return best;
  }

  function draw() {
    cancelAnimationFrame(frame);
    const { rule, rows } = grow();
    const css = canvas.clientWidth || 72;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(css * dpr);
    const cell = canvas.width / SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(button).color;
    button.setAttribute('aria-label', 'Grow a new pattern (this one follows rule ' + rule + ')');
    button.title = 'Rule ' + rule + '. Click to grow another.';

    const paintRow = (y) => {
      rows[y].forEach((v, x) => {
        if (v) ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
      });
    };

    if (reduceMotion.matches || document.hidden) {
      for (let y = 0; y < SIZE; y++) paintRow(y);
      return;
    }
    // Grow downward, one generation per frame (about 0.4 s in total).
    let y = 0;
    const step = () => {
      paintRow(y);
      y += 1;
      if (y < SIZE) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  button.hidden = false;
  button.addEventListener('click', draw);
  draw();
})();
