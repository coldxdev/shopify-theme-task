document.addEventListener('DOMContentLoaded', () => {
  const lookbookModalElem = document.querySelector('.lookbook-modal');
  const formElems = lookbookModalElem.querySelectorAll('form');
  const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

  const onSubmit = (e) => {
    e.preventDefault();

    const currentForm = e.target;
    let isError = false;
    const submitButton = currentForm.querySelector('.lookbook-product__button');
    submitButton.classList.add('loading');
    submitButton.querySelector('.loading__spinner').classList.remove('hidden');

    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData(currentForm);
    if (cart) {
      formData.append(
        'sections',
        cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      cart.setActiveElement(document.activeElement);
    }

    config.body = formData;

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          publish(PUB_SUB_EVENTS.cartError, {
            source: 'product-form',
            productVariantId: formData.get('id'),
            errors: response.errors || response.description,
            message: response.message,
          });
          isError = true;
          return;
        }

        if (!isError) {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'product-form',
            productVariantId: formData.get('id'),
            cartData: response,
          });
          isError = false;
        }

        cart.renderContents(response);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        submitButton.classList.remove('loading');
        submitButton.querySelector('.loading__spinner').classList.add('hidden');
      });
  };

  formElems.forEach((form) => {
    form.addEventListener('submit', onSubmit);
  });
});
