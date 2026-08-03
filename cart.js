let cart = JSON.parse(localStorage.getItem('bakery_cart')) || [];

function updateCartCount() {
    const counts = document.querySelectorAll('.cart-count');
    counts.forEach(c => c.textContent = cart.length);
}

function addToCart(name, price) {
    cart.push({ name, price });
    localStorage.setItem('bakery_cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${name} ha sido agregado al carrito!`);
}

function getCartTotal() {
    return cart.reduce((total, item) => total + item.price, 0);
}

// Initialize count
document.addEventListener('DOMContentLoaded', updateCartCount);
