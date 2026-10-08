(() => {
  const id = new URLSearchParams(location.search).get('product');
  const product = Object.hasOwn(YoungRessStore.products, id) ? YoungRessStore.products[id] : null;
  const button = document.getElementById('pay-button');
  const status = document.getElementById('checkout-status');
  const fallback = document.getElementById('checkout-fallback');
  let buyUrl = null;
  let complete = false;
  const unavailable = (message) => { button.disabled = true; button.textContent = 'Checkout unavailable'; status.textContent = message; };
  if (!product) {
    if (id === 'trinity') {
      document.getElementById('product-name').textContent = 'TRINITY is free.';
      document.getElementById('product-description').textContent = 'Download Young Ress Hub and create an account to install TRINITY for free.';
      document.getElementById('checkout-free').hidden = false;
    }
    unavailable('Choose a paid plug-in from the store. TRINITY is free in Young Ress Hub.');
    return;
  }
  document.title = product.name + ' checkout | Young Ress';
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-price').textContent = '$' + product.price;
  document.getElementById('product-description').textContent = product.description;
  document.getElementById('product-format').textContent = product.format;
  const image = document.getElementById('product-image');
  image.src = product.image;
  image.alt = product.name + ' interface';
  document.getElementById('product-media').hidden = false;
  YoungRessStore.catalog().then((rows) => {
    buyUrl = YoungRessStore.checkoutUrl(rows.find((row) => row.id === id), product);
    if (!buyUrl) return unavailable('Checkout is not available yet. Please check back soon or email support.');
    button.disabled = false;
    button.textContent = 'Continue to secure checkout';
    status.textContent = 'Pay securely with Lemon Squeezy. Your final total is shown before you pay.';
  }).catch(() => unavailable('We could not check payment availability. Refresh to try again, or email support.'));

  let sdkPromise;
  function paymentSdk() {
    if (window.LemonSqueezy) return Promise.resolve(window.LemonSqueezy);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => { script.remove(); reject(new Error('Checkout timed out')); }, 10000);
      script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
      script.onload = () => {
        clearTimeout(timer);
        try {
          if (window.createLemonSqueezy) window.createLemonSqueezy();
          if (!window.LemonSqueezy) throw new Error('Checkout unavailable');
          resolve(window.LemonSqueezy);
        } catch (error) { reject(error); }
      };
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Checkout unavailable')); };
      document.head.append(script);
    }).catch((error) => { sdkPromise = null; throw error; });
    return sdkPromise;
  }
  button.addEventListener('click', async () => {
    if (!buyUrl || button.disabled || complete) return;
    button.disabled = true;
    status.textContent = 'Opening secure checkout…';
    fallback.hidden = true;
    try {
      const sdk = await paymentSdk();
      sdk.Setup({ eventHandler: (event) => {
        if (event.event !== 'Checkout.Success') return;
        complete = true;
        button.disabled = true;
        button.textContent = 'Checkout complete';
        status.textContent = 'Your payment is being confirmed. Continue in Young Ress Hub with the same email.';
        fallback.hidden = true;
        const confirmation = document.getElementById('checkout-complete');
        confirmation.hidden = false;
        confirmation.focus();
      } });
      const overlayUrl = new URL(buyUrl);
      overlayUrl.searchParams.set('embed', '1');
      sdk.Url.Open(overlayUrl.href);
      status.textContent = 'Secure checkout is open. Finish your purchase with Lemon Squeezy.';
    } catch {
      status.textContent = 'Could not open secure checkout here. Try again or use the secure checkout link below.';
      fallback.href = buyUrl.href;
      fallback.hidden = false;
    } finally { button.disabled = complete; }
  });
})();
