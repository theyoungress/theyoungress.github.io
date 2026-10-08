// Public, read-only catalog access shared with Young Ress Hub.
window.YoungRessStore = (() => {
  const store = 'https://zxeuoqrnwxopohtcbhep.supabase.co';
  const key = 'sb_publishable_4vWXSIQDY0aYhfaKtc3ZuA_cvWQo3yP';
  const products = Object.freeze({
    ironglass: Object.freeze({ name: 'IRON & GLASS', price: 33, image: 'img/ironglass.jpg', description: 'Preamp, EQ and tube optical compressor', format: 'VST3 · Windows 10 or 11 (64-bit)' }),
    air: Object.freeze({ name: 'AIR', price: 30, image: 'img/air-card.png', description: 'One-knob air enhancer', format: 'VST3 · Windows 10 or 11 (64-bit)' }),
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
      if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.lemonsqueezy\.com$/i.test(url.hostname) || url.username || url.password || url.port || url.hash || !/^\/buy\/[a-z0-9_-]+\/?$/i.test(url.pathname)) return null;
      // Checkout destinations and amounts must be configured by the store, not overridden in a catalog link.
      if ([...url.searchParams.keys()].some((key) => /success_url|redirect|price/i.test(key))) return null;
      return url;
    } catch { return null; }
  }
  return Object.freeze({ products, catalog, checkoutUrl });
})();
