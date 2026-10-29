/* Ludum Dare and generative AI: interactive figures for the blog.
 *
 * Vanilla JS, no libraries. Each figure is a placeholder in the post:
 *   <div class="ldai" data-ldai="attention"></div>
 * This script fetches the data once and fills every placeholder it finds.
 * It looks things up inside each placeholder only (no ids), so the same
 * figure can appear more than once on a page (e.g. in both language panels).
 *
 * Source of the data: research/ld-ai-discourse/analysis/blog/make_blog_data.py
 * Figure code adapted from analysis/page3/ldai3.src.html.
 */
(function () {
'use strict';

const script = document.currentScript;
const SRC = (script && script.dataset.src) || '/assets/ld-ai/ldai-data.json';
const ROOTS = Array.from(document.querySelectorAll('[data-ldai]'));
if (!ROOTS.length) return;

/* ---------- helpers ---------- */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at || {}) if (at[k] != null) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
const txt = (p, x, y, s, at) => { const t = el('text', Object.assign({ x, y }, at || {}), p); t.textContent = s; return t; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v, d) => (v * 100).toFixed(d || 0) + '%';
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
function wilson(k, n) { if (!n) return [NaN, NaN, NaN]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [p, Math.max(0, (c - w) / d), Math.min(1, (c + w) / d)]; }
function median(a) { const s = a.filter(v => v != null && !isNaN(v)).sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; }
function quant(a, q) { const s = a.filter(v => v != null && !isNaN(v)).sort((x, y) => x - y); if (!s.length) return NaN; const i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
function niceTicks(lo, hi, n) { const span = hi - lo || 1, step0 = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag, step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag; const t = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) t.push(+v.toFixed(10)); return t; }
function logTicks(lo, hi) { const t = []; for (let e = Math.floor(Math.log10(Math.max(lo, 1e-9))); e <= Math.ceil(Math.log10(hi)); e++) [1, 2, 5].forEach(m => { const v = m * Math.pow(10, e); if (v >= lo - 1e-9 && v <= hi + 1e-9) t.push(v); }); return t; }
function fmtNum(v) { return Math.abs(v) >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : (+(+v).toFixed(2)).toString(); }

/* one tooltip for the whole page */
const tip = h('div', 'ldai-tip'); tip.hidden = true; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
function showTip(ev, html) { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth, ht = tip.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + ht > innerHeight - 8) y = ev.clientY - ht - 14; tip.style.left = Math.max(4, x) + 'px'; tip.style.top = Math.max(4, y) + 'px'; }
function hideTip() { tip.hidden = true; }
const hov = (node, html) => { node.addEventListener('mousemove', ev => showTip(ev, typeof html === 'function' ? html() : html)); node.addEventListener('mouseleave', hideTip); };
addEventListener('scroll', hideTip, { passive: true });

/* ---------- palettes ---------- */
const TAB10 = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
const VIR = ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'];
const RDBU = ['#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac'];
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
function ramp(stops, t) { t = Math.max(0, Math.min(1, t)); const x = t * (stops.length - 1), i = Math.min(Math.floor(x), stops.length - 2), f = x - i, a = hex(stops[i]), b = hex(stops[i + 1]); return 'rgb(' + a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(',') + ')'; }
const lum = c => { const m = (c.startsWith('#') ? hex(c) : c.match(/\d+/g).map(Number)); return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; };
const vir = t => ramp(VIR, t);
const crit = t => ramp(RDBU, 1 - t);
const inkOn = c => lum(c) > 0.55 ? '#1a1a1a' : '#ffffff';

/* ---------- vocabularies ---------- */
const PERIODS = [{ k: 'p1', lab: 'LD50–52', lds: [50, 51, 52], col: TAB10[0] }, { k: 'p2', lab: 'LD53–54', lds: [53, 54], col: TAB10[2] }, { k: 'p3', lab: 'LD55–58', lds: [55, 56, 57, 58], col: TAB10[4] }, { k: 'p4', lab: 'LD59–60', lds: [59, 60], col: TAB10[3] }];
const LDS = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
const EVENTS = LDS.map(l => ({ key: 'ld' + l, lab: 'LD' + l, ld: l, test: c => c.ld === l }));
const REF = [['P', 'Using AI to make the game', TAB10[0]], ['R', 'AI running inside the game', TAB10[1]], ['K', 'AI-written comments or posts', TAB10[4]], ['T', 'AI as the theme of the game', TAB10[2]], ['G', 'Opponent / NPC behaviour AI', TAB10[7]], ['O', 'Other or unrelated', '#c7c7c7']];
const EVAL = [['E+', 'Praise', '#2166ac'], ['C+', 'Praise with a concession', '#67a9cf'], ['MX', 'Mixed', '#c6dbef'], ['0', 'No judgement', '#e6e6e6'], ['MK', 'Points out AI, no judgement', '#a3a3a3'], ['H-', 'Softened criticism', '#f4a582'], ['E-', 'Direct criticism', '#b2182b']];
const EVL = Object.fromEntries(EVAL.map(e => [e[0], e[1]]));
const ECOL = Object.fromEntries(EVAL.map(e => [e[0], e[2]]));
const ACTS = [['e', 'Judges the work'], ['n', 'Cites a rule or norm'], ['s', 'Penalises (won\'t rate, lowers a score)'], ['b', 'Praises not using AI'], ['t', 'Thanks for disclosing or opting out'], ['a', 'Asks or guesses whether AI was used'], ['m', 'Points out AI traces'], ['x', 'Says AI was used and not admitted'], ['v', 'Suggests an AI tool'], ['c', 'Asks how the AI was used']];
const USES = [['A', 'Art'], ['U', 'Music and sound'], ['V', 'Voice'], ['T', 'Writing'], ['C', 'Code'], ['P', 'Store page / cover'], ['W', 'The whole game']];
const POS = c => c.ev === 'E+' || c.ev === 'C+', NEG = c => c.ev === 'H-' || c.ev === 'E-', DIR = c => POS(c) || NEG(c);

/* ---------- controls ---------- */
function buttons(ctl, label, opts, st, key, redraw, multi) {
  const row = h('div', 'row'); row.appendChild(h('span', 'lab', esc(label)));
  opts.forEach(([v, l, t]) => {
    const b = h('button', 'bt'); b.type = 'button'; b.textContent = l; if (t) b.title = t; b.dataset.v = v;
    b.setAttribute('aria-pressed', multi ? st[key].includes(v) : st[key] === v);
    b.addEventListener('click', () => {
      if (b.disabled) return;
      if (multi) { const i = st[key].indexOf(v); if (i >= 0) { if (st[key].length > 1) st[key].splice(i, 1); } else st[key].push(v); }
      else st[key] = v;
      row.querySelectorAll('.bt').forEach(x => x.setAttribute('aria-pressed', multi ? st[key].includes(x.dataset.v) : st[key] === x.dataset.v));
      redraw();
    });
    row.appendChild(b);
  });
  ctl.appendChild(row); return row;
}
function checks(ctl, items, st, redraw) {
  const row = h('div', 'row'); row.appendChild(h('span', 'lab', ''));
  items.forEach(([key, l]) => { const lab = h('label', 'ck', `<input type="checkbox"${st[key] ? ' checked' : ''}> ${esc(l)}`);
    lab.querySelector('input').addEventListener('change', e => { st[key] = e.target.checked; redraw(); }); row.appendChild(lab); });
  ctl.appendChild(row); return row;
}
function legend(box, items) { box.innerHTML = items.map(([k, l, c]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join(''); }

/* ---------- chart primitives (W = drawing width in px, set before each draw) ---------- */
let W = 720;

function stacked(fig, rows, cats, o) {
  o = o || {}; const lw = o.lw || 150, rh = o.rh || 20, gap = o.gap || 6, top = 4, H = top + rows.length * (rh + gap) + 4;
  fig.innerHTML = ''; const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.aria || '' }, fig);
  const tots = rows.map(r => cats.reduce((s, c) => s + (r.n[c[0]] || 0), 0)), maxT = Math.max(1, ...tots), bw = W - lw - 60;
  rows.forEach((r, i) => {
    const y = top + i * (rh + gap), tot = tots[i];
    txt(svg, 0, y + rh / 2 + 4, r.lab);
    txt(svg, W, y + rh / 2 + 4, 'n = ' + tot, { 'text-anchor': 'end', class: 't2', 'font-size': 12 });
    let x = lw; const scale = o.mode === 'count' ? bw / maxT : (tot ? bw / tot : 0);
    cats.forEach(([k, l, c]) => {
      const v = r.n[k] || 0; if (!v) return; const w = v * scale;
      const rect = el('rect', { x, y, width: Math.max(w - 1, 0.6), height: rh, fill: c }, svg);
      if (w > 30) txt(svg, x + w / 2, y + rh / 2 + 4, o.mode === 'count' ? v : pct(v / tot), { 'text-anchor': 'middle', 'font-size': 12, style: `fill:${inkOn(c)}`, 'pointer-events': 'none' });
      hov(rect, `<b>${esc(r.lab)}</b><br>${esc(l)}: ${v} of ${tot} (${pct(v / tot, 1)})`);
      x += w;
    });
  });
}

function strip(fig, groups, o) {
  o = o || {}; const lw = o.lw || 200, mw = 72, rh = o.rh || 38, top = 22, H = top + groups.length * rh + 28, x0 = lw + mw, x1 = W - 8;
  fig.innerHTML = ''; const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' }, fig);
  const lo = o.lo, hi = o.hi, lg = o.log;
  const sx = v => { v = Math.max(lg ? Math.max(lo, 1e-9) : lo, Math.min(hi, v)); return lg ? x0 + (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * (x1 - x0) : x0 + (v - lo) / (hi - lo) * (x1 - x0); };
  const ticks = o.ticks || (lg ? logTicks(lo, hi) : niceTicks(lo, hi, Math.max(3, Math.round((x1 - x0) / 80))));
  ticks.forEach(t => { el('line', { x1: sx(t), x2: sx(t), y1: top - 4, y2: H - 24, class: 'grid' }, svg); txt(svg, sx(t), H - 8, o.tfmt ? o.tfmt(t) : fmtNum(t), { 'text-anchor': 'middle', class: 't2', 'font-size': 12 }); });
  txt(svg, lw + 4, 12, 'n', { class: 't2', 'font-size': 12 });
  if (o.overlay !== 'none') txt(svg, x0 - 8, 12, 'median', { class: 't2', 'font-size': 12, 'text-anchor': 'end' });
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  groups.forEach((g, i) => {
    const y = top + i * rh, vals = g.vals.filter(v => v.v != null && !isNaN(v.v) && (!lg || v.v > 0));
    txt(svg, 0, y + rh / 2 + 4, g.lab);
    txt(svg, lw + 4, y + rh / 2 + 4, vals.length, { class: 't2', 'font-size': 12 });
    el('rect', { x: x0, y: y + 3, width: x1 - x0, height: rh - 6, class: 'band' }, svg);
    const col = g.color || TAB10[0];
    vals.forEach(v => { const c = el('circle', { cx: sx(v.v), cy: y + 7 + rnd() * (rh - 14), r: o.r || 2.2, fill: v.color || col, 'fill-opacity': 0.7 }, svg); if (v.tip) hov(c, v.tip); });
    if (!vals.length) return;
    const md = median(vals.map(v => v.v));
    if (o.overlay === 'box') { const q1 = quant(vals.map(v => v.v), 0.25), q3 = quant(vals.map(v => v.v), 0.75); el('rect', { x: sx(q1), y: y + 5, width: Math.max(1, sx(q3) - sx(q1)), height: rh - 10, fill: 'none', class: 'ink', 'stroke-width': 1.3 }, svg); }
    if (o.overlay !== 'none') {
      el('line', { x1: sx(md), x2: sx(md), y1: y + 3, y2: y + rh - 3, class: 'ink', 'stroke-width': 2.2 }, svg);
      txt(svg, x0 - 8, y + rh / 2 + 4, o.fmt ? o.fmt(md) : fmtNum(md), { 'text-anchor': 'end', 'font-weight': 'bold', style: `fill:${col}` });
    }
  });
  if (o.xlab) txt(svg, x1, H + 12, o.xlab, { 'text-anchor': 'end', class: 't2', 'font-size': 12 });
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 16}`); svg.setAttribute('height', H + 16);
}

/* heat table; cell(r, c) -> {text, tip, color} ; o.onCell(r, c) makes cells clickable */
function heat(table, rows, cols, cell, o) {
  o = o || {};
  table.classList.toggle('tall', !!o.tall);
  let s = '<colgroup><col class="lc">' + cols.map(() => '<col>').join('') + '</colgroup><thead><tr><th></th>' + cols.map(c => `<th class="c">${esc(c.lab)}${c.sub ? '<br><span class="sub">' + esc(c.sub) + '</span>' : ''}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach((r, ri) => {
    const on = o.active && o.active.r === r.key;
    s += `<tr${on ? ' class="on"' : ''}><th class="rl${o.onCell ? ' click' : ''}" data-ri="${ri}" data-ci="-1">${esc(r.lab)}</th>`;
    cols.forEach((c, ci) => {
      const z = cell(r, c) || { text: '' }, act = on && (o.active.c == null || o.active.c === c.key) ? ' sel' : '';
      const clk = o.onCell && z.n ? ' click' : '';
      if (z.color == null) { s += `<td class="c dim${clk}${act}" data-ri="${ri}" data-ci="${ci}" title="${esc(z.tip || '')}">${z.text}</td>`; return; }
      s += `<td class="c${clk}${act}" data-ri="${ri}" data-ci="${ci}" title="${esc(z.tip || '')}" style="background:${z.color};color:${inkOn(z.color)}">${z.text}</td>`;
    });
    s += '</tr>';
  });
  table.innerHTML = s + '</tbody>';
  if (o.onCell) table.querySelectorAll('.click').forEach(td => td.addEventListener('click', () => { const ri = +td.dataset.ri, ci = +td.dataset.ci; o.onCell(rows[ri], ci < 0 ? null : cols[ci]); }));
}

/* ---------- figures ---------- */
const FIG = {};

/* How often AI comes up */
FIG.attention = function (root, D) {
  const st = { show: 'both', mode: 'rate', ev: true, era: true };
  const E = D.events.map(e => ({ ld: e[0], t: day(e[1]), date: e[1], theme: e[2], games: e[3], com: e[4], aic: e[5], posts: e[6], aip: e[7], note: e[8] }));
  function day(s) { return new Date(s + 'T00:00:00Z').getTime(); }
  const EXT = [['2022-04-06', 'DALL·E 2 announced'], ['2022-08-22', 'Stable Diffusion released'], ['2022-09-29', 'LD51 welcome post: first LD statement on AI'], ['2022-11-30', 'ChatGPT released'], ['2023-03-14', 'GPT-4 released'], ['2024-03-21', 'Suno v3 released'], ['2024-11-21', 'itch.io adds an AI disclosure field'], ['2025-02-02', '"Vibe coding" coined'], ['2025-05-22', 'Claude Code generally available'], ['2026-04-17', 'LD announces it will end after LD64 (2028)']].map(([d, l]) => ({ t: day(d), d, l }));
  const ERA = [['LD50–52', day('2022-03-01'), day('2023-03-03'), TAB10[0]], ['LD53–54', day('2023-03-03'), day('2024-01-05'), TAB10[2]], ['LD55–58', day('2024-01-05'), day('2026-01-10'), TAB10[4]], ['LD59–60', day('2026-01-10'), day('2026-11-30'), TAB10[3]]];
  const ctl = root.appendChild(h('div', 'ctl')), fig = root.appendChild(h('div', 'fig'));
  function draw() {
    fig.innerHTML = '';
    const lm = 48, rm = 48, tm = st.ev ? 64 : 34, bm = 34, H = 360, iw = W - lm - rm, ih = H - tm - bm, t0 = day('2022-03-01'), t1 = day('2026-11-30');
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'AI comments per 1,000 and AI posts per 100, LD50 to LD60' }, fig);
    const sx = t => lm + (t - t0) / (t1 - t0) * iw;
    const S = { c: { name: 'Comments mentioning AI', col: TAB10[0], v: e => st.mode === 'rate' ? e.aic / e.com * 1000 : e.aic, unit: st.mode === 'rate' ? 'per 1,000 comments' : 'comments', side: 'left' },
      p: { name: 'Posts mentioning AI', col: TAB10[1], v: e => st.mode === 'rate' ? e.aip / e.posts * 100 : e.aip, unit: st.mode === 'rate' ? '% of posts' : 'posts', side: 'right' } };
    const keys = st.show === 'both' ? ['c', 'p'] : [st.show];
    if (st.era) ERA.forEach(([l, a, b, c]) => { el('rect', { x: sx(a), y: tm, width: sx(b) - sx(a), height: ih, fill: c, 'fill-opacity': 0.07 }, svg); txt(svg, (sx(a) + sx(b)) / 2, tm + 16, l, { 'text-anchor': 'middle', 'font-size': 12, style: `fill:${c}` }); });
    const axis = k => { const m = S[k], mx = Math.max(...E.map(m.v)) * 1.22, ticks = niceTicks(0, mx, 5), sy = v => tm + ih - v / mx * ih; return { m, ticks, sy }; };
    const A = Object.fromEntries(keys.map(k => [k, axis(k)]));
    A[keys[0]].ticks.forEach(t => el('line', { x1: lm, x2: W - rm, y1: A[keys[0]].sy(t), y2: A[keys[0]].sy(t), class: 'grid' }, svg));
    keys.forEach(k => { const a = A[k], left = keys.length === 1 || a.m.side === 'left';
      a.ticks.forEach(t => txt(svg, left ? lm - 6 : W - rm + 6, a.sy(t) + 4, fmtNum(t), { 'text-anchor': left ? 'end' : 'start', 'font-size': 12, style: `fill:${a.m.col}` }));
      txt(svg, left ? 0 : W, 12, a.m.name + ' (' + a.m.unit + ')', { 'text-anchor': left ? 'start' : 'end', 'font-size': 12.5, style: `fill:${a.m.col}` }); });
    [2023, 2024, 2025, 2026].forEach(y => { const x = sx(day(y + '-01-01')); el('line', { x1: x, x2: x, y1: tm + ih, y2: tm + ih + 5, class: 'axis' }, svg); txt(svg, x, tm + ih + 20, y, { 'text-anchor': 'middle', class: 't2', 'font-size': 12 }); });
    el('line', { x1: lm, x2: W - rm, y1: tm + ih, y2: tm + ih, class: 'axis' }, svg);
    if (st.ev) { const last = [-99, -99];
      EXT.forEach((e, i) => { const x = sx(e.t), row = x - last[0] >= 19 ? 0 : 1; last[row] = x; if (row === 0) last[1] = Math.max(last[1], -99);
        const cy = tm - 14 - row * 18;
        el('line', { x1: x, x2: x, y1: cy + 8, y2: tm + ih, class: 'axis', 'stroke-dasharray': '2 3' }, svg);
        const g = el('g', { class: 'evt' }, svg); el('circle', { cx: x, cy, r: 8, class: 'evc' }, g); txt(g, x, cy + 4, i + 1, { 'text-anchor': 'middle', 'font-size': 10.5 });
        hov(g, `<b>${e.d}</b><br>${esc(e.l)}`); }); }
    keys.forEach(k => { const a = A[k], m = a.m;
      el('path', { d: E.map((e, i) => (i ? 'L' : 'M') + sx(e.t) + ',' + a.sy(m.v(e))).join(''), fill: 'none', stroke: m.col, 'stroke-width': 2.2 }, svg);
      E.forEach(e => { const x = sx(e.t), y = a.sy(m.v(e)), last = e.ld === 60;
        const c = el('circle', { cx: x, cy: y, r: 5, fill: last ? 'var(--ldai-bg)' : m.col, stroke: m.col, 'stroke-width': 2 }, svg);
        if (k === keys[0]) txt(svg, x, y - 10, 'LD' + e.ld, { 'text-anchor': 'middle', 'font-size': 11.5 });
        hov(c, `<b>LD${e.ld}: ${esc(e.theme)}</b><br>Started ${e.date}<br>Comments mentioning AI: ${e.aic} of ${e.com.toLocaleString('en')} (${(e.aic / e.com * 1000).toFixed(1)} per 1,000)<br>Posts mentioning AI: ${e.aip} of ${e.posts.toLocaleString('en')} (${(e.aip / e.posts * 100).toFixed(1)}%)<br><span class="dim">${esc(e.note)}</span>`); }); });
  }
  buttons(ctl, 'Show', [['both', 'Both'], ['c', 'Comments'], ['p', 'Posts']], st, 'show', draw);
  buttons(ctl, 'Scale', [['rate', 'Rate'], ['count', 'Count']], st, 'mode', draw);
  checks(ctl, [['era', 'Colour periods'], ['ev', 'External events']], st, draw);
  return draw;
};

/* What "AI" refers to */
FIG.referent = function (root, D) {
  const st = { mode: 'share' };
  const ctl = root.appendChild(h('div', 'ctl')), lg = root.appendChild(h('div', 'legend')), fig = root.appendChild(h('div', 'fig'));
  legend(lg, REF);
  function draw() { stacked(fig, EVENTS.map(g => { const n = {}; D.CM.filter(g.test).forEach(c => n[c.ref] = (n[c.ref] || 0) + 1); return { lab: g.lab, n }; }), REF, { mode: st.mode }); }
  buttons(ctl, 'Show', [['share', 'Share'], ['count', 'Count']], st, 'mode', draw);
  return draw;
};

/* Which uses get talked about */
FIG.usemix = function (root, D) {
  const tw = root.appendChild(h('div', 'tw')), table = tw.appendChild(h('table', 'heat'));
  function draw() {
    const base = D.CM.filter(c => c.ref === 'P' || c.ref === 'R'), nG = EVENTS.map(g => base.filter(g.test).length);
    heat(table, USES.map(u => ({ key: u[0], lab: u[1] })).concat([{ key: '?', lab: 'Not specified' }]), EVENTS.map((g, i) => ({ key: g.key, lab: g.lab, sub: 'n = ' + nG[i], i })), (r, c) => {
      const s = base.filter(EVENTS[c.i].test), k = s.filter(x => x.uses.includes(r.key)).length; if (!s.length) return { text: '–' };
      return { text: pct(k / s.length), tip: `${k} of ${s.length}`, color: vir(Math.min(1, k / s.length / 0.7)) }; });
  }
  return draw;
};

/* filters used by the two figures that the old page shared */
function refDivControls(ctl, F, redraw) {
  buttons(ctl, '"AI" means', REF.slice(0, 3).map(r => [r[0], r[1]]), F, 'refs', redraw, true);
  buttons(ctl, 'Division', [['all', 'All'], ['compo', 'Compo'], ['jam', 'Jam']], F, 'div', redraw);
}
const selFrom = (D, F) => D.CM.filter(c => F.refs.includes(c.ref) && (F.div === 'all' || c.div === F.div));

/* How comments judge the AI use */
FIG.evalmix = function (root, D) {
  const F = { refs: ['P', 'R', 'K'], div: 'all', mode: 'share' };
  const ctl = root.appendChild(h('div', 'ctl')), lg = root.appendChild(h('div', 'legend')), fig = root.appendChild(h('div', 'fig')), nline = root.appendChild(h('p', 'flag'));
  legend(lg, EVAL);
  function draw() { const S = selFrom(D, F);
    stacked(fig, EVENTS.map(g => { const n = {}; S.filter(g.test).forEach(c => n[c.ev] = (n[c.ev] || 0) + 1); return { lab: g.lab, n }; }), EVAL, { mode: F.mode });
    nline.textContent = S.length + ' comments selected'; }
  refDivControls(ctl, F, draw);
  buttons(ctl, 'Show', [['share', 'Share'], ['count', 'Count']], F, 'mode', draw);
  return draw;
};

/* What comments do (click a cell to read the comments behind it, right below the table) */
FIG.acts = function (root, D) {
  const F = { refs: ['P', 'R', 'K'], div: 'all', minN: '15', rare: false };
  let active = null, page = 0; const PER = 8;
  const ctl = root.appendChild(h('div', 'ctl')), tw = root.appendChild(h('div', 'tw')), table = tw.appendChild(h('table', 'heat'));
  const hint = root.appendChild(h('p', 'flag', 'Click a cell to read the comments behind it; click a row label for all events.'));
  const panel = root.appendChild(h('div', 'panel')); panel.hidden = true;
  function drawPanel() {
    if (!active) { panel.hidden = true; panel.innerHTML = ''; return; }
    const act = ACTS.find(a => a[0] === active.r), ev = active.c && EVENTS.find(g => g.key === active.c);
    const S = selFrom(D, F).filter(c => c.acts.includes(active.r) && (!ev || ev.test(c))).sort((a, b) => b.ld - a.ld || b.id - a.id);
    const np = Math.max(1, Math.ceil(S.length / PER)); page = Math.min(Math.max(0, page), np - 1);
    panel.hidden = false;
    panel.innerHTML = `<div class="phead"><span><b>${esc(act[1])}</b>, ${ev ? esc(ev.lab) : 'all events'}: ${S.length} comment${S.length === 1 ? '' : 's'}</span><button type="button" class="bt x">Close</button></div>` +
      (S.length ? '<ul class="clist">' + S.slice(page * PER, page * PER + PER).map(c => `<li><span class="meta">LD${c.ld}<span class="chip" style="background:${ECOL[c.ev]}"></span>${esc(EVL[c.ev])}</span><span class="q">${esc(c.L)}<mark>${esc(c.K)}</mark>${esc(c.R)}</span><a href="https://ldjam.com${esc(c.path)}" target="_blank" rel="noopener">${esc(c.game || 'game page')}</a></li>`).join('') + '</ul>' : '<p class="dim">No comments in this cell.</p>') +
      (np > 1 ? `<div class="pager"><button type="button" class="bt pv"${page === 0 ? ' disabled' : ''}>Prev</button><span>page ${page + 1} of ${np}</span><button type="button" class="bt nx"${page >= np - 1 ? ' disabled' : ''}>Next</button></div>` : '');
    panel.querySelector('.x').addEventListener('click', () => { active = null; draw(); });
    const pv = panel.querySelector('.pv'), nx = panel.querySelector('.nx');
    if (pv) pv.addEventListener('click', () => { page--; drawPanel(); });
    if (nx) nx.addEventListener('click', () => { page++; drawPanel(); });
  }
  function draw() {
    const S = selFrom(D, F), nG = EVENTS.map(g => S.filter(g.test).length), minN = +F.minN;
    const share = (k, g) => { const s = S.filter(g.test); return [s.filter(c => c.acts.includes(k)).length, s.length]; };
    const tot = k => S.filter(c => c.acts.includes(k)).length / Math.max(1, S.length);
    const rows = ACTS.filter(a => F.rare || tot(a[0]) >= 0.03).map(a => ({ key: a[0], lab: a[1] }));
    const rowMax = {}; rows.forEach(r => rowMax[r.key] = Math.max(1e-9, ...EVENTS.map((g, i) => nG[i] >= minN ? share(r.key, g)[0] / Math.max(1, nG[i]) : 0)));
    heat(table, rows, EVENTS.map((g, i) => ({ key: g.key, lab: g.lab, sub: 'n = ' + nG[i], i })), (r, c) => {
      const [k, n] = share(r.key, EVENTS[c.i]); if (!n) return { text: '–' }; const v = k / n;
      return { text: pct(v), n: k, tip: `${k} of ${n}`, color: n < minN ? null : vir(v / rowMax[r.key]) }; },
      { tall: true, onCell: (r, c) => { const key = c ? c.key : null; active = active && active.r === r.key && active.c === key ? null : { r: r.key, c: key }; page = 0; draw(); }, active });
    if (active && !rows.find(r => r.key === active.r)) active = null;
    drawPanel();
  }
  refDivControls(ctl, F, () => { page = 0; draw(); });
  buttons(ctl, 'Min. sample', [['5', '5'], ['15', '15'], ['30', '30']], F, 'minN', draw);
  checks(ctl, [['rare', 'Show rare acts (under 3% overall)']], F, draw);
  return draw;
};

/* Criticism by kind of use */
FIG.byuse = function (root, D) {
  const st = { ref: 'P', mk: false };
  const ctl = root.appendChild(h('div', 'ctl')), tw = root.appendChild(h('div', 'tw')), table = tw.appendChild(h('table', 'heat'));
  function draw() {
    const isNeg = c => NEG(c) || (st.mk && c.ev === 'MK'), isDir = c => DIR(c) || (st.mk && c.ev === 'MK');
    const base = D.CM.filter(c => c.ref === st.ref && isDir(c));
    const rows = [{ key: '*', lab: 'All uses' }].concat(USES.map(u => ({ key: u[0], lab: u[1] })));
    heat(table, rows, EVENTS.map((g, i) => ({ key: g.key, lab: g.lab, i })), (r, c) => {
      const s = base.filter(EVENTS[c.i].test).filter(x => r.key === '*' || x.uses.includes(r.key)), k = s.filter(isNeg).length, n = s.length;
      if (!n) return { text: '–' }; if (n < 5) return { text: `${k}/${n}`, tip: 'fewer than 5 comments' };
      return { text: `${pct(k / n)}<br><span class="sub">${k}/${n}</span>`, tip: `${k} critical of ${n}`, color: crit(k / n) }; }, { tall: true });
  }
  buttons(ctl, '"AI" means', [['P', 'Using AI to make the game'], ['R', 'AI running inside the game']], st, 'ref', draw);
  checks(ctl, [['mk', 'Count "points out AI" as criticism']], st, draw);
  return draw;
};

/* LD59 / LD60 game-level data */
function games(D) {
  if (D.G59) return;
  D.G59 = D.ld59.map(r => ({ id: r[0], div: r[1], grp: r[2], tags: r[3], title: r[4], rank: r[5], got: r[6], given: r[7], com: r[8], outs: r[9], lc: r[10], lmed: r[11], lmean: r[12], lai: r[13], s: Object.fromEntries(D.cats.map((c, i) => [c, r[14 + i]])) }));
  D.G59.forEach(g => { g.cpr = g.got ? g.com / g.got : null; g.aish = g.lc ? g.lai / g.lc : null; });
  D.G60 = D.ld60.map(r => ({ id: r[0], div: r[1], ai: r[2], title: r[3], outs: r[4], got: r[5], given: r[6], lc: r[7], lmed: r[8], lmean: r[9], lai: r[10] }));
  D.G60.forEach(g => { g.com = g.lc; g.cpr = g.got && g.lc != null ? g.lc / g.got : null; g.aish = g.lc ? g.lai / g.lc : null; });
}
const GRP59 = [['none', 'AI not used', TAB10[0]], ['code', 'AI: code only', TAB10[1]], ['assets', 'AI: art / audio / text', TAB10[3]], ['blank', 'Declaration left blank', TAB10[7]], ['noitch', 'Not on itch.io', TAB10[8]]];
const GRP60 = [['no-ai', 'AI not used', TAB10[0]], ['ai', 'AI used', TAB10[3]], ['undeclared', 'Declaration left blank', TAB10[7]], ['none', 'Not on itch.io', TAB10[8]]];

/* Comments on games, by declaration */
FIG.talk = function (root, D) {
  games(D);
  const tw = root.appendChild(h('div', 'tw')), table = tw.appendChild(h('table', 'plain'));
  if (!D.has_len) { table.innerHTML = '<tbody><tr><td class="dim">Comment-length data not loaded.</td></tr></tbody>'; return () => {}; }
  const G59 = D.G59, G60 = D.G60;
  const rows = [['LD59', 'AI not used', G59.filter(g => g.grp === 'none'), TAB10[0]], ['LD59', 'AI: code only', G59.filter(g => g.grp === 'code'), TAB10[1]], ['LD59', 'AI: art / audio / text', G59.filter(g => g.grp === 'assets'), TAB10[3]],
    ['LD60', 'AI not used', G60.filter(g => g.ai === 'no-ai'), TAB10[0]], ['LD60', 'AI used', G60.filter(g => g.ai === 'ai'), TAB10[3]]].map(r => [r[0], r[1], r[2].filter(g => g.lc > 0), r[3]]);
  const M = [['Comments per rating', a => median(a.map(g => g.cpr)), 1.2, v => v.toFixed(2)], ['Median length (chars)', a => median(a.map(g => g.lmed)), 220, v => Math.round(v)],
    ['Comments mentioning AI', a => a.reduce((s, g) => s + g.lai, 0) / a.reduce((s, g) => s + g.lc, 0), 0.06, v => pct(v, 1)], ['Games with an AI comment', a => a.filter(g => g.lai > 0).length / a.length, 0.5, v => pct(v)]];
  table.innerHTML = '<thead><tr><th>Event</th><th>Declaration</th><th class="r">Games</th>' + M.map(m => `<th>${m[0]}</th>`).join('') + '</tr></thead><tbody>' +
    rows.map(([ev, lab, a, c], i) => `<tr${i === 3 ? ' class="sep"' : ''}><td>${ev}</td><td>${lab}</td><td class="r">${a.length}</td>` + M.map(m => { const v = m[1](a); return `<td><span class="barbox"><i style="width:${Math.min(100, v / m[2] * 100)}%;background:${c}"></i></span>${m[3](v)}</td>`; }).join('') + '</tr>').join('') + '</tbody>';
  return () => {};
};

/* Declared AI use and how games did */
FIG.strip = function (root, D) {
  games(D);
  const METRIC = [['overall', 'Overall'], ['fun', 'Fun'], ['innovation', 'Innovation'], ['theme', 'Theme'], ['graphics', 'Graphics'], ['audio', 'Audio'], ['humor', 'Humor'], ['mood', 'Mood'],
    ['got', 'Ratings received'], ['given', 'Ratings given'], ['com', 'Comments received'], ['cpr', 'Comments per rating']].concat(D.has_len ? [['lmed', 'Median comment length'], ['aish', 'Share of comments mentioning AI']] : []);
  const SCORE = new Set(D.cats);
  const mval = (g, m) => SCORE.has(m) ? (g.s ? g.s[m] : null) : g[m];
  const MRANGE = { got: [0, 120, 1, 300], given: [0, 120, 1, 300], com: [0, 100, 1, 200], cpr: [0, 2, 0.1, 3], lmed: [0, 500, 10, 1000], aish: [0, 0.3, 0.005, 1] };
  const st = { ev: '59', m: 'overall', div: 'all', ov: 'median', det: false, log: false };
  const ctl = root.appendChild(h('div', 'ctl')), fig = root.appendChild(h('div', 'fig'));
  let mrow;
  function draw() {
    const isScore = SCORE.has(st.m);
    if (st.ev === '60' && isScore) { st.m = 'got'; mrow.querySelectorAll('.bt').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.m)); }
    mrow.querySelectorAll('.bt').forEach(b => { b.disabled = st.ev === '60' && SCORE.has(b.dataset.v); });
    const pool = (st.ev === '59' ? D.G59 : D.G60).filter(g => st.div === 'all' || g.div === st.div);
    let defs;
    if (st.ev === '59') {
      if (st.det) { const combos = {}; pool.filter(g => g.grp === 'code' || g.grp === 'assets').forEach(g => { (combos[g.tags] = combos[g.tags] || []).push(g); });
        defs = [['none', 'AI not used', TAB10[0], pool.filter(g => g.grp === 'none')]].concat(Object.entries(combos).sort((a, b) => b[1].length - a[1].length).map(([t, a], i) => [t, 'AI: ' + t.split(',').join(' + '), TAB10[[1, 3, 4, 5, 6, 9, 2, 8][i % 8]], a]));
      } else defs = GRP59.map(([k, l, c]) => [k, l, c, pool.filter(g => g.grp === k)]);
    } else defs = GRP60.map(([k, l, c]) => [k, l, c, pool.filter(g => g.ai === k)]);
    const R = MRANGE[st.m] || [1, 5], lg = st.log && !isScore, isS = SCORE.has(st.m);
    const label = (METRIC.find(x => x[0] === st.m) || [0, ''])[1];
    const show = v => v == null ? '–' : (st.m === 'aish' || st.m === 'cpr' ? (+v).toFixed(2) : fmtNum(v));
    strip(fig, defs.map(([k, l, c, a]) => ({ lab: l, color: c, vals: a.map(g => ({ v: mval(g, st.m), tip: `<b>${esc(g.title)}</b>${g.rank ? '<br>Rank: ' + g.rank : ''}<br>${esc(label)}: ${show(mval(g, st.m))}${g.tags ? '<br>itch.io tags: ' + esc(g.tags.split(',').join(', ')) : ''}` })) })),
      { lo: isS ? 1 : (lg ? R[2] : R[0]), hi: isS ? 5 : (lg ? R[3] : R[1]), log: lg, overlay: st.ov, fmt: v => (isS || st.m === 'cpr' || st.m === 'aish') ? v.toFixed(2) : fmtNum(v), xlab: label + (lg ? ' (log scale)' : (isS ? '' : ' (values beyond the axis are drawn at the edge)')), lw: Math.min(210, Math.round(W * 0.3)) });
  }
  buttons(ctl, 'Event', [['59', 'LD59 (Apr 2026)'], ['60', 'LD60 (Oct 2026)']], st, 'ev', draw);
  mrow = buttons(ctl, 'Metric', METRIC.map(m => [m[0], m[1]]), st, 'm', draw);
  buttons(ctl, 'Division', [['all', 'All'], ['c', 'Compo'], ['j', 'Jam']], st, 'div', draw);
  buttons(ctl, 'Overlay', [['none', 'None'], ['median', 'Median'], ['box', 'Box']], st, 'ov', draw);
  checks(ctl, [['det', 'Detailed AI categories (LD59)'], ['log', 'Log scale for counts']], st, draw);
  return draw;
};

/* ---------- boot ---------- */
function mount(root, D) {
  const make = FIG[root.dataset.ldai]; if (!make) return;
  root.innerHTML = ''; root.classList.add('ready');
  const draw = make(root, D);
  let lastW = 0;
  const redraw = () => { const w = Math.max(420, Math.floor(root.clientWidth)); W = w; lastW = w; hideTip(); draw(); };
  redraw();
  // redraw wrapped so W is set for this root before every draw triggered by a control
  root.addEventListener('click', () => { W = lastW; }, true);
  root.addEventListener('change', () => { W = lastW; }, true);
  if ('ResizeObserver' in window) { let raf = 0; new ResizeObserver(() => { const w = Math.max(420, Math.floor(root.clientWidth)); if (w === lastW) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(redraw); }).observe(root); }
}

fetch(SRC).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(D => {
  D.CM = D.comments.map(r => ({ id: r[0], ld: r[1], ref: r[2], ev: r[3], acts: r[4], uses: r[5], div: r[6], path: r[7], game: r[8], L: r[9], K: r[10], R: r[11] }));
  ROOTS.forEach(root => { try { mount(root, D); } catch (e) { console.error('[ldai]', root.dataset.ldai, e); root.innerHTML = '<p class="flag">This figure failed to load.</p>'; } });
  // figures change the page height once drawn; land on #fig-n again if the URL points at one
  if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) requestAnimationFrame(() => t.scrollIntoView()); }
}).catch(e => { console.error('[ldai] data', e); ROOTS.forEach(r => { r.innerHTML = '<p class="flag">图表数据加载失败（' + esc(String(e.message || e)) + '）。</p>'; }); });
})();
