(function () {
'use strict';

const script = document.currentScript;
const SRC = (script && script.dataset.src) || '/assets/ld-ai/ldai-full-data.json';

/* inner skeleton of each component; the post only carries the empty shell */
const SKEL = {
  events: '<div class="tw"><table data-ldf="t-events"></table></div>',
  attention: '<div class="ctl"></div><div class="fig"></div>',
  referent: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div>',
  shared: '<div class="ctl"></div><p class="flag" data-ldf="shared-n"></p>',
  evalmix: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div>',
  trend: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div>',
  acts: '<div class="ctl"></div><div class="tw"><table class="heat" data-ldf="t-acts"></table></div>',
  byuse: '<div class="ctl"></div><div class="tw"><table class="heat" data-ldf="t-byuse"></table></div>',
  usemix: '<div class="ctl"></div><div class="tw"><table class="heat" data-ldf="t-usemix"></table></div>',
  strip: '<div class="ctl"></div><div class="fig"></div>',
  talk: '<div class="tw"><table data-ldf="t-talk"></table></div>',
  scatter: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div><div class="tw"><table data-ldf="t-scmed"></table></div>',
  optout: '<div class="ctl"></div><div class="fig"></div>',
  decl: '<div class="fig"></div>',
  poll: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div>',
  vocab: '<div class="ctl"></div><div class="tw"><table class="heat" data-ldf="t-vocab"></table></div>',
  hearts: '<div class="ctl"></div><div class="fig"></div>',
  mscore: '<div class="ctl"></div><div class="fig"></div>' +
    '<div class="panel" data-ldf="mdetail"><span class="dim">Click a dot in the chart above.</span></div>' +
    '<p class="sub-h">Agreement with manual coding</p><div class="tw"><table data-ldf="t-agree"></table></div>' +
    '<p class="sub-h">Confusion table for the selected method</p><div class="tw"><table data-ldf="t-conf"></table></div>',
  mtrend: '<div class="ctl"></div><div class="legend"></div><div class="fig"></div>' +
    '<p class="sub-h">Politeness features in critical comments</p><div class="ctl" data-ldf="polctl"></div>' +
    '<div class="tw"><table class="heat" data-ldf="t-pol"></table></div>',
  conc: '<div class="ctl"></div><p class="flag" data-ldf="conc-flag"></p><div class="tw"><table class="conc" data-ldf="t-conc"></table></div>' +
    '<div class="pager"><button type="button" class="bt" data-ldf="pg-prev">Prev</button><span data-ldf="pg-info"></span><button type="button" class="bt" data-ldf="pg-next">Next</button></div>',
  posts: '<div class="ctl"></div><div class="tw"><table data-ldf="t-posts"></table></div>' +
    '<div class="pager"><button type="button" class="bt" data-ldf="pp-prev">Prev</button><span data-ldf="pp-info"></span><button type="button" class="bt" data-ldf="pp-next">Next</button></div>'
};
const ALL = Object.keys(SKEL);

/* one tooltip for the whole page */
let TIP = null;
function getTip() {
  if (!TIP) { TIP = document.createElement('div'); TIP.className = 'ldf-tip'; TIP.hidden = true; TIP.setAttribute('role', 'tooltip'); document.body.appendChild(TIP);
    addEventListener('scroll', () => { TIP.hidden = true; }, { passive: true }); }
  return TIP;
}

/* group the placeholders by language panel (or the whole document) */
const holders = Array.from(document.querySelectorAll('.ldf[data-ldf]'));
if (!holders.length) return;
const roots = [];
holders.forEach(n => { const r = n.closest('[data-lang-panel]') || document.body; if (!roots.includes(r)) roots.push(r); });

function init(root, D) {
  /* fill skeletons; a component missing from this panel gets a detached stand-in so the code below still runs */
  const bin = document.createElement('div');
  ALL.forEach(k => {
    let node = root.querySelector('.ldf[data-ldf="' + k + '"]');
    if (!node) { node = document.createElement('div'); node.className = 'ldf'; node.dataset.ldf = k; bin.appendChild(node); }
    node.innerHTML = SKEL[k]; node.classList.add('ready');
  });
  root.appendChild(bin); bin.hidden = true; bin.className = 'ldf-bin';

const $ = (s, r) => (r||root).querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at||{}) if (at[k] != null) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
const txt = (p, x, y, s, at) => { const t = el('text', Object.assign({x, y}, at||{}), p); t.textContent = s; return t; };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pct = (v, d) => (v*100).toFixed(d||0) + '%';
function wilson(k, n){ if(!n) return [NaN,NaN,NaN]; const z=1.96, p=k/n, d=1+z*z/n, c=p+z*z/(2*n), h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return [p,Math.max(0,(c-h)/d),Math.min(1,(c+h)/d)]; }
function median(a){ const s = a.filter(v => v!=null && !isNaN(v)).sort((x,y)=>x-y), n = s.length; return n ? (n%2 ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2) : NaN; }
function quant(a, q){ const s = a.filter(v => v!=null && !isNaN(v)).sort((x,y)=>x-y); if(!s.length) return NaN; const i=(s.length-1)*q, lo=Math.floor(i), hi=Math.ceil(i); return s[lo]+(s[hi]-s[lo])*(i-lo); }
const tip = getTip();
function showTip(ev, html){ tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth, h = tip.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = ev.clientY - h - 14; tip.style.left = Math.max(4,x) + 'px'; tip.style.top = Math.max(4,y) + 'px'; }
function hideTip(){ tip.hidden = true; }
const hov = (node, html) => { node.addEventListener('mousemove', ev => showTip(ev, typeof html === 'function' ? html() : html)); node.addEventListener('mouseleave', hideTip); };

/* ---------- palettes ---------- */
const TAB10 = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
const VIR = ['#440154','#482878','#3e4989','#31688e','#26828e','#1f9e89','#35b779','#6ece58','#b5de2b','#fde725'];
const RDBU = ['#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac']; // red (0) → blue (1)
const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
function ramp(stops, t){ t = Math.max(0, Math.min(1, t)); const x = t*(stops.length-1), i = Math.min(Math.floor(x), stops.length-2), f = x-i, a = hex(stops[i]), b = hex(stops[i+1]); return 'rgb(' + a.map((v,j) => Math.round(v+(b[j]-v)*f)).join(',') + ')'; }
const lum = c => { const m = c.match(/\d+/g).map(Number); return (0.299*m[0]+0.587*m[1]+0.114*m[2])/255; };
const vir = t => ramp(VIR, t);
const crit = t => ramp(RDBU, 1-t);  // 0 = blue (no criticism) → 1 = red

/* ---------- vocabularies ---------- */
const PERIODS = [{k:'p1', lab:'LD50–52', sub:'Apr 2022 – Jan 2023', lds:[50,51,52]},{k:'p2', lab:'LD53–54', sub:'2023', lds:[53,54]},{k:'p3', lab:'LD55–58', sub:'2024 – 2025', lds:[55,56,57,58]},{k:'p4', lab:'LD59–60', sub:'2026', lds:[59,60]}];
const LDS = [50,51,52,53,54,55,56,57,58,59,60];
const REF = [['P','Using AI to make the game',TAB10[0]],['R','AI running inside the game',TAB10[1]],['K','AI-written comments or posts',TAB10[4]],['T','AI as the theme of the game',TAB10[2]],['G','Opponent / NPC behaviour AI',TAB10[7]],['O','Other or unrelated','#c7c7c7']];
const EVAL = [['E+','Praise','#2166ac'],['C+','Praise with a concession','#67a9cf'],['MX','Mixed','#c6dbef'],['0','No judgement','#e6e6e6'],['MK','Points out AI, no judgement','#a3a3a3'],['H-','Softened criticism','#f4a582'],['E-','Direct criticism','#b2182b']];
const EVL = Object.fromEntries(EVAL.map(e => [e[0], e[1]]));
const ACTS = [['e','Judges the work'],['n','Cites a rule or norm'],['s','Penalises (won\'t rate, lowers a score)'],['b','Praises not using AI'],['t','Thanks for disclosing or opting out'],['a','Asks or guesses whether AI was used'],['m','Points out AI traces'],['x','Says AI was used and not admitted'],['v','Suggests an AI tool'],['c','Asks how the AI was used']];
const USES = [['A','Art'],['U','Music and sound'],['V','Voice'],['T','Writing'],['C','Code'],['P','Store page / cover'],['W','The whole game']];
const POS = c => c.ev==='E+'||c.ev==='C+', NEG = c => c.ev==='H-'||c.ev==='E-', DIR = c => POS(c)||NEG(c);

const CM = D.comments.map(r => ({id:r[0], ld:r[1], ref:r[2], ev:r[3], acts:r[4], uses:r[5], love:r[6], div:r[7], path:r[8], game:r[9], L:r[10], K:r[11], R:r[12], tgt:r[13],
  vf:r[14], vt:r[15], tf:r[16], tt:r[17], rob:r[18], nli:r[19], pol:r[20], len:r[21]}));
const periodOf = ld => PERIODS.find(p => p.lds.includes(ld));

/* ---------- controls ---------- */
const redrawers = {};
function buttons(ctl, label, opts, st, key, redraw, multi){
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = `<span class="lab">${esc(label)}</span>`;
  opts.forEach(([v, l, t]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'bt'; b.textContent = l; if (t) b.title = t; b.dataset.v = v;
    const on = () => multi ? st[key].includes(v) : st[key] === v;
    b.setAttribute('aria-pressed', on());
    b.addEventListener('click', () => {
      if (multi){ const i = st[key].indexOf(v); if (i >= 0){ if (st[key].length > 1) st[key].splice(i,1); } else st[key].push(v); }
      else st[key] = v;
      row.querySelectorAll('.bt').forEach(x => x.setAttribute('aria-pressed', multi ? st[key].includes(x.dataset.v) : st[key] === x.dataset.v));
      redraw();
    });
    row.appendChild(b); });
  ctl.appendChild(row); return row;
}
function checks(ctl, label, items, st, redraw){
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = label ? `<span class="lab">${esc(label)}</span>` : '<span class="lab"></span>';
  items.forEach(([key, l, id]) => { const lab = document.createElement('label'); lab.className = 'ck';
    lab.innerHTML = `<input type="checkbox" data-ldf="${id}"${st[key]?' checked':''}> ${esc(l)}`;
    lab.querySelector('input').addEventListener('change', e => { st[key] = e.target.checked; redraw(); }); row.appendChild(lab); });
  ctl.appendChild(row); return row;
}
function legend(box, items, onToggle, offSet){
  box.innerHTML = items.map(([k, l, c]) => `<span class="${onToggle?'tg':''}${offSet&&offSet.has(k)?' off':''}" data-k="${esc(k)}"><i style="background:${c}"></i>${esc(l)}</span>`).join('');
  if (onToggle) box.querySelectorAll('[data-k]').forEach(s => s.addEventListener('click', () => onToggle(s.dataset.k)));
}

/* ---------- chart primitives ---------- */
const W = Math.round(Math.max(640, Math.min(860, root.clientWidth || 760)));
function niceTicks(lo, hi, n){ const span = hi-lo || 1, step0 = span/(n||5), mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0/mag, step = (r<1.5?1:r<3?2:r<7?5:10)*mag; const t=[]; for (let v = Math.ceil(lo/step)*step; v <= hi+1e-9; v += step) t.push(+v.toFixed(10)); return t; }
function logTicks(lo, hi){ const t=[]; for (let e = Math.floor(Math.log10(Math.max(lo,1e-9))); e <= Math.ceil(Math.log10(hi)); e++) [1,2,5].forEach(m => { const v = m*Math.pow(10,e); if (v >= lo-1e-9 && v <= hi+1e-9) t.push(v); }); return t; }
function fmtNum(v){ return Math.abs(v) >= 1000 ? (v/1000).toFixed(v%1000?1:0)+'k' : (Math.abs(v) < 1 && v !== 0 ? (+v.toFixed(2)).toString() : (+v.toFixed(2)).toString()); }

function stacked(fig, rows, cats, o){
  o = o||{}; const lw = o.lw || 150, rh = o.rh || 28, gap = o.gap || 12, top = 4, H = top + rows.length*(rh+gap) + 4;
  fig.innerHTML = ''; const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img', 'aria-label': o.aria || ''}, fig);
  const tots = rows.map(r => cats.reduce((s,c) => s + (r.n[c[0]]||0), 0)), maxT = Math.max(1, ...tots), bw = W - lw - 60;
  rows.forEach((r, i) => { const y = top + i*(rh+gap), tot = tots[i];
    txt(svg, 0, y + (r.sub ? rh/2-2 : rh/2+4), r.lab);
    if (r.sub) txt(svg, 0, y+rh/2+12, r.sub, {class:'t2', 'font-size':11});
    txt(svg, W, y+rh/2+4, 'n = ' + tot, {'text-anchor':'end', class:'t2', 'font-size':12});
    let x = lw; const scale = o.mode === 'count' ? bw/maxT : (tot ? bw/tot : 0);
    cats.forEach(([k, l, c]) => { const v = r.n[k]||0; if (!v) return; const w = v*scale;
      const rect = el('rect', {x, y, width: Math.max(w-1, .6), height: rh, fill: c, style: o.onClick ? 'cursor:pointer' : null}, svg);
      if (w > 30) txt(svg, x+w/2, y+rh/2+4, o.mode === 'count' ? v : pct(v/tot), {'text-anchor':'middle', 'font-size':12, style:`fill:${lum(ramp([c,c],0))>0.55?'#1a1a1a':'#ffffff'}`, 'pointer-events':'none'});
      hov(rect, `<b>${esc(r.lab)}</b><br>${esc(l)}: ${v} of ${tot} (${pct(v/tot,1)})`);
      if (o.onClick) rect.addEventListener('click', () => o.onClick(r, k));
      x += w; });
  });
}

/* line chart with CI bands; xs = labels; series = [{name, color, pts:[{k,n}] or {v}}] */
function lines(fig, xs, series, o){
  o = o||{}; const lm = 54, rm = 18, tm = 14, bm = 44, H = o.h || 320, iw = W-lm-rm, ih = H-tm-bm;
  fig.innerHTML = ''; const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig);
  const xsx = i => lm + (xs.length === 1 ? iw/2 : i/(xs.length-1)*iw);
  let ymax = o.ymax; if (ymax == null){ ymax = 0; series.forEach(s => s.pts.forEach(p => { const v = p.v != null ? p.v : (p.n ? (o.band ? wilson(p.k,p.n)[2] : p.k/p.n) : 0); if (v > ymax) ymax = v; })); ymax = ymax*1.08 || 1; }
  const ymin = o.log ? Math.max(o.ymin || 0.1, 1e-6) : 0;
  const sy = v => o.log ? tm + ih - (Math.log10(Math.max(v,ymin)) - Math.log10(ymin))/(Math.log10(ymax)-Math.log10(ymin))*ih : tm + ih - v/ymax*ih;
  const ticks = o.log ? logTicks(ymin, ymax) : niceTicks(0, ymax, 5);
  ticks.forEach(t => { el('line', {x1:lm, x2:W-rm, y1:sy(t), y2:sy(t), class:'grid'}, svg); txt(svg, lm-6, sy(t)+4, o.pct ? pct(t) : fmtNum(t), {'text-anchor':'end', class:'t2', 'font-size':12}); });
  xs.forEach((x, i) => { txt(svg, xsx(i), H-bm+18, x, {'text-anchor':'middle', 'font-size':12}); });
  if (o.marks) o.marks.forEach(m => { const x = xsx(m.i); el('line', {x1:x, x2:x, y1:tm, y2:tm+ih, stroke:'var(--ldf-ink2)', 'stroke-dasharray':'3 3', 'stroke-width':1}, svg); txt(svg, x+3, tm+10, m.lab, {class:'t2','font-size':11}); });
  const minN = o.minN || 0;
  series.forEach(s => {
    const P = s.pts.map((p, i) => { if (p.v != null) return {i, v:p.v, ok:true, p}; if (!p.n) return null; const [v, lo, hi] = wilson(p.k, p.n); return {i, v, lo, hi, ok: p.n >= minN, p}; });
    if (o.band){ let seg = []; const flush = () => { if (seg.length > 1){ const d = seg.map((q,j) => `${j?'L':'M'}${xsx(q.i)},${sy(q.hi)}`).join('') + seg.slice().reverse().map(q => `L${xsx(q.i)},${sy(q.lo)}`).join('') + 'Z'; el('path', {d, fill:s.color, 'fill-opacity':0.13, stroke:'none'}, svg); } else if (seg.length === 1){ const q = seg[0]; el('line', {x1:xsx(q.i), x2:xsx(q.i), y1:sy(q.lo), y2:sy(q.hi), stroke:s.color, 'stroke-opacity':.35, 'stroke-width':6}, svg); } seg = []; };
      P.forEach(q => { if (q && q.ok && q.lo != null) seg.push(q); else flush(); }); flush(); }
    let d = '', prev = null; P.forEach(q => { if (q && q.ok){ d += (prev && prev.i === q.i-1 ? 'L' : 'M') + xsx(q.i) + ',' + sy(q.v); prev = q; } else prev = null; });
    el('path', {d, fill:'none', stroke:s.color, 'stroke-width':2, 'stroke-dasharray': s.dash || null}, svg);
    P.forEach(q => { if (!q) return; const c = el('circle', {cx:xsx(q.i), cy:sy(q.v), r: q.ok ? 4 : 3.5, fill: q.ok ? s.color : 'var(--ldf-bg)', stroke:s.color, 'stroke-width':1.5}, svg);
      hov(c, () => `<b>${esc(s.name)}</b><br>${esc(xs[q.i])}: ` + (q.p.v != null ? (o.pct ? pct(q.v,1) : fmtNum(q.v)) + (q.p.note ? '<br>'+q.p.note : '') : `${q.p.k} / ${q.p.n} = ${pct(q.v,1)}<br>95% CI ${pct(q.lo,1)} – ${pct(q.hi,1)}` + (q.ok ? '' : '<br><i>below minimum sample size</i>'))); });
  });
  if (o.ylab) txt(svg, 0, tm-2, o.ylab, {class:'t2','font-size':12});
}

/* strip plot: groups = [{lab, sub, vals:[{v, tip, id}]}] */
function strip(fig, groups, o){
  o = o||{}; const lw = o.lw || 200, mw = 62, rh = o.rh || 38, top = 22, H = top + groups.length*rh + 28, x0 = lw + mw, x1 = W - 8;
  fig.innerHTML = ''; const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig);
  const lo = o.lo, hi = o.hi, lg = o.log;
  const sx = v => { v = Math.max(lg ? Math.max(lo, 1e-9) : lo, Math.min(hi, v)); return lg ? x0 + (Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(x1-x0) : x0 + (v-lo)/(hi-lo)*(x1-x0); };
  const ticks = o.ticks || (lg ? logTicks(lo, hi) : niceTicks(lo, hi, 6));
  ticks.forEach(t => { el('line', {x1:sx(t), x2:sx(t), y1:top-4, y2:H-24, class:'grid'}, svg); txt(svg, sx(t), H-8, o.tfmt ? o.tfmt(t) : fmtNum(t), {'text-anchor':'middle', class:'t2', 'font-size':12}); });
  txt(svg, lw+4, 12, 'n', {class:'t2','font-size':12}); if (o.overlay !== 'none') txt(svg, x0-8, 12, 'median', {class:'t2','font-size':12,'text-anchor':'end'});
  let seed = 11; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
  groups.forEach((g, i) => { const y = top + i*rh, vals = g.vals.filter(v => v.v != null && !isNaN(v.v) && (!lg || v.v > 0));
    txt(svg, 0, y + rh/2 + (g.sub ? -2 : 4), g.lab); if (g.sub) txt(svg, 0, y+rh/2+12, g.sub, {class:'t2','font-size':11});
    txt(svg, lw+4, y+rh/2+4, vals.length, {class:'t2','font-size':12});
    el('rect', {x:x0, y:y+3, width:x1-x0, height:rh-6, fill:'var(--ldf-faint)'}, svg);
    const col = g.color || TAB10[0];
    vals.forEach(v => { const c = el('circle', {cx:sx(v.v), cy:y+7+rnd()*(rh-14), r: o.r || 2.2, fill: v.color || col, 'fill-opacity':.7, style: o.onDot ? 'cursor:pointer' : null}, svg); if (v.tip) hov(c, v.tip); if (o.onDot) c.addEventListener('click', () => o.onDot(v)); });
    if (!vals.length) return;
    const md = median(vals.map(v=>v.v));
    if (o.overlay === 'box'){ const q1 = quant(vals.map(v=>v.v), .25), q3 = quant(vals.map(v=>v.v), .75); el('rect', {x:sx(q1), y:y+5, width:Math.max(1, sx(q3)-sx(q1)), height:rh-10, fill:'none', stroke:'var(--ldf-ink)', 'stroke-width':1.3}, svg); }
    if (o.overlay !== 'none'){ el('line', {x1:sx(md), x2:sx(md), y1:y+3, y2:y+rh-3, stroke:'var(--ldf-ink)', 'stroke-width':2.2}, svg);
      txt(svg, x0-8, y+rh/2+4, o.fmt ? o.fmt(md) : fmtNum(md), {'text-anchor':'end', 'font-weight':'bold', style:`fill:${g.color || 'var(--ldf-ink)'}`}); }
  });
  if (o.xlab) txt(svg, x1, H+12, o.xlab, {'text-anchor':'end', class:'t2', 'font-size':12});
}

/* comment list shown under a figure; hidden until a chart element is clicked */
function commentPanel(host){
  const box = document.createElement('div'); box.className = 'panel'; box.hidden = true; host.appendChild(box);
  const PER = 8; let list = [], title = '', page = 0;
  function render(){
    const np = Math.max(1, Math.ceil(list.length/PER)); page = Math.min(Math.max(0, page), np-1);
    const ecol = Object.fromEntries(EVAL.map(e => [e[0], e[2]]));
    box.innerHTML = `<div class="phead"><span>${title}: ${list.length} comment${list.length === 1 ? '' : 's'}</span><button type="button" class="bt x">Close</button></div>` +
      (list.length ? '<ul class="clist">' + list.slice(page*PER, page*PER+PER).map(c => `<li><span class="meta">LD${c.ld}<span class="chip" style="background:${ecol[c.ev]}"></span>${esc(EVL[c.ev])}</span><span class="q">${esc(c.L)}<mark>${esc(c.K)}</mark>${esc(c.R)}</span><a href="https://ldjam.com${esc(c.path)}" target="_blank" rel="noopener">${esc(c.game || 'game page')}</a></li>`).join('') + '</ul>' : '<p class="dim">No comments here.</p>') +
      (np > 1 ? `<div class="pager"><button type="button" class="bt pv"${page === 0 ? ' disabled' : ''}>Prev</button><span>page ${page+1} of ${np}</span><button type="button" class="bt nx"${page >= np-1 ? ' disabled' : ''}>Next</button></div>` : '');
    box.querySelector('.x').addEventListener('click', hide);
    const pv = box.querySelector('.pv'), nx = box.querySelector('.nx');
    if (pv) pv.addEventListener('click', () => { page--; render(); });
    if (nx) nx.addEventListener('click', () => { page++; render(); });
  }
  function show(t, l){ title = t; list = l; page = 0; box.hidden = false; render(); }
  function hide(){ box.hidden = true; box.innerHTML = ''; list = []; if (api.onHide) api.onHide(); }
  const api = {show, hide, get open(){ return !box.hidden; }};
  return api;
}

/* heat table */
function heat(table, rows, cols, cell, o){
  o = o||{};
  let h = '<thead><tr><th></th>' + cols.map(c => `<th class="r" style="text-align:center">${esc(c.lab)}${c.sub?'<br><span style="font-size:.8em">'+esc(c.sub)+'</span>':''}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(r => { h += `<tr class="${o.onRow?'click':''}${o.active===r.key?' on':''}" data-k="${esc(r.key)}"><td>${esc(r.lab)}</td>`;
    cols.forEach((c, ci) => { const z = cell(r, c), on = o.activeCell && o.activeCell[0] === r.key && o.activeCell[1] === ci ? ' sel' : ''; if (!z || z.color == null) { h += `<td class="c dim${on}" data-ci="${ci}" title="${esc(z&&z.tip||'')}">${z ? z.text : ''}</td>`; return; }
      h += `<td class="c${on}" data-ci="${ci}" title="${esc(z.tip||'')}" style="background:${z.color};color:${lum(z.color) > .55 ? '#1a1a1a' : '#ffffff'}">${z.text}</td>`; });
    h += '</tr>'; });
  table.innerHTML = h + '</tbody>' + (o.foot ? `<tfoot><tr><td colspan="${cols.length+1}" class="dim" style="font-size:.82rem;white-space:normal">${o.foot}</td></tr></tfoot>` : '');
  if (o.onRow) table.querySelectorAll('tr.click').forEach(tr => tr.addEventListener('click', ev => { const td = ev.target.closest('td[data-ci]'); o.onRow(tr.dataset.k, td ? +td.dataset.ci : null); }));
}

/* scatter */
function scatter(fig, pts, o){
  const lm = 58, rm = 14, tm = 12, bm = 46, H = 460, iw = W-lm-rm, ih = H-tm-bm;
  fig.innerHTML = ''; const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig);
  const ok = p => p.x != null && p.y != null && !isNaN(p.x) && !isNaN(p.y) && (!o.logx || p.x > 0) && (!o.logy || p.y > 0);
  const P = pts.filter(ok); if (!P.length) return;
  const ext = (k, lg) => { let a = Math.min(...P.map(p=>p[k])), b = Math.max(...P.map(p=>p[k])); if (lg) return [a, b]; const pad = (b-a)*0.04 || 1; return [a-pad, b+pad]; };
  const [xa, xb] = o.xr || ext('x', o.logx), [ya, yb] = o.yr || ext('y', o.logy);
  const sc = (v, a, b, lg, len) => lg ? (Math.log10(v)-Math.log10(a))/(Math.log10(b)-Math.log10(a))*len : (v-a)/(b-a)*len;
  const sx = v => lm + sc(v, xa, xb, o.logx, iw), sy = v => tm + ih - sc(v, ya, yb, o.logy, ih);
  (o.logx ? logTicks(xa, xb) : niceTicks(xa, xb, 6)).forEach(t => { el('line', {x1:sx(t), x2:sx(t), y1:tm, y2:tm+ih, class:'grid'}, svg); txt(svg, sx(t), tm+ih+16, fmtNum(t), {'text-anchor':'middle', class:'t2','font-size':12}); });
  (o.logy ? logTicks(ya, yb) : niceTicks(ya, yb, 6)).forEach(t => { el('line', {x1:lm, x2:W-rm, y1:sy(t), y2:sy(t), class:'grid'}, svg); txt(svg, lm-6, sy(t)+4, fmtNum(t), {'text-anchor':'end', class:'t2','font-size':12}); });
  txt(svg, W-rm, H-8, o.xlab, {'text-anchor':'end', 'font-size':13}); txt(svg, lm, tm-2 < 10 ? 10 : tm-2, o.ylab, {'font-size':13, dy: -2});
  P.sort((a,b) => (a.z||0)-(b.z||0)).forEach(p => { const c = el('circle', {cx:sx(p.x), cy:sy(p.y), r: p.r || 3, fill:p.c, 'fill-opacity': p.op || .65, stroke: p.ring || null, 'stroke-width': p.ring ? 1.4 : null}, svg); hov(c, p.tip); });
  if (o.medians) o.medians.forEach(m => { if (isNaN(m.x) || isNaN(m.y)) return; const g = el('g', {}, svg);
    el('circle', {cx:sx(m.x), cy:sy(m.y), r:9, fill:m.c, stroke:'var(--ldf-bg)', 'stroke-width':5, 'paint-order':'stroke'}, g);
    el('circle', {cx:sx(m.x), cy:sy(m.y), r:9, fill:'none', stroke:'var(--ldf-ink)', 'stroke-width':1.6}, g);
    hov(g, `<b>Median of ${esc(m.lab)}</b> (n = ${m.n})<br>${esc(o.xlab)}: ${fmtNum(m.x)}<br>${esc(o.ylab)}: ${fmtNum(m.y)}`); });
}

/* =============== 01 events =============== */
(function(){
  const E = D.events.map(e => ({ld:e[0], date:e[1], theme:e[2], games:e[3], com:e[4], aic:e[5], posts:e[6], aip:e[7], note:e[8], cr:e[5]/e[4]*1000, pr:e[7]/e[6]*100}));
  const st = {k:'ld', dir:1};
  const cols = [['ld','Event'],['date','Start'],['theme','Theme'],['games','Games'],['cr','Comments mentioning AI<br><span class="dim">per 1,000 comments</span>'],['pr','Posts mentioning AI<br><span class="dim">% of posts</span>']];
  function draw(){
    const mc = Math.max(...E.map(e=>e.cr)), mp = Math.max(...E.map(e=>e.pr));
    const S = E.slice().sort((a,b) => (a[st.k] > b[st.k] ? 1 : a[st.k] < b[st.k] ? -1 : 0) * st.dir);
    $('[data-ldf="t-events"]').innerHTML = '<thead><tr>' + cols.map(([k,l]) => `<th class="sort${k==='games'?' r':''}" data-k="${k}">${l}${st.k===k?(st.dir>0?' ↑':' ↓'):''}</th>`).join('') + '</tr></thead><tbody>' +
      S.map(e => `<tr title="${esc(e.note)}"><td>LD${e.ld}</td><td class="dim">${e.date}</td><td>${esc(e.theme)}</td><td class="r">${e.games.toLocaleString('en')}</td>` +
        `<td title="${e.aic} of ${e.com.toLocaleString('en')} comments"><span class="barbox" style="width:60px"><i style="width:${e.cr/mc*100}%;background:${TAB10[0]}"></i></span>${e.cr.toFixed(1)}</td>` +
        `<td title="${e.aip} of ${e.posts.toLocaleString('en')} posts"><span class="barbox" style="width:60px"><i style="width:${e.pr/mp*100}%;background:${TAB10[1]}"></i></span>${e.pr.toFixed(1)}</td>` +
        `</tr>`).join('') + '</tbody>';
    $('[data-ldf="t-events"]').querySelectorAll('th.sort').forEach(th => th.addEventListener('click', () => { if (st.k === th.dataset.k) st.dir *= -1; else { st.k = th.dataset.k; st.dir = 1; } draw(); }));
  }
  draw();
})();

/* =============== 02 attention =============== */
(function(){
  const sec = $('[data-ldf="attention"]'), st = {show:'both', mode:'rate', ev:true, era:true};
  const E = D.events.map(e => ({ld:e[0], t:new Date(e[1]+'T00:00:00Z').getTime(), date:e[1], theme:e[2], games:e[3], com:e[4], aic:e[5], posts:e[6], aip:e[7], note:e[8]}));
  const EXT = [['2022-04-06','DALL·E 2 announced'],['2022-08-22','Stable Diffusion released'],['2022-09-29','LD51 welcome post: first LD statement on AI'],['2022-11-30','ChatGPT released'],['2023-03-14','GPT-4 released'],['2024-03-21','Suno v3 released'],['2024-11-21','itch.io adds an AI disclosure field'],['2025-02-02','"Vibe coding" coined'],['2025-05-22','Claude Code generally available'],['2026-04-17','LD announces it will end after LD64 (2028)']].map(([d, l]) => ({t:new Date(d+'T00:00:00Z').getTime(), d, l}));
  const day = s => new Date(s+'T00:00:00Z').getTime();
  const ERA = [['LD50–52', day('2022-03-01'), day('2023-03-03'), TAB10[0]],['LD53–54', day('2023-03-03'), day('2024-01-05'), TAB10[2]],['LD55–58', day('2024-01-05'), day('2026-01-10'), TAB10[4]],['LD59–60', day('2026-01-10'), day('2026-11-30'), TAB10[3]]];
  const ctl = $('.ctl', sec);
  function draw(){
    const fig = $('.fig', sec); fig.innerHTML = '';
    const lm = 56, rm = 56, tm = 44, bm = 40, H = 360, iw = W-lm-rm, ih = H-tm-bm, t0 = day('2022-03-01'), t1 = day('2026-11-30');
    const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig);
    const sx = t => lm + (t-t0)/(t1-t0)*iw;
    const S = {c:{name:'Comments mentioning AI', col:TAB10[0], v: e => st.mode==='rate' ? e.aic/e.com*1000 : e.aic, unit: st.mode==='rate' ? 'per 1,000 comments' : 'comments', side:'left'},
               p:{name:'Posts mentioning AI', col:TAB10[1], v: e => st.mode==='rate' ? e.aip/e.posts*100 : e.aip, unit: st.mode==='rate' ? '% of posts' : 'posts', side:'right'}};
    const keys = st.show === 'both' ? ['c','p'] : [st.show];
    if (st.era) ERA.forEach(([l, a, b, c]) => { el('rect', {x:sx(a), y:tm, width:sx(b)-sx(a), height:ih, fill:c, 'fill-opacity':.07}, svg); txt(svg, (sx(a)+sx(b))/2, tm+16, l, {'text-anchor':'middle', 'font-size':12, style:`fill:${c}`}); });
    // axes
    const axis = k => { const m = S[k], mx = Math.max(...E.map(m.v))*1.12, ticks = niceTicks(0, mx, 5), sy = v => tm + ih - v/mx*ih; return {m, mx, ticks, sy}; };
    const A = Object.fromEntries(keys.map(k => [k, axis(k)]));
    const first = A[keys[0]];
    first.ticks.forEach(t => el('line', {x1:lm, x2:W-rm, y1:first.sy(t), y2:first.sy(t), class:'grid'}, svg));
    keys.forEach(k => { const a = A[k], left = keys.length === 1 || a.m.side === 'left';
      a.ticks.forEach(t => txt(svg, left ? lm-6 : W-rm+6, a.sy(t)+4, fmtNum(t), {'text-anchor': left ? 'end' : 'start', 'font-size':12, style:`fill:${a.m.col}`}));
      txt(svg, left ? lm : W-rm, tm-28, a.m.name + ' (' + a.m.unit + ')', {'text-anchor': left ? 'start' : 'end', 'font-size':12.5, style:`fill:${a.m.col}`}); });
    [2023,2024,2025,2026].forEach(y => { const x = sx(day(y+'-01-01')); el('line', {x1:x, x2:x, y1:tm+ih, y2:tm+ih+5, stroke:'var(--ldf-ink2)'}, svg); txt(svg, x, tm+ih+20, y, {'text-anchor':'middle', class:'t2', 'font-size':12}); });
    el('line', {x1:lm, x2:W-rm, y1:tm+ih, y2:tm+ih, stroke:'var(--ldf-ink2)'}, svg);
    if (st.ev) EXT.forEach((e, i) => { const x = sx(e.t); el('line', {x1:x, x2:x, y1:tm-6, y2:tm+ih, stroke:'var(--ldf-ink2)', 'stroke-dasharray':'2 3'}, svg);
      const g = el('g', {style:'cursor:default'}, svg); el('circle', {cx:x, cy:tm-12, r:8, fill:'var(--ldf-bg)', stroke:'var(--ldf-ink2)'}, g); txt(g, x, tm-8, i+1, {'text-anchor':'middle', 'font-size':10.5});
      hov(g, `<b>${e.d}</b><br>${esc(e.l)}`); });
    keys.forEach(k => { const a = A[k], m = a.m;
      el('path', {d: E.map((e, i) => (i?'L':'M') + sx(e.t) + ',' + a.sy(m.v(e))).join(''), fill:'none', stroke:m.col, 'stroke-width':2.2}, svg);
      E.forEach(e => { const x = sx(e.t), y = a.sy(m.v(e)), last = e.ld === 60;
        const c = el('circle', {cx:x, cy:y, r:5, fill: last ? 'var(--ldf-bg)' : m.col, stroke:m.col, 'stroke-width':2}, svg);
        if (k === keys[0]) txt(svg, x, y-10, 'LD'+e.ld, {'text-anchor':'middle', 'font-size':11.5});
        hov(c, `<b>LD${e.ld} · ${esc(e.theme)}</b> · ${e.date}<br>Comments mentioning AI: ${e.aic} of ${e.com.toLocaleString('en')} (${(e.aic/e.com*1000).toFixed(1)} per 1,000)<br>Posts mentioning AI: ${e.aip} of ${e.posts.toLocaleString('en')} (${(e.aip/e.posts*100).toFixed(1)}%)<br><span style="opacity:.8">${esc(e.note)}</span>${last?'<br><i>still in the rating period when scraped</i>':''}`); }); });
  }
  buttons(ctl, 'Show', [['both','Both'],['c','Comments'],['p','Posts']], st, 'show', draw);
  buttons(ctl, 'Scale', [['rate','Rate'],['count','Count']], st, 'mode', draw);
  checks(ctl, '', [['era','Colour periods','att-era'],['ev','External events','att-ev']], st, draw);
  draw();
})();

/* =============== 03 referent =============== */
(function(){
  const sec = $('[data-ldf="referent"]'), st = {g:'period', mode:'share'};
  legend($('.legend', sec), REF);
  function draw(){ const G = LDS.map(l => ({lab:'LD'+l, test:c => c.ld===l}));
    stacked($('.fig', sec), G.map(g => { const n = {}; CM.filter(g.test).forEach(c => n[c.ref] = (n[c.ref]||0)+1); return {lab:g.lab, sub:g.sub, n}; }), REF, {mode:st.mode, lw:150, rh:20, gap:6}); }
  const ctl = $('.ctl', sec);
  buttons(ctl, 'Show', [['share','Share'],['count','Count']], st, 'mode', draw);
  draw();
})();

/* =============== shared filter (04–07, 19) =============== */
const F = {g:'event', refs:['P','R','K'], div:'all', minN:15};
const FX = {ev:null, act:null, gkey:null};
function sel(){ return CM.filter(c => F.refs.includes(c.ref) && (F.div === 'all' || c.div === F.div)); }
function groups(){ return LDS.map(l => ({key:'ld'+l, lab:'LD'+l, test:c => c.ld===l})); }
function redrawShared(){ ['evalmix','trend','acts','conc'].forEach(k => redrawers[k] && redrawers[k]()); $('[data-ldf="shared-n"]').textContent = sel().length + ' comments selected'; }
(function(){
  const ctl = $('.ctl', $('[data-ldf="shared"]'));
  ctl.insertAdjacentHTML('afterbegin', '<div class="row"><span class="lab" style="min-width:auto;color:var(--ldf-ink)">Shared filter: applies to the next three figures and the comment search</span></div>');
  buttons(ctl, '"AI" means', REF.slice(0,3).map(r => [r[0], r[1]]), F, 'refs', redrawShared, true);
  buttons(ctl, 'Division', [['all','All'],['compo','Compo'],['jam','Jam']], F, 'div', redrawShared);
})();

/* =============== 04 eval mix =============== */
(function(){
  const sec = $('[data-ldf="evalmix"]'), st = {mode:'share'}, pan = commentPanel(sec);
  legend($('.legend', sec), EVAL);
  redrawers.evalmix = function(keep){ const S = sel();
    stacked($('.fig', sec), groups().map(g => { const n = {}; S.filter(g.test).forEach(c => n[c.ev] = (n[c.ev]||0)+1); return {lab:g.lab, sub:g.sub, n, g}; }), EVAL,
      {mode:st.mode, rh: F.g==='period'?28:20, gap: F.g==='period'?12:6, onClick:(r, k) => pan.show(`<b>${esc(r.lab)}</b>, ${esc(EVL[k])}`, sel().filter(r.g.test).filter(c => c.ev === k))}); if (pan.open) pan.hide(); };
  buttons($('.ctl', sec), 'Show', [['share','Share'],['count','Count']], st, 'mode', redrawers.evalmix);
})();

/* =============== 05 trend =============== */
(function(){
  const sec = $('[data-ldf="trend"]'), st = {m:['neg','mk'], minN:'15', band:true};
  const M = {
    neg:['Criticism, of all judgements', NEG, DIR, TAB10[3]],
    negmk:['Criticism incl. "points out", of all judgements', c => NEG(c)||c.ev==='MK', c => DIR(c)||c.ev==='MK', TAB10[1]],
    praise:['Praise, of all comments', POS, () => true, TAB10[0]],
    mk:['"Points out AI", of all comments', c => c.ev==='MK', () => true, TAB10[7]],
    none:['No judgement, of all comments', c => c.ev==='0', () => true, TAB10[8]],
    soft:['Softened, of criticism', c => c.ev==='H-', NEG, TAB10[6]],
    conc:['With a concession, of praise', c => c.ev==='C+', POS, TAB10[9]],
    rt:['Talks about in-game AI, of making + in-game', c => c.ref==='R', c => c.ref==='P'||c.ref==='R', TAB10[2]]};
  const ctl = $('.ctl', sec);
  redrawers.trend = function(){ const S = F.refs.includes('R') ? sel() : sel(); const G = groups();
    const series = st.m.map(k => { const [name, num, den, color] = M[k]; const base = k === 'rt' ? CM.filter(c => F.div==='all'||c.div===F.div) : S;
      return {name, color, pts: G.map(g => { const s = base.filter(g.test).filter(den); return {k: s.filter(num).length, n: s.length}; })}; });
    legend($('.legend', sec), st.m.map(k => [k, M[k][0], M[k][3]]));
    lines($('.fig', sec), G.map(g => g.lab), series, {pct:true, band:st.band, minN:+st.minN, ymax: 1, h: 340}); };
  buttons(ctl, 'Lines', Object.entries(M).map(([k,v]) => [k, v[0]]), st, 'm', redrawers.trend, true);
  buttons(ctl, 'Min. sample', [['5','5'],['15','15'],['30','30']], st, 'minN', redrawers.trend);
  checks(ctl, '', [['band','95% interval','tr-band']], st, redrawers.trend);
})();

/* =============== 06 acts =============== */
(function(){
  const sec = $('[data-ldf="acts"]'), st = {minN:'15', rare:false, scale:'row'}, pan = commentPanel(sec); let active = null;
  pan.onHide = () => { active = null; redrawers.acts(); };
  const ctl = $('.ctl', sec);
  redrawers.acts = function(keep){ if (!keep && active && pan.open){ pan.onHide = null; pan.hide(); pan.onHide = () => { active = null; redrawers.acts(); }; active = null; } const S = sel(), G = groups(); const nG = G.map(g => S.filter(g.test).length);
    const share = (k, g) => { const s = S.filter(g.test); return [s.filter(c => c.acts.includes(k)).length, s.length]; };
    const tot = k => S.filter(c => c.acts.includes(k)).length / Math.max(1, S.length);
    const rows = ACTS.filter(a => st.rare || tot(a[0]) >= 0.03).map(a => ({key:a[0], lab:a[1]}));
    const rowMax = {}; rows.forEach(r => rowMax[r.key] = Math.max(1e-9, ...G.map((g,i) => nG[i] >= +st.minN ? share(r.key, g)[0]/Math.max(1,nG[i]) : 0)));
    const allMax = Math.max(...Object.values(rowMax));
    heat($('[data-ldf="t-acts"]'), rows, G.map((g,i) => ({key:g.key, lab:g.lab, sub:'n = '+nG[i], i})), (r, c) => { const [k, n] = share(r.key, G[c.i]); if (!n) return {text:'–'}; const v = k/n;
      return {text: pct(v), tip: `${k} of ${n}`, color: n < +st.minN ? null : vir(st.scale === 'row' ? v/rowMax[r.key] : v/allMax)}; },
      {onRow: (k, ci) => { const a = ACTS.find(x => x[0] === k), g = ci == null ? null : G[ci]; active = [k, ci];
         pan.show(`<b>${esc(a[1])}</b>, ${g ? esc(g.lab) : 'all events'}`, S.filter(c => c.acts.includes(k) && (!g || g.test(c)))); redrawers.acts(true); },
       active: active && active[1] == null ? active[0] : null, activeCell: active,
       foot: st.scale === 'row' ? 'Colour scaled within each row (darkest = lowest, yellow = highest of that row).' : 'Colour scaled across the whole table.'});
  };
  buttons(ctl, 'Colour', [['row','Within each row'],['all','Whole table']], st, 'scale', redrawers.acts);
  buttons(ctl, 'Min. sample', [['5','5'],['15','15'],['30','30']], st, 'minN', redrawers.acts);
  checks(ctl, '', [['rare','Show rare acts (under 3% overall)','acts-rare']], st, redrawers.acts);
})();

/* =============== 07 criticism by use =============== */
(function(){
  const sec = $('[data-ldf="byuse"]'), st = {ref:'P', mk:false, g:'period'};
  const ctl = $('.ctl', sec);
  function draw(){ const G = LDS.map(l => ({lab:'LD'+l, test:c => c.ld===l}));
    const isNeg = c => NEG(c) || (st.mk && c.ev==='MK'), isDir = c => DIR(c) || (st.mk && c.ev==='MK');
    const base = CM.filter(c => c.ref === st.ref && isDir(c));
    const rows = [{key:'*', lab:'All uses'}].concat(USES.map(u => ({key:u[0], lab:u[1]})));
    heat($('[data-ldf="t-byuse"]'), rows, G.map((g,i) => ({lab:g.lab, sub:g.sub, i})), (r, c) => { const s = base.filter(G[c.i].test).filter(x => r.key === '*' || x.uses.includes(r.key)); const k = s.filter(isNeg).length, n = s.length;
      if (!n) return {text:'–'}; if (n < 5) return {text:`${k}/${n}`, tip:'fewer than 5'}; return {text:`${pct(k/n)}<br><span style="font-size:.8em">${k}/${n}</span>`, tip:`${k} critical of ${n}`, color: crit(k/n)}; },
      {foot: 'Blue = little criticism, red = mostly criticism.'}); }
  buttons(ctl, '"AI" means', [['P','Using AI to make the game'],['R','AI running inside the game']], st, 'ref', draw);
  checks(ctl, '', [['mk','Count "points out AI" as criticism','use-mk']], st, draw);
  draw();
})();

/* =============== 08 use mix =============== */
(function(){
  const sec = $('[data-ldf="usemix"]'), st = {g:'period'};
  function draw(){ const G = LDS.map(l => ({lab:'LD'+l, test:c => c.ld===l}));
    const base = CM.filter(c => c.ref === 'P' || c.ref === 'R'); const nG = G.map(g => base.filter(g.test).length);
    heat($('[data-ldf="t-usemix"]'), USES.map(u => ({key:u[0], lab:u[1]})).concat([{key:'?', lab:'Not specified'}]), G.map((g,i) => ({lab:g.lab, sub:'n = '+nG[i], i})), (r, c) => { const s = base.filter(G[c.i].test); const k = s.filter(x => x.uses.includes(r.key)).length; if (!s.length) return {text:'–'}; return {text:pct(k/s.length), tip:`${k} of ${s.length}`, color: vir(Math.min(1, k/s.length/0.7))}; },
      {foot:'Share of comments about using AI to make the game or AI running in the game that mention each use. A comment can mention several uses.'}); }
  draw();
})();

/* =============== 09 strip =============== */
const G59 = D.ld59.map(r => ({id:r[0], div:r[1], grp:r[2], tags:r[3], title:r[4], rank:r[5], got:r[6], given:r[7], com:r[8], outs:r[9], lc:r[10], lmed:r[11], lmean:r[12], lai:r[13],
  s: Object.fromEntries(D.cats.map((c,i) => [c, r[14+i]]))}));
G59.forEach(g => { g.cpr = g.got ? g.com/g.got : null; g.aish = g.lc ? g.lai/g.lc : null; });
const G60 = D.ld60.map(r => ({id:r[0], div:r[1], ai:r[2], title:r[3], outs:r[4], got:r[5], given:r[6], lc:r[7], lmed:r[8], lmean:r[9], lai:r[10]}));
G60.forEach(g => { g.com = g.lc; g.cpr = g.got && g.lc != null ? g.lc/g.got : null; g.aish = g.lc ? g.lai/g.lc : null; });
const GRP59 = [['none','AI not used',TAB10[0]],['code','AI: code only',TAB10[1]],['assets','AI: art / audio / text',TAB10[3]],['blank','Declaration left blank',TAB10[7]],['noitch','Not on itch.io',TAB10[8]]];
const GRP60 = [['no-ai','AI not used',TAB10[0]],['ai','AI used',TAB10[3]],['undeclared','Declaration left blank',TAB10[7]],['none','Not on itch.io',TAB10[8]]];
const METRIC = [['overall','Overall'],['fun','Fun'],['innovation','Innovation'],['theme','Theme'],['graphics','Graphics'],['audio','Audio'],['humor','Humor'],['mood','Mood'],
  ['got','Ratings received'],['given','Ratings given'],['com','Comments received'],['cpr','Comments per rating']].concat(D.has_len ? [['lmed','Median comment length'],['aish','Share of comments mentioning AI']] : []);
const SCORE = new Set(D.cats);
const mval = (g, m) => SCORE.has(m) ? (g.s ? g.s[m] : null) : g[m];
const MRANGE = {got:[0,120,1,300], given:[0,120,1,300], com:[0,100,1,200], cpr:[0,2,0.1,3], lmed:[0,500,10,1000], aish:[0,0.3,0.005,1]};
(function(){
  const sec = $('[data-ldf="strip"]'), st = {ev:'59', m:'overall', div:'all', ov:'median', det:false, log:false};
  const ctl = $('.ctl', sec);
  let mrow;
  function draw(){
    const isScore = SCORE.has(st.m); if (st.ev === '60' && isScore){ st.m = 'got'; mrow.querySelectorAll('.bt').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.m)); }
    mrow.querySelectorAll('.bt').forEach(b => { b.disabled = st.ev === '60' && SCORE.has(b.dataset.v); b.style.opacity = b.disabled ? .35 : 1; });
    const games = (st.ev === '59' ? G59 : G60).filter(g => st.div === 'all' || g.div === st.div);
    let groupsDef;
    if (st.ev === '59'){
      if (st.det){ const combos = {}; games.filter(g => g.grp==='code'||g.grp==='assets').forEach(g => { (combos[g.tags] = combos[g.tags] || []).push(g); });
        groupsDef = [['none','AI not used',TAB10[0], games.filter(g => g.grp==='none')]].concat(Object.entries(combos).sort((a,b) => b[1].length - a[1].length).map(([t, a], i) => [t, 'AI: ' + t.split(',').join(' + '), TAB10[[1,3,4,5,6,9,2,8][i%8]], a]));
      } else groupsDef = GRP59.map(([k,l,c]) => [k,l,c, games.filter(g => g.grp===k)]);
    } else groupsDef = GRP60.map(([k,l,c]) => [k,l,c, games.filter(g => g.ai===k)]);
    const R = MRANGE[st.m] || [1,5];
    const lg = st.log && !isScore;
    const label = (METRIC.find(x => x[0]===st.m)||[0,''])[1];
    strip($('.fig', sec), groupsDef.map(([k,l,c,a]) => ({lab:l, color:c, vals:a.map(g => ({v: mval(g, st.m), tip: `<b>${esc(g.title)}</b>${g.rank?' · #'+g.rank:''}<br>${label}: ${(v => v==null?'–':(st.m==='aish'||st.m==='cpr'?(+v).toFixed(2):fmtNum(v)))(mval(g, st.m))}${g.tags?'<br>itch tags: '+esc(g.tags):''}`}))})),
      {lo: isScore ? 1 : (lg ? R[2] : R[0]), hi: isScore ? 5 : (lg ? R[3] : R[1]), log: lg, overlay: st.ov, fmt: v => (isScore || st.m==='cpr' || st.m==='aish') ? v.toFixed(2) : fmtNum(v), xlab: label + (lg ? ' (log scale)' : (isScore ? '' : ' (values above the axis are drawn at the edge)')), lw: 210});
  }
  buttons(ctl, 'Event', [['59','LD59 (Apr 2026)'],['60','LD60 (Oct 2026)']], st, 'ev', draw);
  mrow = buttons(ctl, 'Metric', METRIC.map(m => [m[0], m[1]]), st, 'm', draw);
  buttons(ctl, 'Division', [['all','All'],['c','Compo'],['j','Jam']], st, 'div', draw);
  buttons(ctl, 'Overlay', [['none','None'],['median','Median'],['box','Box']], st, 'ov', draw);
  checks(ctl, '', [['det','Detailed AI categories (LD59)','st-det'],['log','Log scale for counts','st-log']], st, draw);
  draw();
})();

/* =============== 10 talk =============== */
(function(){
  if (!D.has_len){ $('[data-ldf="t-talk"]').innerHTML = '<tbody><tr><td class="dim">Comment-length data not loaded.</td></tr></tbody>'; return; }
  const rows = [['LD59','AI not used', G59.filter(g => g.grp==='none'), TAB10[0]],['LD59','AI: code only', G59.filter(g => g.grp==='code'), TAB10[1]],['LD59','AI: art / audio / text', G59.filter(g => g.grp==='assets'), TAB10[3]],
    ['LD60','AI not used', G60.filter(g => g.ai==='no-ai'), TAB10[0]],['LD60','AI used', G60.filter(g => g.ai==='ai'), TAB10[3]]].map(r => [r[0], r[1], r[2].filter(g => g.lc > 0), r[3]]);
  const M = [['Comments per rating', a => median(a.map(g => g.cpr)), 1.2, v => v.toFixed(2)],['Median length (chars)', a => median(a.map(g => g.lmed)), 220, v => Math.round(v)],
    ['Comments mentioning AI', a => a.reduce((s,g) => s + g.lai, 0) / a.reduce((s,g) => s + g.lc, 0), 0.06, v => pct(v,1)],['Games with an AI comment', a => a.filter(g => g.lai > 0).length / a.length, 0.5, v => pct(v)]];
  $('[data-ldf="t-talk"]').innerHTML = '<thead><tr><th>Event</th><th>Declaration</th><th class="r">Games</th>' + M.map(m => `<th>${m[0]}</th>`).join('') + '</tr></thead><tbody>' +
    rows.map(([ev, lab, a, c], i) => `<tr${i===3?' style="border-top:2px solid var(--ldf-rule)"':''}><td>${ev}</td><td>${lab}</td><td class="r">${a.length}</td>` + M.map(m => { const v = m[1](a); return `<td><span class="barbox" style="width:70px"><i style="width:${Math.min(100, v/m[2]*100)}%;background:${c}"></i></span>${m[3](v)}</td>`; }).join('') + '</tr>').join('') + '</tbody>';
})();

/* =============== 11 scatter =============== */
(function(){
  const sec = $('[data-ldf="scatter"]'), st = {x:'got', y:'overall', c:'grp', log:false, med:true}, off = new Set();
  const ctl = $('.ctl', sec);
  function draw(){
    const C = st.c === 'grp' ? GRP59 : [['c','Compo',TAB10[0]],['j','Jam',TAB10[1]],['e','Extra',TAB10[2]]];
    legend($('.legend', sec), C.map(c => [c[0], c[1], c[2]]), k => { off.has(k) ? off.delete(k) : off.add(k); draw(); }, off);
    const key = g => st.c === 'grp' ? g.grp : g.div;
    const col = Object.fromEntries(C.map(c => [c[0], c[2]]));
    const lx = st.log && !SCORE.has(st.x), ly = st.log && !SCORE.has(st.y);
    const lab = k => (METRIC.find(m => m[0]===k)||[0,k])[1];
    const P = G59.filter(g => !off.has(key(g)) && col[key(g)]).map(g => ({x: mval(g, st.x), y: mval(g, st.y), c: col[key(g)], z: key(g)==='none'?0:1, op: st.med ? .4 : .65,
      tip: `<b>${esc(g.title)}</b>${g.rank?' · #'+g.rank:''}<br>${esc(lab(st.x))}: ${fmtNum(+mval(g,st.x)||0)}<br>${esc(lab(st.y))}: ${fmtNum(+mval(g,st.y)||0)}${g.tags?'<br>itch tags: '+esc(g.tags):''}`}));
    const meds = st.med ? C.filter(c => !off.has(c[0])).map(c => { const a = G59.filter(g => key(g)===c[0]); return {x: median(a.map(g => mval(g, st.x))), y: median(a.map(g => mval(g, st.y))), c: c[2], lab: c[1], n: a.length}; }) : null;
    const tb = $('[data-ldf="t-scmed"]');
    tb.innerHTML = meds ? `<thead><tr><th>Group median</th><th class="r">n</th><th class="r">${esc(lab(st.x))}</th><th class="r">${esc(lab(st.y))}</th></tr></thead><tbody>` +
      meds.map(m => `<tr><td><span class="chip" style="background:${m.c}"></span>${esc(m.lab)}</td><td class="r">${m.n}</td><td class="r">${isNaN(m.x) ? '–' : fmtNum(m.x)}</td><td class="r">${isNaN(m.y) ? '–' : fmtNum(m.y)}</td></tr>`).join('') + '</tbody>' : '';
    scatter($('.fig', sec), P, {xlab: lab(st.x) + (lx?' (log)':''), ylab: lab(st.y) + (ly?' (log)':''), logx: lx, logy: ly, medians: meds});
  }
  buttons(ctl, 'X', METRIC.map(m => [m[0], m[1]]), st, 'x', draw);
  buttons(ctl, 'Y', METRIC.map(m => [m[0], m[1]]), st, 'y', draw);
  buttons(ctl, 'Colour', [['grp','AI declaration'],['div','Division']], st, 'c', () => { off.clear(); draw(); });
  checks(ctl, '', [['med','Group medians (ringed dots, listed below)','sc-med'],['log','Log scales for counts','sc-log']], st, draw);
  draw();
})();

/* =============== 11 opt-outs =============== */
(function(){
  const sec = $('[data-ldf="optout"]'), st = {cat:'5'};
  const rows = [['LD59','AI not used', G59.filter(g=>g.grp==='none'), TAB10[0]],['LD59','AI: code only', G59.filter(g=>g.grp==='code'), TAB10[1]],['LD59','AI: art / audio / text', G59.filter(g=>g.grp==='assets'), TAB10[3]],
    ['LD60','AI not used', G60.filter(g=>g.ai==='no-ai'), TAB10[0]],['LD60','AI used', G60.filter(g=>g.ai==='ai'), TAB10[3]]];
  function draw(){ const has = g => st.cat === 'any' ? /[5678]/.test(g.outs||'') : (g.outs||'').includes(st.cat);
    lines; const fig = $('.fig', sec); fig.innerHTML = ''; const lw = 230, rh = 30, top = 22, H = top + rows.length*rh + 30, x0 = lw, x1 = W - 70;
    const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig); const sx = v => x0 + v/0.6*(x1-x0);
    [0,.1,.2,.3,.4,.5,.6].forEach(t => { el('line', {x1:sx(t), x2:sx(t), y1:top-6, y2:H-24, class:'grid'}, svg); txt(svg, sx(t), H-8, pct(t), {'text-anchor':'middle', class:'t2','font-size':12}); });
    rows.forEach(([ev, lab, a, c], i) => { const y = top + i*rh + (i >= 3 ? 8 : 0); const k = a.filter(has).length, [p, lo, hi] = wilson(k, a.length);
      txt(svg, 0, y+rh/2+4, ev + '  ' + lab);
      el('rect', {x:x0, y:y+6, width:Math.max(1, sx(p)-x0), height:rh-12, fill:c, 'fill-opacity':.85}, svg);
      el('line', {x1:sx(lo), x2:sx(hi), y1:y+rh/2, y2:y+rh/2, stroke:'var(--ldf-ink)', 'stroke-width':1.3}, svg);
      const t = txt(svg, Math.max(sx(hi), sx(p))+6, y+rh/2+4, `${pct(p)}  (${k}/${a.length})`, {'font-size':12}); hov(t, `95% CI ${pct(lo,1)} – ${pct(hi,1)}`); });
  }
  buttons($('.ctl', sec), 'Category', [['5','Graphics'],['6','Audio'],['7','Humor'],['8','Mood'],['any','Any of these']], st, 'cat', draw);
  draw();
})();

/* =============== 12 declarations =============== */
(function(){
  const sec = $('[data-ldf="decl"]'), fig = $('.fig', sec);
  const c59 = dv => { const s = G59.filter(g => (dv==='all'||g.div===dv) && ['none','code','assets'].includes(g.grp)); return [s.filter(g => g.grp!=='none').length, s.length]; };
  const c60 = dv => { const s = G60.filter(g => (dv==='all'||g.div===dv) && (g.ai==='ai'||g.ai==='no-ai')); return [s.filter(g => g.ai==='ai').length, s.length]; };
  const rows = [['all','All'],['j','Jam'],['c','Compo']], lw = 120, rh = 44, top = 30, H = top + rows.length*rh + 28, x0 = lw, x1 = W - 20, sx = v => x0 + v/0.5*(x1-x0);
  const svg = el('svg', {viewBox:`0 0 ${W} ${H}`, role:'img'}, fig);
  [0,.1,.2,.3,.4,.5].forEach(t => { el('line', {x1:sx(t), x2:sx(t), y1:top-8, y2:H-24, class:'grid'}, svg); txt(svg, sx(t), H-8, pct(t), {'text-anchor':'middle', class:'t2','font-size':12}); });
  txt(svg, x0, 12, '● LD59 (Apr 2026)', {style:`fill:${TAB10[0]}`, 'font-size':13}); txt(svg, x0+170, 12, '● LD60 (Oct 2026)', {style:`fill:${TAB10[3]}`, 'font-size':13});
  rows.forEach(([dv, lab], i) => { const y = top + i*rh + rh/2; txt(svg, 0, y+4, lab);
    const a = wilson(...c59(dv)), b = wilson(...c60(dv));
    el('line', {x1:sx(a[0]), x2:sx(b[0]), y1:y, y2:y, stroke:'var(--ldf-ink2)', 'stroke-width':1.5}, svg);
    [[a, c59(dv), TAB10[0], -8],[b, c60(dv), TAB10[3], 8]].forEach(([w, kn, c, dy]) => { el('line', {x1:sx(w[1]), x2:sx(w[2]), y1:y+dy, y2:y+dy, stroke:c, 'stroke-width':2}, svg);
      const d = el('circle', {cx:sx(w[0]), cy:y, r:6, fill:c}, svg); hov(d, `${kn[0]} of ${kn[1]} = ${pct(w[0],1)}<br>95% CI ${pct(w[1],1)} – ${pct(w[2],1)}`);
      txt(svg, sx(w[0]), y + (dy < 0 ? -12 : 22), pct(w[0]), {'text-anchor':'middle','font-size':12, style:`fill:${c}`}); }); });
})();

/* =============== 13 poll =============== */
(function(){
  const sec = $('[data-ldf="poll"]'), st = {q:'first', by:'used', mode:'share'};
  const Q = {first:['First preference', r => r[0], [['allow','Allow AI coding in both',RDBU[8]],['jamonly','Ban in Compo, allow in Jam',RDBU[6]],['newcat','Ban in both, add an AI category',RDBU[2]],['ban','Ban in both',RDBU[0]]]],
    allowed:['Would continue if all AI coding were allowed', r => r[4], [1,2,3,4,5].map((v,i) => [v, ['1 Stop completely','2','3 Neutral','4','5 More likely'][i], ['#ca0020','#f4a582','#d9d9d9','#92c5de','#0571b0'][i]])],
    banned:['Would continue if all AI coding were banned', r => r[5], [1,2,3,4,5].map((v,i) => [v, ['1 Stop completely','2','3 Neutral','4','5 More likely'][i], ['#ca0020','#f4a582','#d9d9d9','#92c5de','#0571b0'][i]])],
    disc:['Should AI use have to be disclosed?', r => r[2], [[1,'Yes',TAB10[0]],[0,'No',TAB10[1]]]],
    auto:['Should AI autocomplete be allowed?', r => r[3], [[1,'Yes',TAB10[0]],[0,'No',TAB10[1]]]]};
  const BY = {used:['Own AI coding in a jam', r => r[1], [['agent','Prompting / agents'],['auto','Autocomplete only'],['none','No AI coding'],['na','No answer']]],
    cat:['Usually enters', r => r[7], [['J','Jam'],['C','Compo'],['N','Neither / new'],['','No answer']]],
    wave:['When they answered', r => r[6], [['may','May 2026 (after LD59)'],['oct','Sep–Oct 2026 (around LD60)']]],
    all:['Everyone', () => 'all', [['all','All respondents']]]};
  function draw(){ const [ql, qf, cats] = Q[st.q], [bl, bf, gs] = BY[st.by];
    legend($('.legend', sec), cats.map(c => [String(c[0]), c[1], c[2]]));
    const rows = gs.map(([k, l]) => { const s = D.poll.filter(r => String(bf(r)) === k); const n = {}; s.forEach(r => { const v = qf(r); if (v != null && v !== '') n[v] = (n[v]||0)+1; }); return {lab:l, n}; }).filter(r => Object.keys(r.n).length);
    stacked($('.fig', sec), rows, cats, {mode:st.mode, lw:200}); }
  const ctl = $('.ctl', sec);
  buttons(ctl, 'Question', Object.entries(Q).map(([k,v]) => [k, v[0]]), st, 'q', draw);
  buttons(ctl, 'Split by', Object.entries(BY).map(([k,v]) => [k, v[0]]), st, 'by', draw);
  buttons(ctl, 'Show', [['share','Share'],['count','Count']], st, 'mode', draw);
  draw();
})();

/* =============== 14 vocab =============== */
(function(){
  const sec = $('[data-ldf="vocab"]'), st = {set:'all', norm:'all'};
  const V = D.vocab, TOOLS = new Set(['DALL-E','Midjourney','Stable Diffusion','ChatGPT','Copilot','Suno / AI music','LLM','Claude','vibe coding','agent(ic)']);
  function draw(){ const idx = V.terms.map((t,i) => i).filter(i => st.set === 'all' || (st.set === 'tools') === TOOLS.has(V.terms[i]));
    const mx = Math.max(...idx.flatMap(i => V.vals[i]));
    heat($('[data-ldf="t-vocab"]'), idx.map(i => ({key:String(i), lab:V.terms[i]})), V.lds.map((l,j) => ({lab:'LD'+l, j})), (r, c) => { const i = +r.key, v = V.vals[i][c.j], rm = Math.max(...V.vals[i]);
      if (!v) return {text:''}; return {text: v < 1 ? v.toFixed(1) : Math.round(v), tip: `${v.toFixed(2)} per 100 AI-related texts`, color: vir(Math.sqrt(st.norm === 'row' ? v/rm : v/mx))}; },
      {foot: st.norm === 'row' ? 'Colour scaled within each row.' : 'Colour scaled across the table (square-root scale).'}); }
  const ctl = $('.ctl', sec);
  buttons(ctl, 'Terms', [['all','All'],['tools','Tool names'],['norms','Norms and judgements']], st, 'set', draw);
  buttons(ctl, 'Colour', [['all','Whole table'],['row','Within each row']], st, 'norm', draw);
  draw();
})();

/* =============== 15 hearts =============== */
(function(){
  const sec = $('[data-ldf="hearts"]'), st = {p:'all', ov:'median', log:true};
  function draw(){ const base = CM.filter(c => ['P','R','K'].includes(c.ref) && (st.p === 'all' || periodOf(c.ld).k === st.p));
    strip($('.fig', sec), EVAL.map(([k, l, col]) => ({lab:l, color: col === '#e6e6e6' || col === '#c6dbef' ? '#7f7f7f' : col, vals: base.filter(c => c.ev===k).map(c => ({v: st.log ? c.love + 1 : c.love, tip: `♥ ${c.love} · LD${c.ld}<br>${esc((c.L+c.K+c.R).slice(0,140))}…`}))})),
      {lo: st.log ? 1 : 0, hi: st.log ? 30 : 12, log: st.log, overlay: st.ov, fmt: v => fmtNum(st.log ? v-1 : v), tfmt: v => fmtNum(st.log ? v-1 : v), xlab: 'Hearts on the comment' + (st.log ? ' (log scale, shifted by 1)' : '')}); }
  const ctl = $('.ctl', sec);
  buttons(ctl, 'Period', [['all','All']].concat(PERIODS.map(p => [p.k, p.lab])), st, 'p', draw);
  buttons(ctl, 'Overlay', [['none','None'],['median','Median'],['box','Box']], st, 'ov', draw);
  checks(ctl, '', [['log','Log scale','he-log']], st, draw);
  draw();
})();

/* =============== 17 method scores =============== */
const METH = [
  {k:'vf', lab:'VADER, whole comment', lo:-1, hi:1, thr:0.05, three:true, dir:-1},
  {k:'vt', lab:'VADER, AI sentences', lo:-1, hi:1, thr:0.05, three:true, dir:-1},
  {k:'tf', lab:'TextBlob, whole comment', lo:-1, hi:1, thr:0.05, three:true, dir:-1},
  {k:'tt', lab:'TextBlob, AI sentences', lo:-1, hi:1, thr:0.05, three:true, dir:-1},
  {k:'rob', lab:'RoBERTa, AI sentences', lo:-1, hi:1, thr:0.2, three:true, dir:-1},
  {k:'nli', lab:'NLI stance, AI sentences', lo:0, hi:1, thr:0.5, three:false, dir:1}];
const MREL = CM.filter(c => ['P','R','K'].includes(c.ref));
const MDIR = MREL.filter(DIR);
function predict(m, v, thr){ if (v == null) return null; if (!m.three) return v > thr ? 'neg' : 'pos'; return v >= thr ? 'pos' : v <= -thr ? 'neg' : 'neu'; }
function auc(m){ const pos = MDIR.filter(POS).map(c => c[m.k]).filter(v => v!=null), neg = MDIR.filter(NEG).map(c => c[m.k]).filter(v => v!=null); let s = 0;
  neg.forEach(a => pos.forEach(b => { const x = m.dir < 0 ? b - a : a - b; s += x > 0 ? 1 : x === 0 ? .5 : 0; })); return s/(pos.length*neg.length); }
function kappa(m, thr){ let a=0,b=0,c=0,d=0,n=0; MDIR.forEach(x => { const p = predict(m, x[m.k], thr); if (!p) return; n++; const t = NEG(x), q = p === 'neg'; if(t&&q)a++; else if(t)b++; else if(q)c++; else d++; }); const po=(a+d)/n, pe=((a+b)*(a+c)+(c+d)*(b+d))/(n*n); return (po-pe)/(1-pe); }
const AUCS = Object.fromEntries(METH.map(m => [m.k, auc(m)]));
(function(){
  const sec = $('[data-ldf="mscore"]'), st = {m:'nli', ov:'median', thr:{}}; METH.forEach(m => st.thr[m.k] = m.thr);
  const ctl = $('.ctl', sec);
  const thrRow = document.createElement('div'); thrRow.className = 'row';
  thrRow.innerHTML = '<span class="lab">Threshold</span><input type="range" data-ldf="m-thr" min="0" max="1" step="0.01"><span data-ldf="m-thrv"></span><button type="button" class="bt" data-ldf="m-reset">Reset</button>';
  function M(){ return METH.find(m => m.k === st.m); }
  function showDetail(c){ $('[data-ldf="mdetail"]').innerHTML = `<div><b>Manual coding:</b> ${esc(EVL[c.ev])} · LD${c.ld} · <a href="https://ldjam.com${esc(c.path)}" target="_blank" rel="noopener">${esc(c.game)}</a></div>` +
    `<div class="q">AI sentences: “${esc(c.tgt || '(none found)')}”</div>` +
    `<div class="tw"><table><thead><tr>${METH.map(m => `<th class="r">${esc(m.lab)}</th>`).join('')}</tr></thead><tbody><tr>${METH.map(m => { const v = c[m.k], p = predict(m, v, st.thr[m.k]); return `<td class="r">${v==null?'–':v.toFixed(2)} <span class="dim">${p||''}</span></td>`; }).join('')}</tr></tbody></table></div>`; }
  function draw(){ const m = M(), thr = st.thr[m.k];
    const slider = $('[data-ldf="m-thr"]'); slider.min = m.three ? 0 : 0.05; slider.max = m.three ? 0.6 : 0.95; slider.value = thr; $('[data-ldf="m-thrv"]').textContent = m.three ? `positive ≥ ${thr.toFixed(2)}, negative ≤ ${(-thr).toFixed(2)}` : `negative if > ${thr.toFixed(2)}`;
    strip($('.fig', sec), EVAL.map(([k, l, col]) => ({lab:l, color: col === '#e6e6e6' || col === '#c6dbef' ? '#7f7f7f' : col, vals: MREL.filter(c => c.ev === k).map(c => ({v: c[m.k], c, tip: `${esc(l)}<br>${m.lab}: ${c[m.k]==null?'–':c[m.k].toFixed(2)}<br><i>${esc((c.tgt||'').slice(0,160))}</i>`}))})),
      {lo:m.lo, hi:m.hi, overlay:st.ov, fmt: v => v.toFixed(2), xlab: m.lab + (m.k==='nli' ? ': probability that the writer disapproves' : ': score'), onDot: v => showDetail(v.c), lw:230, r:2.4});
    const svg = $('.fig svg', sec); const x0 = 230+62, x1 = W-8, sx = v => x0 + (v-m.lo)/(m.hi-m.lo)*(x1-x0), H = +svg.getAttribute('viewBox').split(' ')[3];
    (m.three ? [thr, -thr] : [thr]).forEach(t => el('line', {x1:sx(t), x2:sx(t), y1:18, y2:H-24, stroke:TAB10[3], 'stroke-dasharray':'4 3', 'stroke-width':1.4}, svg));
    // agreement table
    $('[data-ldf="t-agree"]').innerHTML = '<thead><tr><th>Method</th><th class="r">AUC</th><th class="r">κ (current threshold)</th><th class="r">Manual criticism judged negative</th><th class="r">Manual praise judged positive</th><th class="r">"Softened criticism" judged negative</th><th class="r">"Points out AI" judged negative</th><th class="r">"Concession praise" judged positive</th></tr></thead><tbody>' +
      METH.map(mm => { const t = st.thr[mm.k], share = (arr, want) => { const a = arr.filter(c => c[mm.k] != null); return a.length ? a.filter(c => predict(mm, c[mm.k], t) === want).length/a.length : NaN; };
        return `<tr${mm.k===m.k?' style="background:var(--ldf-hl)"':''}><td>${esc(mm.lab)}</td><td class="r">${AUCS[mm.k].toFixed(2)}</td><td class="r">${kappa(mm, t).toFixed(2)}</td><td class="r">${pct(share(MDIR.filter(NEG),'neg'))}</td><td class="r">${pct(share(MDIR.filter(POS),'pos'))}</td><td class="r">${pct(share(MREL.filter(c=>c.ev==='H-'),'neg'))}</td><td class="r">${pct(share(MREL.filter(c=>c.ev==='MK'),'neg'))}</td><td class="r">${pct(share(MREL.filter(c=>c.ev==='C+'),'pos'))}</td></tr>`; }).join('') + '</tbody>';
    // confusion
    const cols = m.three ? [['pos','judged positive'],['neu','judged neutral'],['neg','judged negative']] : [['pos','judged approving'],['neg','judged disapproving']];
    $('[data-ldf="t-conf"]').innerHTML = '<thead><tr><th>Manual coding ↓</th>' + cols.map(c => `<th class="r">${c[1]}</th>`).join('') + '<th class="r">n</th></tr></thead><tbody>' +
      EVAL.map(([k, l]) => { const a = MREL.filter(c => c.ev === k && c[m.k] != null); const cnt = Object.fromEntries(cols.map(c => [c[0], a.filter(x => predict(m, x[m.k], thr) === c[0]).length]));
        return `<tr><td>${esc(l)}</td>` + cols.map(c => { const v = a.length ? cnt[c[0]]/a.length : 0, col = vir(v*0.9); return `<td class="r" style="background:${col};color:${lum(col)>.55?'#1a1a1a':'#fff'}">${pct(v)} <span style="font-size:.8em">(${cnt[c[0]]})</span></td>`; }).join('') + `<td class="r dim">${a.length}</td></tr>`; }).join('') + '</tbody>';
  }
  buttons(ctl, 'Method', METH.map(m => [m.k, m.lab]), st, 'm', draw);
  buttons(ctl, 'Overlay', [['none','None'],['median','Median'],['box','Box']], st, 'ov', draw);
  ctl.appendChild(thrRow);
  $('[data-ldf="m-thr"]').addEventListener('input', e => { st.thr[st.m] = +e.target.value; draw(); });
  $('[data-ldf="m-reset"]').addEventListener('click', () => { st.thr[st.m] = M().thr; draw(); });
  draw();
})();

/* =============== 18 method trend + politeness =============== */
(function(){
  const sec = $('[data-ldf="mtrend"]'), st = {m:['man','nli','rob','vt']};
  const COL = {man:'#1a1a1a', vf:TAB10[2], vt:TAB10[2], tf:TAB10[8], tt:TAB10[8], rob:TAB10[1], nli:TAB10[4]};
  const OPTS = [['man','Manual coding']].concat(METH.map(m => [m.k, m.lab]));
  function draw(){ const G = PERIODS;
    const series = st.m.map(k => ({name: (OPTS.find(o=>o[0]===k)||[0,k])[1], color: k==='man' ? 'var(--ldf-ink)' : COL[k], dash: (k==='vf'||k==='tf') ? '5 4' : null,
      pts: G.map(p => { const s = MDIR.filter(c => p.lds.includes(c.ld)); if (k === 'man') return {k: s.filter(NEG).length, n: s.length}; const m = METH.find(x => x.k===k); const a = s.filter(c => c[k] != null); return {k: a.filter(c => predict(m, c[k], m.thr) === 'neg').length, n: a.length}; })}));
    legend($('.legend', sec), series.map((s,i) => [st.m[i], s.name, s.color]));
    lines($('.fig', sec), G.map(p => p.lab), series, {pct:true, band:false, ymax:.8, h:300}); }
  buttons($('.ctl', sec), 'Lines', OPTS, st, 'm', draw, true);
  draw();
  // politeness
  const pst = {base:'neg'}; const POLL = [['hedge','Softening words (maybe, I think…)'],['apology','Apology'],['gratitude','Thanks'],['disclaimer','Disclaimer (I don\'t mind…)'],['counter','Contrast (but, though…)'],['conditional','Condition (if it\'s…)'],['question','Question mark'],['2nd_person','Addresses "you"'],['praise_outside_target','Praise elsewhere in the comment']];
  function drawPol(){ const base = MREL.filter(pst.base === 'neg' ? NEG : pst.base === 'pos' ? POS : (c => c.ev === 'MK'));
    heat($('[data-ldf="t-pol"]'), POLL.map(([k,l]) => ({key:k, lab:l})), PERIODS.map(p => ({lab:p.lab, sub:'n = ' + base.filter(c => p.lds.includes(c.ld)).length, p})), (r, c) => { const i = D.pol.indexOf(r.key), s = base.filter(x => c.p.lds.includes(x.ld)); if (!s.length) return {text:'–'}; const k = s.filter(x => x.pol[i] === '1').length;
      return {text: pct(k/s.length), tip:`${k} of ${s.length}`, color: s.length < 15 ? null : vir(Math.min(1, k/s.length/0.7))}; }, {foot:'Columns with fewer than 15 comments are left uncoloured.'}); }
  buttons($('[data-ldf="polctl"]'), 'Comments', [['neg','Criticism (softened or direct)'],['mk','"Points out AI"'],['pos','Praise']], pst, 'base', drawPol);
  drawPol();
})();

/* =============== 19 concordance =============== */
(function(){
  const sec = $('[data-ldf="conc"]'), ctl = $('.ctl', sec), PER = 25; let page = 0;
  const mk = (id, lab, opts) => { const l = document.createElement('label'); l.className = 'ck'; l.innerHTML = `${esc(lab)} <select data-ldf="${id}">${opts.map(([v,t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select>`; return l; };
  const row = document.createElement('div'); row.className = 'row';
  row.appendChild(mk('q-ld', 'Event', [['','All']].concat(PERIODS.map(p => [p.k, p.lab])).concat(LDS.map(l => ['ld'+l, 'LD'+l]))));
  row.appendChild(mk('q-ev', 'Judgement', [['','All']].concat(EVAL.map(e => [e[0], e[1]]))));
  row.appendChild(mk('q-act', 'Act', [['','All']].concat(ACTS)));
  row.appendChild(mk('q-use', 'Use', [['','All']].concat(USES)));
  const s = document.createElement('label'); s.className = 'ck'; s.innerHTML = '<input type="search" data-ldf="q-text" placeholder="Search text" size="16">'; row.appendChild(s);
  ctl.appendChild(row);
  const cutL = t => t.length > 54 ? '…' + t.slice(-52).replace(/^\S*\s/, '') : t, cutR = t => t.length > 56 ? t.slice(0, 54).replace(/\s\S*$/, '') + '…' : t;
  redrawers.conc = function(fromChart){
    if (fromChart === true){ page = 0; $('[data-ldf="q-ev"]').value = FX.ev || ''; $('[data-ldf="q-act"]').value = FX.act || ''; $('[data-ldf="q-ld"]').value = FX.gkey || ''; }
    const lv = $('[data-ldf="q-ld"]').value, ev = $('[data-ldf="q-ev"]').value, act = $('[data-ldf="q-act"]').value, use = $('[data-ldf="q-use"]').value, q = $('[data-ldf="q-text"]').value.trim().toLowerCase();
    const per = PERIODS.find(p => p.k === lv);
    const S = sel().filter(c => (!lv || (per ? per.lds.includes(c.ld) : 'ld'+c.ld === lv)) && (!ev || c.ev === ev) && (!act || c.acts.includes(act)) && (!use || c.uses.includes(use)) && (!q || (c.L+c.K+c.R+c.game).toLowerCase().includes(q)));
    const np = Math.max(1, Math.ceil(S.length/PER)); page = Math.min(Math.max(0, page), np-1);
    const ecol = Object.fromEntries(EVAL.map(e => [e[0], e[2]]));
    $('[data-ldf="t-conc"]').innerHTML = '<thead><tr><th>LD</th><th>Judgement</th><th class="r">…</th><th>keyword</th><th>…</th><th>Game</th></tr></thead><tbody>' +
      S.slice(page*PER, page*PER+PER).map(c => `<tr><td>${c.ld}</td><td title="${esc(c.acts.split('').map(a => (ACTS.find(x => x[0]===a)||[0,''])[1]).filter(Boolean).join('; '))}"><span class="chip" style="background:${ecol[c.ev]}"></span>${esc(EVL[c.ev])}</td>` +
        `<td class="L" title="${esc(c.L)}">${esc(cutL(c.L))}</td><td><span class="kw">${esc(c.K)}</span></td><td class="R" title="${esc(c.R)}">${esc(cutR(c.R))}</td>` +
        `<td><a href="https://ldjam.com${esc(c.path)}" target="_blank" rel="noopener">${esc((c.game||'').slice(0,26))}</a></td></tr>`).join('') + '</tbody>';
    $('[data-ldf="pg-info"]').textContent = `${S.length} comments · page ${page+1} of ${np}`;
    $('[data-ldf="pg-prev"]').disabled = page === 0; $('[data-ldf="pg-next"]').disabled = page >= np-1;
    const f = []; if (lv) f.push($('[data-ldf="q-ld"]').selectedOptions[0].textContent); if (ev) f.push(EVL[ev]); if (act) f.push((ACTS.find(a => a[0]===act)||[0,act])[1]); if (use) f.push((USES.find(u => u[0]===use)||[0,use])[1]); if (q) f.push('"' + q + '"');
    $('[data-ldf="conc-flag"]').innerHTML = f.length ? 'Filtered: ' + esc(f.join(' · ')) + ' <button type="button" data-ldf="q-clear">clear</button>' : '';
    const b = $('[data-ldf="q-clear"]'); if (b) b.addEventListener('click', () => { ['[data-ldf="q-ld"]','[data-ldf="q-ev"]','[data-ldf="q-act"]','[data-ldf="q-use"]'].forEach(i => $(i).value = ''); $('[data-ldf="q-text"]').value = ''; FX.ev = FX.act = FX.gkey = null; redrawers.acts(); redrawers.conc(); });
    if (fromChart === true) sec.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  };
  ['[data-ldf="q-ld"]','[data-ldf="q-ev"]','[data-ldf="q-act"]','[data-ldf="q-use"]'].forEach(i => $(i).addEventListener('change', () => { page = 0; redrawers.conc(); }));
  $('[data-ldf="q-text"]').addEventListener('input', () => { page = 0; redrawers.conc(); });
  $('[data-ldf="pg-prev"]').addEventListener('click', () => { page--; redrawers.conc(); });
  $('[data-ldf="pg-next"]').addEventListener('click', () => { page++; redrawers.conc(); });
})();

/* =============== 20 posts =============== */
(function(){
  const sec = $('[data-ldf="posts"]'), st = {ld:'all', k:'love', dir:-1, q:''}, PER = 25; let page = 0;
  const P = D.posts.map(p => ({ld:p[0], name:p[1], url:p[2], date:p[3], love:p[4], com:p[5], author:p[6]}));
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = '<span class="lab">Event</span><select data-ldf="pp-ld"><option value="all">All</option>' + LDS.map(l => `<option value="${l}">LD${l}</option>`).join('') + '</select> <label class="ck" style="margin-left:1rem"><input type="search" data-ldf="pp-q" placeholder="Search titles" size="16"></label>';
  $('.ctl', sec).appendChild(row);
  function draw(){ const S = P.filter(p => (st.ld === 'all' || p.ld === +st.ld) && (!st.q || (p.name + p.author).toLowerCase().includes(st.q))).sort((a,b) => (a[st.k] > b[st.k] ? 1 : a[st.k] < b[st.k] ? -1 : 0) * st.dir);
    const np = Math.max(1, Math.ceil(S.length/PER)); page = Math.min(Math.max(0, page), np-1);
    const cols = [['ld','Event'],['date','Date'],['name','Title'],['author','Author'],['love','♥'],['com','Comments']];
    $('[data-ldf="t-posts"]').innerHTML = '<thead><tr>' + cols.map(([k,l]) => `<th class="sort${['love','com'].includes(k)?' r':''}" data-k="${k}">${l}${st.k===k?(st.dir>0?' ↑':' ↓'):''}</th>`).join('') + '</tr></thead><tbody>' +
      S.slice(page*PER, page*PER+PER).map(p => `<tr><td>LD${p.ld}</td><td class="dim">${p.date}</td><td class="wrap"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></td><td class="dim">${esc(p.author)}</td><td class="r">${p.love}</td><td class="r">${p.com}</td></tr>`).join('') + '</tbody>';
    $('[data-ldf="t-posts"]').querySelectorAll('th.sort').forEach(th => th.addEventListener('click', () => { if (st.k === th.dataset.k) st.dir *= -1; else { st.k = th.dataset.k; st.dir = ['love','com','ld','date'].includes(st.k) ? -1 : 1; } page = 0; draw(); }));
    $('[data-ldf="pp-info"]').textContent = `${S.length} posts · page ${page+1} of ${np}`; $('[data-ldf="pp-prev"]').disabled = page === 0; $('[data-ldf="pp-next"]').disabled = page >= np-1; }
  $('[data-ldf="pp-ld"]').addEventListener('change', e => { st.ld = e.target.value; page = 0; draw(); });
  $('[data-ldf="pp-q"]').addEventListener('input', e => { st.q = e.target.value.trim().toLowerCase(); page = 0; draw(); });
  $('[data-ldf="pp-prev"]').addEventListener('click', () => { page--; draw(); }); $('[data-ldf="pp-next"]').addEventListener('click', () => { page++; draw(); });
  draw();
})();

redrawShared();
}

const start = () => fetch(SRC).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(D => roots.forEach(r => { try { init(r, D); } catch (e) { console.error('[ldai-full]', e); } }))
  .catch(e => { console.error('[ldai-full] could not load data', e); holders.forEach(n => { n.textContent = 'Could not load the figure data.'; }); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
