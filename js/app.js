/* ============================================================
   NECSTORY — application logic (multi-page)
   Pages: home (index.html), stories (stories.html), about (about.html).
   The story reader is fully IN-APP: full text is fetched from the
   source API into the modal. No external redirects for reading.
   Live sources: Wikipedia API (hi/en), Creepypasta Fandom API,
   bundled GitHub datasets.
   ============================================================ */
'use strict';

const $ = (id) => document.getElementById(id);
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PAGE = (document.body && document.body.dataset.page) || 'home';

/* ---------------- API helpers ---------------- */
async function apiGet(base, params) {
  const q = new URLSearchParams(Object.assign({}, NEC_CONFIG.apiParams, params));
  const r = await fetch(`${base}?${q}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
function extractYear(t) {
  const m = (t || '').match(/\b(1[0-9]{3}|20[0-2][0-9])\b/g);
  if (!m) return null;
  const ys = m.map(Number).filter((y) => y >= 1000 && y <= 2026);
  return ys.length ? Math.min(...ys) : null;
}
function cleanWiki(wt) {
  return wt
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[Category:[^\]]*\]\]/gi, '')
    .replace(/\[\[File:[^\]]*\]\]/gi, '')
    .replace(/\[\[Image:[^\]]*\]\]/gi, '')
    .replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, (m, g) => g.split('|').pop())
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/^==+[^=]+==+\s*$/gm, '')
    .replace(/''+/g, '')
    .replace(/^\*+\s*/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------------- source fetchers ---------------- */
async function wikiSearch(q, lang, n) {
  const d = await apiGet(NEC_CONFIG.wikipedia(lang),
    { action: 'query', list: 'search', srsearch: q, srlimit: n });
  return (d.query.search || []).map((s) => ({ title: s.title, lang, kind: 'wiki' }));
}
async function wikiExtract(title, lang, chars) {
  const d = await apiGet(NEC_CONFIG.wikipedia(lang),
    { action: 'query', prop: 'extracts', exintro: 0, explaintext: 1, exchars: chars || 2500, titles: title });
  const pages = d.query.pages;
  const p = pages[Object.keys(pages)[0]];
  if (!p || p.missing || !p.extract || p.extract.length < 200) return null;
  if (/^List of /.test(p.title)) return null;
  return {
    title: p.title, text: p.extract, kind: 'wiki', lang,
    src: lang === 'hi' ? 'Wikipedia Hindi' : 'Wikipedia EN',
    year: extractYear(p.extract),
  };
}
async function fandomList(cat, n) {
  const d = await apiGet(NEC_CONFIG.fandom,
    { action: 'query', list: 'categorymembers', cmtitle: 'Category:' + cat, cmtype: 'page', cmlimit: n });
  return (d.query.categorymembers || []).map((m) => ({ title: m.title, kind: 'fandom' }));
}
async function fandomStory(title, chars) {
  const d = await apiGet(NEC_CONFIG.fandom, { action: 'parse', page: title, prop: 'wikitext' });
  if (d.error) return null;
  const text = cleanWiki(d.parse.wikitext['*']).slice(0, chars || 2500);
  if (text.length < 200) return null;
  return { title, text, kind: 'fandom', src: 'Creepypasta Wiki', year: null };
}
async function hydrate(item) {
  try {
    if (item.kind === 'wiki') return await wikiExtract(item.title, item.lang);
    if (item.kind === 'fandom') return await fandomStory(item.title);
  } catch (e) { return null; }
  return null;
}

/* Full text, fetched lazily when the reader opens — stays in-app. */
async function fetchFullText(item) {
  try {
    if (item.kind === 'wiki') {
      const f = await wikiExtract(item.title, item.lang, 30000);
      if (f && f.text) return f.text;
    } else if (item.kind === 'fandom') {
      const f = await fandomStory(item.title, 30000);
      if (f && f.text) return f.text;
    }
  } catch (e) { /* fall through to excerpt */ }
  return item.text;
}

/* ---------------- categories ---------------- */
const CATEGORIES = [
  {
    id: 'ghost', icon: 'ghost', label: 'Ghost Stories',
    desc: 'Haunted forts, cursed villages & real paranormal locations.',
    tag: 'LIVE · WIKIPEDIA', sub: 'Haunted places of India & the world — fetched live from Wikipedia.',
    async load(query) {
      const lists = query
        ? [await wikiSearch(query, 'en', 10).catch(() => [])]
        : await Promise.all([
            wikiSearch('haunted place India', 'en', 8).catch(() => []),
            wikiSearch('भूत', 'hi', 4).catch(() => []),
          ]);
      const items = lists.flat();
      const out = await Promise.allSettled(items.slice(0, 14).map(hydrate));
      return out.map((s) => s.value).filter(Boolean);
    },
  },
  {
    id: 'crime', icon: 'crime', label: 'Crime Stories',
    desc: 'Unsolved murders & true-crime cases that baffle investigators.',
    tag: 'LIVE · WIKIPEDIA', sub: 'Real unsolved cases — from Black Dahlia to D.B. Cooper era files.',
    async load(query) {
      const items = await wikiSearch(query || 'unsolved murder', 'en', 10).catch(() => []);
      const out = await Promise.allSettled(items.slice(0, 12).map(hydrate));
      return out.map((s) => s.value).filter(Boolean);
    },
  },
  {
    id: 'darkweb', icon: 'darkweb', label: 'Dark Web',
    desc: 'Cursed files, deep-web mysteries & internet horror tales.',
    tag: 'LIVE · CREEPYPASTA', sub: 'Dark-web horror vault — the internet\u2019s scariest stories.',
    async load(query) {
      let titles = await fandomList('Computers and Internet', 40).catch(() => []);
      if (query) {
        const q = query.toLowerCase();
        titles = titles.filter((t) => t.title.toLowerCase().includes(q));
      }
      const out = await Promise.allSettled(titles.slice(0, 10).map(hydrate));
      return out.map((s) => s.value).filter(Boolean);
    },
  },
  {
    id: 'mystery', icon: 'mystery', label: 'Mystery & Unsolved',
    desc: 'Disappearances & unexplained events the world never solved.',
    tag: 'LIVE · MULTI-SOURCE', sub: 'Vanished people, impossible events — mystery archive.',
    async load(query) {
      const [a, b] = await Promise.all([
        (async () => {
          const items = await wikiSearch(query || 'unsolved mystery', 'en', 7).catch(() => []);
          const out = await Promise.allSettled(items.slice(0, 8).map(hydrate));
          return out.map((s) => s.value).filter(Boolean);
        })(),
        (async () => {
          let titles = await fandomList('Disappearances', 30).catch(() => []);
          if (query) {
            const q = query.toLowerCase();
            titles = titles.filter((t) => t.title.toLowerCase().includes(q));
          }
          const out = await Promise.allSettled(titles.slice(0, 6).map(hydrate));
          return out.map((s) => s.value).filter(Boolean);
        })(),
      ]);
      return [...a, ...b];
    },
  },
  {
    id: 'seeds', icon: 'seeds', label: 'Horror Seeds',
    desc: '2,000 razor-sharp two-line horror sparks. Pure nightmare fuel.',
    tag: 'BUNDLED · GITHUB', sub: 'Two-sentence horror seeds — perfect video hooks & shorts ideas.',
    async load(query) {
      let arr = HORROR_SEEDS;
      if (query) {
        const q = query.toLowerCase();
        arr = arr.filter((s) => (s.t + ' ' + s.b).toLowerCase().includes(q));
      } else {
        arr = [...arr].sort(() => Math.random() - 0.5);
      }
      return arr.slice(0, 24).map((s) => ({
        title: s.t, text: `${s.t} ${s.b}`, kind: 'bundled',
        src: 'Horror Seeds · GitHub', year: null, score: s.s,
      }));
    },
  },
  {
    id: 'classics', icon: 'classics', label: 'Hindi Classics',
    desc: '53 public-domain Hindi masterpieces. Copyright-free forever.',
    tag: 'BUNDLED · GITHUB', sub: 'Classic Hindi literature — read, adapt & narrate freely.',
    async load(query) {
      let arr = HINDI_CLASSICS;
      if (query) {
        const q = query.toLowerCase();
        arr = arr.filter((c) => c.t.toLowerCase().includes(q)).slice(0, 24);
      }
      return arr.map((c) => ({
        title: `Hindi Classic — Kahani ${String(c.n + 1).padStart(2, '0')}`,
        text: c.t, kind: 'bundled', src: 'Hindi Classics · Public Domain', year: null,
      }));
    },
  },
];

/* ---------------- state + rendering (stories page) ---------------- */
const state = { cat: 'ghost', catIcon: 'ghost', items: [], loading: false };

function badgeHTML(it) {
  let h = `<span class="badge src">${esc(it.src)}</span>`;
  if (it.year) h += `<span class="badge year">${it.year}</span>`;
  if (it.score) h += `<span class="badge">${it.score} votes</span>`;
  return h;
}
function renderStories(items) {
  const grid = $('storyGrid');
  if (!items.length) {
    grid.innerHTML = `<div class="empty">Nothing found in this realm. Try another search.</div>`;
    return;
  }
  grid.innerHTML = items.map((it, i) => `
    <article class="story-card glass" style="animation-delay:${Math.min(i * 60, 600)}ms">
      <div class="story-top">
        <span class="story-ic">${ICONS[state.catIcon] || ''}</span>
        <div class="badges">${badgeHTML(it)}</div>
      </div>
      <h3>${esc(it.title)}</h3>
      <p class="excerpt">${esc(it.text.slice(0, 220))}…</p>
      <button class="read-btn" data-i="${i}">READ FULL STORY
        <span class="ic" style="width:14px;height:14px">${ICONS.book}</span>
      </button>
    </article>`).join('');
  grid.querySelectorAll('.read-btn').forEach((b) =>
    b.addEventListener('click', () => openStory(items[+b.dataset.i])));
}

async function loadCategory(catId, query) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat || state.loading) return;
  state.loading = true;
  state.cat = catId;
  state.catIcon = cat.icon;
  $('exploreSub').textContent = cat.sub;
  document.querySelectorAll('.cat-pill').forEach((el) =>
    el.classList.toggle('active', el.dataset.cat === catId));
  const st = $('status');
  st.className = 'status';
  st.textContent = query ? `Searching for "${query}"…` : 'Summoning stories…';
  $('storyGrid').innerHTML = '';
  try {
    const items = await cat.load(query);
    state.items = items;
    st.textContent = items.length ? `${items.length} stories unearthed` : '';
    if (!items.length) { st.className = 'status err'; st.textContent = 'The void returned nothing. Try another search.'; }
    renderStories(items);
  } catch (e) {
    st.className = 'status err';
    st.textContent = 'Connection to the source failed. Check internet & retry.';
    renderStories([]);
  }
  state.loading = false;
}

/* ---------------- modal: fully in-app reader ---------------- */
function openStory(it, dramatic) {
  $('modalTitle').textContent = it.title;
  $('modalBadges').innerHTML = badgeHTML(it);
  $('modalSrcLine').textContent = 'Source: ' + it.src;
  const body = $('modalBody');
  const ov = $('modalOverlay');
  ov.classList.add('open');
  const modal = ov.querySelector('.modal');
  modal.classList.remove('reveal-story');
  if (dramatic) { void modal.offsetWidth; modal.classList.add('reveal-story'); }
  document.body.style.overflow = 'hidden';
  body.scrollTop = 0;
  if (it.kind === 'bundled' || it._full) {
    body.textContent = it._full || it.text;
  } else {
    body.innerHTML = '<div class="loading-story"><span class="spin"></span>Summoning the full story…</div>';
    fetchFullText(it).then((t) => {
      it._full = t;
      if (ov.classList.contains('open') && $('modalTitle').textContent === it.title) {
        body.textContent = t;
        body.scrollTop = 0;
      }
    });
  }
}
function closeModal() {
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function surprise() {
  const st = $('status');
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  st.className = 'status';
  st.textContent = `The darkness chose: ${cat.label}…`;
  let items = state.cat === cat.id && state.items.length ? state.items : await cat.load();
  if (!items.length) { st.textContent = 'The void returned nothing. Try again.'; return; }
  if (state.cat !== cat.id) {
    state.cat = cat.id; state.catIcon = cat.icon; state.items = items;
    $('exploreSub').textContent = cat.sub;
    document.querySelectorAll('.cat-pill').forEach((el) =>
      el.classList.toggle('active', el.dataset.cat === cat.id));
    renderStories(items);
  }
  st.textContent = '';
  openStory(items[Math.floor(Math.random() * items.length)], true);
}

/* ---------------- category cards (home page) ---------------- */
function buildCatCards() {
  const grid = $('catGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((c) => `
    <a class="cat-card glass reveal" data-cat="${c.id}" href="stories.html?cat=${c.id}">
      <div class="cat-ic">${ICONS[c.icon]}</div>
      <h3>${c.label}</h3>
      <p>${c.desc}</p>
      <span class="cat-count">${c.tag}</span>
    </a>`).join('');
}

/* ---------------- category pills (stories page) ---------------- */
function buildCatPills() {
  const bar = $('catPills');
  if (!bar) return;
  bar.innerHTML = CATEGORIES.map((c) => `
    <button class="cat-pill ${c.id === state.cat ? 'active' : ''}" data-cat="${c.id}">
      <span class="ic" style="width:15px;height:15px">${ICONS[c.icon]}</span>${c.label}
    </button>`).join('');
  bar.querySelectorAll('.cat-pill').forEach((el) =>
    el.addEventListener('click', () => { $('searchInput').value = ''; loadCategory(el.dataset.cat); }));
}

/* ---------------- animations ---------------- */
function initEmbers() {
  const cv = $('embers');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, ps = [];
  function resize() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
  }
  resize(); addEventListener('resize', resize);
  const N = Math.min(90, Math.floor(innerWidth / 14));
  for (let i = 0; i < N; i++) ps.push(spawn(true));
  function spawn(any) {
    return {
      x: Math.random() * W, y: any ? Math.random() * H : H + 10,
      r: Math.random() * 2.2 + 0.6, s: Math.random() * 0.5 + 0.18,
      o: Math.random() * 0.5 + 0.15, ph: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.75 ? 4 + Math.random() * 10 : 0,
    };
  }
  (function tick(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.y -= p.s; p.x += Math.sin(t / 1600 + p.ph) * 0.25;
      if (p.y < -12) Object.assign(p, spawn(false));
      const fl = 0.7 + 0.3 * Math.sin(t / 300 + p.ph);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 85%, 55%, ${p.o * fl})`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 50%, .8)`;
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  })(0);
}
function initTyper() {
  const el = $('typer');
  if (!el) return;
  const lines = [
    'Haunted places. Unsolved crimes. Dark web tales.',
    'Real stories — no login, no paywall.',
    '53 Hindi classics. 2,000 horror seeds.',
    'Built for storytellers of the dark.',
  ];
  let li = 0, ci = 0, del = false;
  (function type() {
    const line = lines[li];
    el.textContent = line.slice(0, ci);
    if (!del && ci < line.length) { ci++; setTimeout(type, 42); }
    else if (!del) { del = true; setTimeout(type, 1900); }
    else if (ci > 0) { ci--; setTimeout(type, 20); }
    else { del = false; li = (li + 1) % lines.length; setTimeout(type, 350); }
  })();
}
function initReveal() {
  const io = new IntersectionObserver((es) =>
    es.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
    { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
function markActiveNav() {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === PAGE) a.classList.add('active');
  });
}

/* ---------------- init ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  mountIcons();
  const logo = $('logoIcon');
  if (logo) logo.innerHTML = ICONS.logo;
  initEmbers();
  initReveal();
  markActiveNav();

  const goSurprise = () => { location.href = 'stories.html?surprise=1'; };

  if (PAGE === 'home') {
    initTyper();
    buildCatCards();
    const hr = $('heroRandom'); if (hr) hr.addEventListener('click', goSurprise);
    const nr = $('navRandom'); if (nr) nr.addEventListener('click', goSurprise);
  }

  if (PAGE === 'stories') {
    buildCatPills();
    $('modalClose').addEventListener('click', closeModal);
    $('modalOverlay').addEventListener('click', (e) => {
      if (e.target === $('modalOverlay')) closeModal();
    });
    $('modalNext').addEventListener('click', surprise);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
    $('surpriseBtn').addEventListener('click', surprise);
    const nr = $('navRandom'); if (nr) nr.addEventListener('click', surprise);
    let deb;
    $('searchInput').addEventListener('input', (e) => {
      clearTimeout(deb);
      deb = setTimeout(() => loadCategory(state.cat, e.target.value.trim() || undefined), 600);
    });
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat');
    const startCat = CATEGORIES.some((c) => c.id === cat) ? cat : 'ghost';
    loadCategory(startCat).then(() => {
      if (params.get('surprise') === '1') surprise();
    });
  }

  if (PAGE === 'about') {
    const nr = $('navRandom'); if (nr) nr.addEventListener('click', goSurprise);
  }
});
