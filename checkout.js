(() => {
  const id = new URLSearchParams(location.search).get('product');
  const product = Object.hasOwn(YoungRessStore.products, id) ? YoungRessStore.products[id] : null;
  const button = document.getElementById('pay-button');
  const status = document.getElementById('checkout-status');
  let buyUrl = null;
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
    status.textContent = 'Pay securely with Gumroad. Your final total, including any tax, is shown before you pay.';
  }).catch(() => unavailable('We could not check payment availability. Refresh to try again, or email support.'));

  // Gumroad's own checkout page (?wanted=true opens the payment form straight away). Coming back
  // with the browser's Back button restores this page, so the button is switched back on.
  button.addEventListener('click', () => {
    if (!buyUrl || button.disabled) return;
    button.disabled = true;
    status.textContent = 'Opening secure checkout…';
    const checkout = new URL(buyUrl);
    checkout.searchParams.set('wanted', 'true');
    window.open(checkout.href, '_self');
  });
  window.addEventListener('pageshow', () => { if (buyUrl) button.disabled = false; });
})();
