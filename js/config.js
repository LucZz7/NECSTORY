/* ============================================================
   NECSTORY — API endpoint configuration
   ------------------------------------------------------------
   Every source below is a PUBLIC, KEYLESS API.
   No API keys, no tokens, no login required — endpoints are
   called directly from the browser with CORS enabled (origin=*).
   ============================================================ */
const NEC_CONFIG = {
  // MediaWiki API — Wikipedia (Hindi + English editions)
  wikipedia: (lang) => `https://${lang}.wikipedia.org/w/api.php`,

  // MediaWiki API — Creepypasta Wiki (Fandom)
  // Genre categories: Ghosts, Crime, Computers and Internet,
  // Disappearances, History
  fandom: 'https://creepypasta.fandom.com/api.php',

  // Project Gutenberg — public-domain book catalog search page
  // (books are pre-1930, copyright-free worldwide)
  gutenbergSearch: (query) =>
    `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}`,

  // Bundled GitHub datasets (offline, shipped with the site)
  // - twosentencehorror-dataset (Apache-2.0): 2,000 top horror seeds
  // - hindi-discourse (MIT): 53 public-domain Hindi classics
  datasets: {
    horrorSeeds: 'HORROR_SEEDS',     // window global from js/data-seeds.js
    hindiClassics: 'HINDI_CLASSICS'  // window global from js/data-classics.js
  },

  apiParams: { format: 'json', origin: '*' } // CORS for browser calls
};
