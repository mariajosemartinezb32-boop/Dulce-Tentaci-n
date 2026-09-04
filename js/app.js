/**
 * Aplicación Principal - Panadería y Repostería El Nuevo Milenio
 * Control de UI, Catálogo, Búsqueda, Modales y Eventos
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let currentCategory = 'all';
let searchQuery = '';

function initApp() {
  renderCategories();
  renderProducts();
  setupEventListeners();
  setupCartUI();
  setupCakeCustomizerUI();
  setupPOSUI();
  checkBakeryOpenStatus();
  renderReviews();
}

/**
 * Renderizado de Categorías
 */
function renderCategories() {
  const categoriesContainer = document.getElementById('categories-container');
  if (!categoriesContainer) return;

  const categories = [
    { id: 'all', name: 'Todos los Productos', icon: '✨', count: BAKERY_PRODUCTS.length },
    { id: 'panaderia', name: 'Panadería & Hojaldres', icon: '🥖', count: BAKERY_PRODUCTS.filter(p => p.category === 'panaderia').length },
    { id: 'galletas', name: 'Galletas & Repostería', icon: '🍪', count: BAKERY_PRODUCTS.filter(p => p.category === 'galletas').length },
    { id: 'postres', name: 'Postres & Tortas', icon: '🍰', count: BAKERY_PRODUCTS.filter(p => p.category === 'postres').length },
    { id: 'tortas', name: 'Tortas de Celebración', icon: '🎂', count: BAKERY_PRODUCTS.filter(p => p.category === 'tortas').length },
    { id: 'combos', name: 'Combos & Promos', icon: '🌟', count: BAKERY_PRODUCTS.filter(p => p.category === 'combos').length }
  ];

  categoriesContainer.innerHTML = categories.map(cat => `
    <button class="category-btn ${currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
      <span class="cat-icon">${cat.icon}</span>
      <span class="cat-name">${cat.name}</span>
      <span class="cat-badge">${cat.count}</span>
    </button>
  `).join('');

  // Event listeners for categories
  categoriesContainer.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      categoriesContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderProducts();
    });
  });
}

/**
 * Renderizado de la Cuadrícula de Productos
 */
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count-label');
  if (!grid) return;

  let filtered = BAKERY_PRODUCTS.filter(p => {
    const matchCategory = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (countEl) {
    countEl.innerText = `Mostrando ${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products-found">
        <div class="no-prod-icon">🔍🥖</div>
        <h3>No encontramos productos con ese término</h3>
        <p>Intenta con otra palabra clave o selecciona otra categoría.</p>
        <button class="btn btn-outline" onclick="resetFilters()">Ver todos los productos</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-wrap" onclick="openProductModal('${product.id}')">
        <img src="${encodeURI(product.image)}" alt="${product.name}" loading="lazy" class="product-img" onerror="this.src='pan-casero-dorado.jpeg'">
        <div class="product-badges">
          <span class="badge badge-${product.badgeType}">${product.badge}</span>
          ${product.isFreshToday ? '<span class="badge badge-today">🌿 Recién Salido</span>' : ''}
        </div>
        <div class="product-quick-view-overlay">
          <span>Ver Detalles 👀</span>
        </div>
      </div>

      <div class="product-info">
        <div class="product-meta">
          <span class="product-cat-tag">${product.categoryName}</span>
          <div class="product-rating">
            ⭐ ${product.rating.toFixed(1)} <small>(${product.reviewsCount})</small>
          </div>
        </div>

        <h3 class="product-title" onclick="openProductModal('${product.id}')">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        
        <div class="product-portion-info">
          <span>📦 ${product.portions}</span>
        </div>

        <div class="product-footer">
          <div class="product-price-box">
            <span class="price-label">Precio</span>
            <span class="price-val">${product.priceFormatted}</span>
          </div>

          <div class="product-actions">
            <button class="btn-add-cart" onclick="quickAddToCart('${product.id}', this)" title="Agregar al carrito">
              <span class="cart-icon">🛒</span>
              <span>Pedir</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function resetFilters() {
  currentCategory = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  renderCategories();
  renderProducts();
}

/**
 * Event Listeners generales
 */
function setupEventListeners() {
  // Buscador en tiempo real
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      }
      renderProducts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderProducts();
    });
  }

  // Drawer Carrito
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const floatingCartBadge = document.getElementById('floating-cart-badge');

  const toggleCart = (open = true) => {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.toggle('open', open);
      if (cartBackdrop) cartBackdrop.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
  };

  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
  if (cartBackdrop) cartBackdrop.addEventListener('click', () => toggleCart(false));
  if (floatingCartBadge) floatingCartBadge.addEventListener('click', () => toggleCart(true));

  // Modal checkout
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const totals = bakeryCart.getTotals();
      if (totals.count === 0) {
        showToast('⚠️ Tu carrito está vacío. Agrega productos deliciosos.');
        return;
      }
      toggleCart(false);
      openCheckoutModal();
    });
  }

  if (closeCheckoutBtn && checkoutModal) {
    closeCheckoutBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Formulario Checkout
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCheckoutSubmit(checkoutForm);
    });
  }

  // Cambio de modalidad (Entrega / Retiro)
  const deliveryTypeRadios = document.querySelectorAll('input[name="delivery_option"]');
  deliveryTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      bakeryCart.setDeliveryType(e.target.value);
      const deliveryFields = document.getElementById('delivery-address-fields');
      const pickupFields = document.getElementById('pickup-info-fields');
      if (deliveryFields && pickupFields) {
        if (e.target.value === 'delivery') {
          deliveryFields.style.display = 'block';
          pickupFields.style.display = 'none';
        } else {
          deliveryFields.style.display = 'none';
          pickupFields.style.display = 'block';
        }
      }
      updateCartSummary();
    });
  });

  // Botón modo POS / Vendedor (con PIN de acceso)
  const posTriggerBtn = document.getElementById('pos-mode-btn');
  const posModal = document.getElementById('pos-modal');
  const closePosBtn = document.getElementById('close-pos-btn');
  const POS_PIN = '1234'; // ← Cambiar el PIN aquí si se desea

  if (posTriggerBtn && posModal) {
    posTriggerBtn.addEventListener('click', () => {
      const enteredPin = prompt('🔐 Acceso Cajero POS\nIngresa el PIN de 4 dígitos:');
      if (enteredPin === null) return; // canceló
      if (enteredPin !== POS_PIN) {
        showToast('❌ PIN incorrecto. Acceso denegado.');
        return;
      }
      posModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      initPOSGrid();
      updatePOSStats();
    });
  }

  if (closePosBtn && posModal) {
    closePosBtn.addEventListener('click', () => {
      posModal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
}

/**
 * UI del Carrito
 */
function setupCartUI() {
  bakeryCart.subscribe(() => {
    updateCartUI();
  });
  updateCartUI();
}

function updateCartUI() {
  const totals = bakeryCart.getTotals();
  const cartBadge = document.getElementById('cart-count-badge');
  const floatingBadge = document.getElementById('floating-cart-count');
  const cartList = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');

  if (cartBadge) cartBadge.innerText = totals.count;
  if (floatingBadge) floatingBadge.innerText = totals.count;

  if (subtotalEl) subtotalEl.innerText = totals.subtotalFormatted;
  if (shippingEl) shippingEl.innerText = totals.shippingFormatted;
  if (totalEl) totalEl.innerText = totals.totalFormatted;

  if (!cartList) return;

  if (bakeryCart.items.length === 0) {
    cartList.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon">🥐</div>
        <h4>Tu canasta está vacía</h4>
        <p>Agrega ricos panes, galletas o una deliciosa torta para continuar.</p>
        <button class="btn btn-primary" onclick="document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-backdrop').classList.remove('open');">Explorar Menú</button>
      </div>
    `;
    return;
  }

  cartList.innerHTML = bakeryCart.items.map((item, idx) => `
    <div class="cart-item-card">
      <img src="${encodeURI(item.image)}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-head">
          <h4 class="cart-item-name">${item.name}</h4>
          <button class="cart-item-remove" onclick="bakeryCart.removeItem(${idx})" title="Eliminar">🗑️</button>
        </div>
        <div class="cart-item-price-unit">$${item.price.toLocaleString('es-CO')} c/u</div>
        ${item.notes ? `<div class="cart-item-note">📝 ${item.notes}</div>` : ''}
        <div class="cart-item-bottom">
          <div class="qty-stepper">
            <button class="qty-btn" onclick="bakeryCart.updateQuantity(${idx}, ${item.quantity - 1})">-</button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn" onclick="bakeryCart.updateQuantity(${idx}, ${item.quantity + 1})">+</button>
          </div>
          <div class="cart-item-total">$${(item.price * item.quantity).toLocaleString('es-CO')}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function quickAddToCart(productId, btnElement) {
  const added = bakeryCart.addItem(productId, 1);
  if (added) {
    const product = BAKERY_PRODUCTS.find(p => p.id === productId);
    showToast(`✅ "${product ? product.name : 'Producto'}" agregado a tu canasta`);
    
    if (btnElement) {
      btnElement.classList.add('btn-added-animate');
      setTimeout(() => btnElement.classList.remove('btn-added-animate'), 600);
    }
  }
}

/**
 * Modal Detalle de Producto
 */
function openProductModal(productId) {
  const product = BAKERY_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-detail-modal');
  const container = document.getElementById('product-modal-content');
  if (!modal || !container) return;

  container.innerHTML = `
    <div class="modal-product-grid">
      <div class="modal-product-img-wrap">
        <img src="${encodeURI(product.image)}" alt="${product.name}" class="modal-prod-img">
        <span class="badge badge-${product.badgeType} modal-img-badge">${product.badge}</span>
      </div>
      <div class="modal-product-info">
        <span class="modal-cat-tag">${product.categoryName}</span>
        <h2 class="modal-prod-title">${product.name}</h2>
        <div class="modal-rating">⭐ ${product.rating.toFixed(1)} / 5.0 <span>(${product.reviewsCount} opiniones de clientes)</span></div>
        <p class="modal-prod-desc">${product.description}</p>
        
        <div class="modal-details-list">
          <div class="modal-detail-item">
            <strong>📦 Porción:</strong> <span>${product.portions}</span>
          </div>
          <div class="modal-detail-item">
            <strong>🔥 Frescura:</strong> <span>Horneado hoy con ingredientes de alta calidad</span>
          </div>
          <div class="modal-detail-item">
            <strong>🏷️ Etiquetas:</strong> <span>${product.tags.join(', ')}</span>
          </div>
        </div>

        <div class="modal-notes-field">
          <label for="modal-item-note"><strong>Instrucciones o dedicatoria especial:</strong></label>
          <input type="text" id="modal-item-note" placeholder="Ej: Sin azúcar espolvoreada, escribir 'Feliz Cumple'..." class="form-input">
        </div>

        <div class="modal-purchase-footer">
          <div class="modal-price-box">
            <span class="lbl">Precio Total</span>
            <span class="val" id="modal-calculated-price">${product.priceFormatted}</span>
          </div>

          <div class="modal-actions-wrap">
            <div class="qty-stepper modal-stepper">
              <button class="qty-btn" id="modal-qty-minus">-</button>
              <span class="qty-number" id="modal-qty-val">1</span>
              <button class="qty-btn" id="modal-qty-plus">+</button>
            </div>
            <button class="btn btn-primary btn-modal-add" id="modal-btn-confirm-add">
              🛒 Agregar a la Canasta
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyValEl = document.getElementById('modal-qty-val');
  const priceValEl = document.getElementById('modal-calculated-price');
  const minusBtn = document.getElementById('modal-qty-minus');
  const plusBtn = document.getElementById('modal-qty-plus');
  const addBtn = document.getElementById('modal-btn-confirm-add');

  const updateModalPrice = () => {
    qtyValEl.innerText = qty;
    priceValEl.innerText = '$' + (product.price * qty).toLocaleString('es-CO');
  };

  minusBtn.addEventListener('click', () => {
    if (qty > 1) {
      qty--;
      updateModalPrice();
    }
  });

  plusBtn.addEventListener('click', () => {
    qty++;
    updateModalPrice();
  });

  addBtn.addEventListener('click', () => {
    const note = document.getElementById('modal-item-note').value.trim();
    bakeryCart.addItem(product.id, qty, note);
    modal.classList.remove('open');
    document.body.style.overflow = '';
    showToast(`✅ ${qty}x "${product.name}" agregado a tu canasta`);
  });

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * Modal de Checkout
 */
function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const totals = bakeryCart.getTotals();
  const summaryEl = document.getElementById('checkout-order-summary');
  
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="checkout-items-preview">
        ${bakeryCart.items.map(item => `
          <div class="ch-row">
            <span>${item.quantity}x ${item.name}</span>
            <strong>$${(item.price * item.quantity).toLocaleString('es-CO')}</strong>
          </div>
        `).join('')}
      </div>
      <div class="ch-totals-box">
        <div class="ch-tot-row"><span>Subtotal:</span> <strong>${totals.subtotalFormatted}</strong></div>
        <div class="ch-tot-row"><span>Entrega / Domicilio:</span> <strong>${totals.shippingFormatted}</strong></div>
        <div class="ch-tot-row total-highlight"><span>Total a Pagar:</span> <strong>${totals.totalFormatted}</strong></div>
      </div>
    `;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function handleCheckoutSubmit(form) {
  const formData = new FormData(form);
  const deliveryType = document.querySelector('input[name="delivery_option"]:checked')?.value || 'delivery';
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'Efectivo';

  // ── Validación completa del formulario ──────────────────────
  const name = (formData.get('cust_name') || '').trim();
  const phone = (formData.get('cust_phone') || '').trim();
  const address = (formData.get('cust_address') || '').trim();

  if (!name || name.length < 3) {
    showToast('⚠️ Por favor ingresa tu nombre completo.');
    form.querySelector('[name="cust_name"]')?.focus();
    return;
  }
  const phoneClean = phone.replace(/\s/g, '');
  if (!phoneClean || !/^\+?[0-9]{7,15}$/.test(phoneClean)) {
    showToast('⚠️ Ingresa un número de teléfono válido (ej: 3001234567).');
    form.querySelector('[name="cust_phone"]')?.focus();
    return;
  }
  if (deliveryType === 'delivery' && (!address || address.length < 5)) {
    showToast('⚠️ Para domicilio necesitas ingresar tu dirección completa.');
    form.querySelector('[name="cust_address"]')?.focus();
    return;
  }
  // ────────────────────────────────────────────────────────────

  const customerData = {
    name,
    phone,
    deliveryType,
    address,
    neighborhood: formData.get('cust_neighborhood'),
    reference: formData.get('cust_reference'),
    pickupTime: formData.get('cust_pickuptime'),
    paymentMethod,
    cashAmount: formData.get('cust_cash_amount'),
    generalNotes: formData.get('cust_general_notes')
  };

  const result = bakeryCart.generateWhatsAppOrder(customerData);
  if (result) {
    showToast('🚀 Redirigiendo a WhatsApp con tu pedido...');
    setTimeout(() => {
      window.open(result.url, '_blank');
    }, 400);

    // Close modal
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * Diseñador y Cotizador de Tortas Personalizadas
 */
function setupCakeCustomizerUI() {
  const form = document.getElementById('custom-cake-form');
  const quoteTotalEl = document.getElementById('cake-estimate-total');
  if (!form || !quoteTotalEl) return;

  const updateCakePrice = () => {
    const selectedPortions = form.querySelector('input[name="cake_portions"]:checked')?.value || 'portions_15';
    const selectedSponge = form.querySelector('input[name="cake_sponge"]:checked')?.value || 'vainilla';
    const selectedFilling = form.querySelector('select[name="cake_filling"]')?.value || 'arequipe';
    const selectedDecos = Array.from(form.querySelectorAll('input[name="cake_decorations"]:checked')).map(cb => cb.value);

    const calc = cakeCustomizer.calculateEstimate({
      portions: selectedPortions,
      sponge: selectedSponge,
      filling: selectedFilling,
      decorations: selectedDecos
    });

    quoteTotalEl.innerText = calc.formattedTotal;
  };

  form.addEventListener('change', updateCakePrice);
  updateCakePrice();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const portionsRadio = form.querySelector('input[name="cake_portions"]:checked');
    const spongeRadio = form.querySelector('input[name="cake_sponge"]:checked');
    const fillingSelect = form.querySelector('select[name="cake_filling"]');
    const decoCheckboxes = Array.from(form.querySelectorAll('input[name="cake_decorations"]:checked'));

    const formData = {
      portions: portionsRadio?.value,
      portionsText: portionsRadio?.parentElement?.innerText?.trim(),
      sponge: spongeRadio?.value,
      spongeText: spongeRadio?.parentElement?.innerText?.trim(),
      filling: fillingSelect?.value,
      fillingText: fillingSelect?.options[fillingSelect.selectedIndex]?.text,
      decorations: decoCheckboxes.map(cb => cb.value),
      decorationsList: decoCheckboxes.map(cb => cb.parentElement?.innerText?.trim()),
      theme: form.querySelector('#cake_theme')?.value,
      dedication: form.querySelector('#cake_dedication')?.value,
      name: form.querySelector('#cake_cust_name')?.value,
      phone: form.querySelector('#cake_cust_phone')?.value,
      eventDate: form.querySelector('#cake_date')?.value,
      additionalNotes: form.querySelector('#cake_notes')?.value
    };

    const url = cakeCustomizer.generateWhatsAppQuote(formData);
    showToast('🎂 Abriendo cotización en WhatsApp...');
    setTimeout(() => {
      window.open(url, '_blank');
    }, 400);
  });
}

/**
 * Interfaz de Punto de Venta (POS)
 */
function setupPOSUI() {
  const completeSaleBtn = document.getElementById('pos-btn-complete-sale');
  const clearSaleBtn = document.getElementById('pos-btn-clear-sale');
  const printReceiptBtn = document.getElementById('pos-btn-print-receipt');
  const posSearchInput = document.getElementById('pos-search-product');
  const cashGivenInput = document.getElementById('pos-cash-given');
  const changeDueEl = document.getElementById('pos-change-due');

  if (clearSaleBtn) {
    clearSaleBtn.addEventListener('click', () => {
      bakeryPOS.clearSale();
    });
  }

  if (cashGivenInput && changeDueEl) {
    cashGivenInput.addEventListener('input', (e) => {
      const given = Number(e.target.value) || 0;
      const total = bakeryPOS.getTotals().total;
      const change = given - total;
      changeDueEl.innerText = change >= 0 ? '$' + change.toLocaleString('es-CO') : '$0';
    });
  }

  if (completeSaleBtn) {
    completeSaleBtn.addEventListener('click', () => {
      const method = document.getElementById('pos-payment-method')?.value || 'Efectivo';
      const given = Number(cashGivenInput?.value) || bakeryPOS.getTotals().total;
      
      const record = bakeryPOS.completeSale({
        method: method,
        receivedAmount: given
      });

      if (record) {
        showToast(`🎉 ¡Venta ${record.id} registrada con éxito!`);
        showPOSReceipt(record);
        updatePOSStats();
        if (cashGivenInput) cashGivenInput.value = '';
        if (changeDueEl) changeDueEl.innerText = '$0';
      } else {
        showToast('⚠️ Agrega productos al mostrador para cobrar.');
      }
    });
  }

  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      window.print();
    });
  }

  if (posSearchInput) {
    posSearchInput.addEventListener('input', (e) => {
      initPOSGrid(e.target.value.toLowerCase().trim());
    });
  }
}

function initPOSGrid(query = '') {
  const grid = document.getElementById('pos-items-grid');
  if (!grid) return;

  const filtered = BAKERY_PRODUCTS.filter(p => 
    !query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
  );

  grid.innerHTML = filtered.map(p => `
    <button class="pos-item-btn" onclick="bakeryPOS.addToSale('${p.id}')">
      <img src="${encodeURI(p.image)}" alt="${p.name}" class="pos-item-thumb">
      <div class="pos-item-text">
        <span class="pos-pname">${p.name}</span>
        <strong class="pos-pprice">${p.priceFormatted}</strong>
      </div>
    </button>
  `).join('');
}

function updatePOSStats() {
  const stats = bakeryPOS.getTodayStats();
  const salesCountEl = document.getElementById('pos-stat-count');
  const salesTotalEl = document.getElementById('pos-stat-total');
  const salesHistoryList = document.getElementById('pos-history-list');

  if (salesCountEl) salesCountEl.innerText = stats.totalOrders;
  if (salesTotalEl) salesTotalEl.innerText = stats.totalMoneyFormatted;

  if (salesHistoryList) {
    if (stats.todaySales.length === 0) {
      salesHistoryList.innerHTML = '<p class="text-muted">No hay ventas registradas hoy aún.</p>';
    } else {
      salesHistoryList.innerHTML = stats.todaySales.map(s => `
        <div class="pos-history-row">
          <div>
            <strong>${s.id}</strong> - <small>${new Date(s.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</small>
            <div>${s.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
          </div>
          <div class="text-right">
            <strong>$${s.total.toLocaleString('es-CO')}</strong>
            <small>${s.paymentMethod}</small>
          </div>
        </div>
      `).join('');
    }
  }
}

function showPOSReceipt(record) {
  const receiptContainer = document.getElementById('pos-receipt-print-area');
  if (!receiptContainer) return;

  receiptContainer.innerHTML = `
    <div class="ticket-receipt">
      <div class="ticket-header">
        <h3>PANADERÍA EL NUEVO MILENIO</h3>
        <p>Venta de Pan Fresco y Repostería</p>
        <p>NIT: <!-- ⚠️ REEMPLAZA CON TU NIT REAL -->900.123.456-7</p>
        <p>${BAKERY_CONFIG.address}</p>
        <p>Tel: ${BAKERY_CONFIG.phone}</p>
      </div>
      <div class="ticket-divider">--------------------------------</div>
      <div class="ticket-meta">
        <div><strong>Recibo:</strong> ${record.id}</div>
        <div><strong>Fecha:</strong> ${new Date(record.date).toLocaleString('es-CO')}</div>
        <div><strong>Atendió:</strong> ${record.cashier}</div>
      </div>
      <div class="ticket-divider">--------------------------------</div>
      <div class="ticket-items">
        ${record.items.map(i => `
          <div class="ticket-item-row">
            <span>${i.quantity} x ${i.name}</span>
            <span>$${(i.price * i.quantity).toLocaleString('es-CO')}</span>
          </div>
        `).join('')}
      </div>
      <div class="ticket-divider">--------------------------------</div>
      <div class="ticket-totals">
        <div class="ticket-tot-row">
          <strong>TOTAL:</strong>
          <strong>$${record.total.toLocaleString('es-CO')}</strong>
        </div>
        <div class="ticket-tot-row">
          <span>Forma de Pago:</span>
          <span>${record.paymentMethod}</span>
        </div>
        <div class="ticket-tot-row">
          <span>Recibido:</span>
          <span>$${record.receivedAmount.toLocaleString('es-CO')}</span>
        </div>
        <div class="ticket-tot-row">
          <span>Cambio / Vueltas:</span>
          <span>$${record.change.toLocaleString('es-CO')}</span>
        </div>
      </div>
      <div class="ticket-divider">--------------------------------</div>
      <div class="ticket-footer">
        <p>¡Gracias por endulzar tu día con nosotros!</p>
        <p>Pan horneado fresco todos los días 🥖❤️</p>
      </div>
    </div>
  `;
}

/**
 * Estado de Atención / Horarios
 */
function checkBakeryOpenStatus() {
  const statusBadge = document.getElementById('bakery-status-badge');
  if (!statusBadge) return;

  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  // Open 6:00 AM to 9:30 PM (21:30)
  const totalMinutes = hour * 60 + minutes;
  const openMinutes = 6 * 60;       // 6:00 AM
  const closeMinutes = 21 * 60 + 30; // 9:30 PM

  const isOpen = totalMinutes >= openMinutes && totalMinutes < closeMinutes;

  if (isOpen) {
    statusBadge.innerHTML = `<span class="status-dot dot-green"></span> <strong>Abierto Ahora:</strong> Horneando panes frescos hasta las 9:30 PM`;
  } else {
    statusBadge.innerHTML = `<span class="status-dot dot-red"></span> <strong>Cerrado por hoy:</strong> Abrimos mañana a las 6:00 AM con pan recién salido`;
  }
}

/**
 * Reseñas de Clientes
 */
function renderReviews() {
  const reviewsContainer = document.getElementById('reviews-carousel');
  if (!reviewsContainer) return;

  const reviews = [
    {
      name: "Camila Restrepo",
      stars: 5,
      comment: "¡El pan caliente recién horneado de la mañana es insuperable! Y la torta de chocolate supremo que encargué para el cumpleaños de mi esposo estaba espectacular, súper húmeda y deliciosa.",
      date: "Hace 2 días",
      tag: "Cliente Frecuente"
    },
    {
      name: "Juan David Gómez",
      stars: 5,
      comment: "Pedí por WhatsApp un surtido de panes y polvorones rojos para las onces en la oficina. Llegó súper rápido, calientito y el empaque impecable. 100% recomendados.",
      date: "Hace 5 días",
      tag: "Pedido a Domicilio"
    },
    {
      name: "Mariana Morales",
      stars: 5,
      comment: "La torta temática de TikTok quedó idéntica a lo que mi hija quería y el sabor de fresa con crema chantilly fue un éxito total. La mejor pastelería del sector.",
      date: "Hace 1 semana",
      tag: "Torta Personalizada"
    }
  ];

  reviewsContainer.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-head">
        <div class="review-user">
          <div class="user-avatar">${r.name.charAt(0)}</div>
          <div>
            <h4>${r.name}</h4>
            <span class="user-tag">${r.tag}</span>
          </div>
        </div>
        <div class="review-stars">
          ${'⭐'.repeat(r.stars)}
        </div>
      </div>
      <p class="review-comment">"${r.comment}"</p>
      <div class="review-date">${r.date}</div>
    </div>
  `).join('');
}

/**
 * Notificación Toast Flotante
 */
function showToast(message, duration = 3000) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
