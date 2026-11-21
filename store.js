// Public, read-only catalog access shared with Aphotic Hub.
window.YoungRessStore = (() => {
  const store = 'https://zxeuoqrnwxopohtcbhep.supabase.co';
  const key = 'sb_publishable_4vWXSIQDY0aYhfaKtc3ZuA_cvWQo3yP';
  const products = Object.freeze({
    ironglass: Object.freeze({ name: 'IRON & GLASS', price: 33, image: 'img/ironglass.jpg', description: 'Preamp, EQ and tube optical compressor', format: 'Windows VST3 · macOS VST3 and AU' }),
    air: Object.freeze({ name: 'AIR', price: 10, image: 'img/air-card.png', description: 'One-knob air enhancer', format: 'Windows VST3 · macOS VST3 and AU' }),
    vantavox: Object.freeze({ name: 'VANTA VOX', price: 45, image: 'img/vantavox.jpg', description: 'Vocal rack: tuning, dynamics, EQ, effects, reverb and delay', format: 'Windows VST3 · macOS VST3 and AU' }),
    santa: Object.freeze({ name: 'SANTA', price: 30, image: 'img/santa.jpg', description: 'Stereo chorus pedal with tube drive', format: 'Windows VST3 · macOS VST3 and AU' }),
    sope: Object.freeze({ name: 'SOPE', price: 30, image: 'img/sope.jpg', description: 'Semi-modular synthesizer with patch cables', format: 'Windows VST3 · macOS VST3 and AU' }),
    hadal: Object.freeze({ name: 'HADAL', price: 30, image: 'img/hadal.jpg', description: 'Dual reverb pedal with twelve machines', format: 'Windows VST3 · macOS VST3 and AU' }),
    tapeorbit: Object.freeze({ name: 'TAPE ORBIT', price: 20, image: 'img/tapeorbit.jpg', description: 'Three-head tape echo with spring reverb', format: 'Windows VST3' }),
    abyss: Object.freeze({ name: 'ABYSS DUAL', price: 30, image: 'img/abyss.jpg', description: 'Two-channel tube limiter with optical and FET stages', format: 'Windows VST3' }),
    tube50: Object.freeze({ name: 'TUBE 50', price: 30, image: 'img/tube50.jpg', description: 'Fifty valves, each in its own simulated circuit', format: 'Windows VST3' }),
    trench: Object.freeze({ name: 'TRENCH', price: 45, image: 'img/trench.jpg', description: 'One-knob preamp saturator', format: 'Windows VST3' }),
    jermy: Object.freeze({ name: 'JERMY', price: 50, image: 'img/jermy.jpg', description: 'Eight-circuit distortion with a monkey on its display', format: 'Windows VST3' }),
  });
  async function catalog() {
    const response = await fetch(store + '/rest/v1/products?select=*', { headers: { apikey: key }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Catalog unavailable');
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid catalog');
    return rows;
  }
  function checkoutUrl(row, product) {
    if (!row || row.published !== true || row.free !== false || row.coming_soon !== false || typeof row.price_label !== 'string') return null;
    if (!new RegExp('^\\$' + product.price + '(?:\\.00)?(?: USD)?$').test(row.price_label.trim())) return null;
    try {
      const url = new URL(row.buy_url);
      if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.gumroad\.com$/i.test(url.hostname) || url.username || url.password || url.port || url.hash || !/^\/l\/[a-z0-9_-]+\/?$/i.test(url.pathname)) return null;
      // Checkout destinations and amounts must be configured by the store, not overridden in a catalog link.
      if ([...url.searchParams.keys()].some((key) => /success_url|redirect|price/i.test(key))) return null;
      return url;
    } catch { return null; }
  }
  return Object.freeze({ products, catalog, checkoutUrl });
})();
