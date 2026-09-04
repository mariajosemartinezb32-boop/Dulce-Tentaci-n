/**
 * Módulo de Punto de Venta (POS) y Caja Rápida
 * Panadería y Repostería El Nuevo Milenio
 * Permite al personal del mostrador registrar ventas rápidas, calcular cambio e imprimir tickets.
 */

class BakeryPOS {
  constructor() {
    this.currentSaleItems = [];
    this.salesHistory = this.loadSalesHistory();
  }

  loadSalesHistory() {
    try {
      const saved = localStorage.getItem('milenio_pos_sales');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveSalesHistory() {
    try {
      localStorage.setItem('milenio_pos_sales', JSON.stringify(this.salesHistory));
    } catch (e) {
      console.error(e);
    }
  }

  addToSale(productId, qty = 1) {
    const product = BAKERY_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.currentSaleItems.find(i => i.id === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.currentSaleItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty
      });
    }
    this.renderPOSCart();
  }

  updateItemQty(index, qty) {
    if (this.currentSaleItems[index]) {
      if (qty <= 0) {
        this.currentSaleItems.splice(index, 1);
      } else {
        this.currentSaleItems[index].quantity = qty;
      }
      this.renderPOSCart();
    }
  }

  clearSale() {
    this.currentSaleItems = [];
    this.renderPOSCart();
  }

  getTotals() {
    const total = this.currentSaleItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    return {
      total,
      formattedTotal: '$' + total.toLocaleString('es-CO')
    };
  }

  completeSale(paymentData) {
    const totals = this.getTotals();
    if (totals.total === 0) return null;

    const saleRecord = {
      id: 'FAC-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      items: [...this.currentSaleItems],
      total: totals.total,
      paymentMethod: paymentData.method || 'Efectivo',
      receivedAmount: Number(paymentData.receivedAmount || totals.total),
      change: Number(paymentData.receivedAmount || totals.total) - totals.total,
      cashier: paymentData.cashier || 'Cajero 1'
    };

    this.salesHistory.unshift(saleRecord);
    this.saveSalesHistory();
    this.clearSale();
    return saleRecord;
  }

  getTodayStats() {
    const today = new Date().toDateString();
    const todaySales = this.salesHistory.filter(s => new Date(s.date).toDateString() === today);
    const totalMoney = todaySales.reduce((acc, s) => acc + s.total, 0);
    const totalOrders = todaySales.length;

    return {
      totalMoney,
      totalMoneyFormatted: '$' + totalMoney.toLocaleString('es-CO'),
      totalOrders,
      todaySales
    };
  }

  renderPOSCart() {
    const posCartEl = document.getElementById('pos-cart-list');
    const posTotalEl = document.getElementById('pos-total-amount');
    if (!posCartEl || !posTotalEl) return;

    if (this.currentSaleItems.length === 0) {
      posCartEl.innerHTML = `
        <div class="pos-empty-cart">
          <span>🛒</span>
          <p>Selecciona productos en el mostrador para armar la venta</p>
        </div>
      `;
      posTotalEl.innerText = '$0';
      return;
    }

    posCartEl.innerHTML = this.currentSaleItems.map((item, index) => `
      <div class="pos-cart-row">
        <div class="pos-item-info">
          <strong>${item.name}</strong>
          <span>$${item.price.toLocaleString('es-CO')} c/u</span>
        </div>
        <div class="pos-qty-controls">
          <button type="button" onclick="bakeryPOS.updateItemQty(${index}, ${item.quantity - 1})">-</button>
          <span>${item.quantity}</span>
          <button type="button" onclick="bakeryPOS.updateItemQty(${index}, ${item.quantity + 1})">+</button>
        </div>
        <div class="pos-item-subtotal">
          $${(item.price * item.quantity).toLocaleString('es-CO')}
        </div>
        <button type="button" class="pos-del-btn" onclick="bakeryPOS.updateItemQty(${index}, 0)">✕</button>
      </div>
    `).join('');

    const totals = this.getTotals();
    posTotalEl.innerText = totals.formattedTotal;
  }
}

const bakeryPOS = new BakeryPOS();
