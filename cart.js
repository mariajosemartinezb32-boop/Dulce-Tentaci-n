// DULCE TENTACIÓN - CART JS (Sistema Completo del Carrito de Compras)

const CART_STORAGE_KEY = 'bakery_cart';

/**
 * Obtiene la lista actual de productos del carrito desde localStorage.
 * @returns {Array} Array de objetos de producto.
 */
function getCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error al leer el carrito desde localStorage:', e);
        return [];
    }
}

/**
 * Guarda el arreglo del carrito en localStorage y actualiza toda la interfaz.
 * @param {Array} cart - Arreglo con la lista de productos.
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error al guardar el carrito en localStorage:', e);
    }
    updateCartUI();
}

/**
 * Obtiene la cantidad total de artículos agregados (suma de cantidades).
 * @returns {number} Cantidad total de productos.
 */
function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
}

/**
 * Obtiene el total monetario a pagar.
 * @returns {number} Suma del subtotal/total.
 */
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return total + (price * qty);
    }, 0);
}

/**
 * Formatea un número en pesos colombianos (COP).
 * @param {number} amount - Precio a formatear.
 * @returns {string} Cadena formateada.
 */
function formatPrice(amount) {
    const num = Number(amount) || 0;
    return '$ ' + num.toLocaleString('es-CO');
}

/**
 * Agrega un producto al carrito o incrementa su cantidad si ya existe.
 * Soporta llamadas con (id, name, price, image) o (name, price) u objetos.
 */
function addToCart(idOrName, nameArg, priceArg, imageArg) {
    let id, name, price, image;

    if (typeof idOrName === 'object' && idOrName !== null) {
        id = idOrName.id || idOrName.dataset?.id;
        name = idOrName.name || idOrName.dataset?.name;
        price = idOrName.price || idOrName.dataset?.price;
        image = idOrName.image || idOrName.dataset?.image;
    } else if (nameArg !== undefined && typeof priceArg === 'number') {
        // Formato: addToCart('pan-alillado', 'Pan Alillado', 3500, 'images/alillado.jpeg')
        id = idOrName;
        name = nameArg;
        price = priceArg;
        image = imageArg;
    } else if (typeof idOrName === 'string' && typeof nameArg === 'number') {
        // Formato legacy: addToCart('Pan Alillado', 3500)
        name = idOrName;
        price = nameArg;
        id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        image = priceArg || 'images/alillado.jpeg';
    } else {
        id = idOrName;
        name = nameArg || idOrName;
        price = priceArg || 0;
        image = imageArg;
    }

    if (!id) {
        id = name ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : 'prod-' + Date.now();
    }
    
    price = parseFloat(price) || 0;
    image = image || 'images/alillado.jpeg';

    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === id || item.name === name);

    if (existingIndex > -1) {
        cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity) || 1) + 1;
        if (image && (!cart[existingIndex].image || cart[existingIndex].image === 'images/alillado.jpeg')) {
            cart[existingIndex].image = image;
        }
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    saveCart(cart);
    showToast(`¡Producto Agregado!`, `"${name}" se añadió al carrito.`, image);
    animateCartBadge();
}

/**
 * Elimina completamente un producto del carrito por su ID o Nombre.
 * @param {string} id - ID del producto.
 */
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id && item.name !== id);
    saveCart(cart);
}

/**
 * Actualiza la cantidad exacta de un producto en el carrito.
 * @param {string} id - ID del producto.
 * @param {number} newQuantity - Nueva cantidad.
 */
function updateQuantity(id, newQuantity) {
    let cart = getCart();
    const qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty <= 0) {
        removeFromCart(id);
        return;
    }

    const item = cart.find(item => item.id === id || item.name === id);
    if (item) {
        item.quantity = qty;
        saveCart(cart);
    }
}

/**
 * Modifica la cantidad de un producto sumando o restando un valor delta (+1 o -1).
 * @param {string} id - ID del producto.
 * @param {number} delta - Variación (+1 / -1).
 */
function changeQuantity(id, delta) {
    let cart = getCart();
    const item = cart.find(item => item.id === id || item.name === id);
    if (item) {
        const newQty = (parseInt(item.quantity) || 1) + delta;
        updateQuantity(id, newQty);
    }
}

/**
 * Vacía completamente el carrito de compras.
 */
function clearCart() {
    if (getCart().length === 0) return;
    if (confirm('¿Deseas vaciar todos los productos del carrito?')) {
        saveCart([]);
        showToast('Carrito vaciado', 'Se han eliminado todos los productos.', null);
    }
}

/**
 * Envía la orden de compra directamente a WhatsApp con el resumen formateado.
 * @param {Event} e - Evento de formulario (opcional).
 */
function confirmOrder(e) {
    if (e) e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de confirmar el pedido.');
        return;
    }

    // Obtener campos del formulario si existe en la página de checkout
    const nameInput = document.getElementById('customer-name');
    const addressInput = document.getElementById('customer-address');
    const notesInput = document.getElementById('customer-notes');

    const customerName = nameInput ? nameInput.value.trim() : '';
    const customerAddress = addressInput ? addressInput.value.trim() : '';
    const customerNotes = notesInput ? notesInput.value.trim() : '';

    let message = `*¡Hola, Dulce Tentación!* 🥖🎂\n`;
    message += `Quiero realizar el siguiente pedido:\n\n`;

    cart.forEach((item, index) => {
        const itemSubtotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
        message += `${index + 1}. *${item.name}* x${item.quantity} = ${formatPrice(itemSubtotal)}\n`;
    });

    const total = getCartTotal();
    message += `\n*TOTAL A PAGAR: ${formatPrice(total)}*\n`;

    if (customerName) message += `\n👤 *Cliente:* ${customerName}`;
    if (customerAddress) message += `\n📍 *Dirección:* ${customerAddress}`;
    if (customerNotes) message += `\n📝 *Notas:* ${customerNotes}`;

    message += `\n\nQuedo atento a su confirmación. ¡Muchas gracias!`;

    const whatsappUrl = `https://wa.me/573105731569?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Actualiza el contador de la barra de navegación y las vistas abiertas.
 */
function updateCartUI() {
    const totalCount = getCartCount();
    const counts = document.querySelectorAll('.cart-count');

    counts.forEach(badge => {
        badge.textContent = totalCount;
        if (totalCount > 0) {
            badge.classList.remove('hidden');
        }
    });

    renderCartDrawer();
    renderCartPage();
}

/**
 * Efecto visual en los contadores cuando cambia la cantidad.
 */
function animateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(badge => {
        badge.classList.add('badge-bump');
        setTimeout(() => badge.classList.remove('badge-bump'), 300);
    });
}

/**
 * Muestra una notificación emergente (Toast) flotante.
 */
function showToast(title, message, image) {
    let container = document.getElementById('cart-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cart-toast-container';
        container.className = 'cart-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        ${image ? `<img src="${image}" alt="${title}" class="cart-toast-img">` : '<div class="cart-toast-icon"><i class="fa-solid fa-check"></i></div>'}
        <div class="cart-toast-body">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <button class="cart-toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Inyecta y gestiona el Drawer Modal lateral del carrito en cualquier página.
 */
function injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const drawerHTML = `
        <div id="cart-drawer-overlay" class="cart-drawer-overlay" onclick="closeCartDrawer()"></div>
        <aside id="cart-drawer" class="cart-drawer" aria-label="Carrito de Compras">
            <div class="cart-drawer-header">
                <h3><i class="fa-solid fa-cart-shopping"></i> Tu Carrito (<span class="cart-count">0</span>)</h3>
                <button class="cart-drawer-close" onclick="closeCartDrawer()" title="Cerrar">&times;</button>
            </div>
            <div id="cart-drawer-items" class="cart-drawer-body">
                <!-- Se llena dinámicamente -->
            </div>
            <div class="cart-drawer-footer">
                <div class="cart-summary-row">
                    <span>Subtotal:</span>
                    <strong id="cart-drawer-subtotal">$ 0</strong>
                </div>
                <div class="cart-summary-row total-row">
                    <span>Total a Pagar:</span>
                    <strong id="cart-drawer-total" class="cart-total-price">$ 0</strong>
                </div>
                <div class="cart-drawer-actions">
                    <button class="btn btn-primary btn-block" onclick="confirmOrder()">
                        <i class="fa-brands fa-whatsapp"></i> Enviar Encargo por WhatsApp
                    </button>
                    <a href="cart.html" class="btn btn-outline btn-block" onclick="closeCartDrawer()">
                        Ver Carrito Detallado
                    </a>
                </div>
            </div>
        </aside>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);
}

function openCartDrawer(e) {
    if (e) e.preventDefault();
    injectCartDrawer();
    renderCartDrawer();
    document.getElementById('cart-drawer-overlay')?.classList.add('active');
    document.getElementById('cart-drawer')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    document.getElementById('cart-drawer-overlay')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleCartDrawer(e) {
    if (e) e.preventDefault();
    const drawer = document.getElementById('cart-drawer');
    if (drawer && drawer.classList.contains('active')) {
        closeCartDrawer();
    } else {
        openCartDrawer(e);
    }
}

/**
 * Renderiza la lista de productos dentro del Drawer Modal lateral.
 */
function renderCartDrawer() {
    const container = document.getElementById('cart-drawer-items');
    if (!container) return;

    const cart = getCart();
    const subtotalEl = document.getElementById('cart-drawer-subtotal');
    const totalEl = document.getElementById('cart-drawer-total');
    const total = getCartTotal();

    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state">
                <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                <p>Tu carrito está vacío</p>
                <a href="products.html" class="btn btn-outline" style="margin-top: 15px;" onclick="closeCartDrawer()">Ver Productos</a>
            </div>
        `;
        return;
    }

    let itemsHTML = '';
    cart.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemSubtotal = itemPrice * (parseInt(item.quantity) || 1);

        itemsHTML += `
            <div class="cart-drawer-item">
                <img src="${item.image || 'images/alillado.jpeg'}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-unit-price">${formatPrice(itemPrice)} c/u</span>
                    <div class="cart-item-controls">
                        <button onclick="changeQuantity('${item.id}', -1)" title="Disminuir">&minus;</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', this.value)">
                        <button onclick="changeQuantity('${item.id}', 1)" title="Aumentar">&plus;</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <span class="cart-item-subtotal">${formatPrice(itemSubtotal)}</span>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Eliminar del carrito">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = itemsHTML;
}

/**
 * Renderiza la vista detallada del carrito en la página dedicada (cart.html).
 */
function renderCartPage() {
    const tableBody = document.getElementById('cart-table-body');
    const pageSubtotal = document.getElementById('cart-page-subtotal');
    const pageTotal = document.getElementById('cart-page-total');
    const pageCount = document.getElementById('cart-page-count');

    if (!tableBody) return; // No estamos en cart.html

    const cart = getCart();
    const total = getCartTotal();
    const count = getCartCount();

    if (pageSubtotal) pageSubtotal.textContent = formatPrice(total);
    if (pageTotal) pageTotal.textContent = formatPrice(total);
    if (pageCount) pageCount.textContent = count;

    if (cart.length === 0) {
        document.getElementById('cart-content-wrapper')?.classList.add('hidden');
        document.getElementById('cart-empty-wrapper')?.classList.remove('hidden');
        return;
    }

    document.getElementById('cart-content-wrapper')?.classList.remove('hidden');
    document.getElementById('cart-empty-wrapper')?.classList.add('hidden');

    let rowsHTML = '';
    cart.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemSubtotal = itemPrice * (parseInt(item.quantity) || 1);

        rowsHTML += `
            <tr class="cart-table-row">
                <td class="col-product">
                    <div class="product-detail-flex">
                        <img src="${item.image || 'images/alillado.jpeg'}" alt="${item.name}" class="table-img">
                        <div>
                            <h4>${item.name}</h4>
                            <span class="mobile-price">${formatPrice(itemPrice)}</span>
                        </div>
                    </div>
                </td>
                <td class="col-price">${formatPrice(itemPrice)}</td>
                <td class="col-quantity">
                    <div class="quantity-picker">
                        <button onclick="changeQuantity('${item.id}', -1)">&minus;</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', this.value)">
                        <button onclick="changeQuantity('${item.id}', 1)">&plus;</button>
                    </div>
                </td>
                <td class="col-subtotal">${formatPrice(itemSubtotal)}</td>
                <td class="col-action">
                    <button class="btn-icon-delete" onclick="removeFromCart('${item.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHTML;
}

// INICIALIZACIÓN AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    // Inyectar el Drawer lateral para que esté listo en todas las páginas
    injectCartDrawer();

    // Actualizar la interfaz
    updateCartUI();

    // Event listener delegado para capturar clicks en botones de "Agregar al carrito"
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-cart, [data-id]');
        if (btn) {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = btn.dataset.price;
            const image = btn.dataset.image;

            if (id || name) {
                e.preventDefault();
                addToCart(id, name, price, image);
            }
        }
    });

    // Escuchar click en iconos de carrito con clase .cart-icon
    document.querySelectorAll('.cart-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer(e);
        });
    });
});
