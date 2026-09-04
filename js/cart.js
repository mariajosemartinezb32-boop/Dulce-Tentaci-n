/**
 * Carrito de compras y checkout por WhatsApp
 * Panadería El Nuevo Milenio
 */

class BakeryCart {
  constructor() {
    this.items = this.loadCart();
    this.deliveryType = 'delivery'; // 'delivery' o 'pickup'
    this.paymentMethod = 'Efectivo';
    this.deliveryFee = BAKERY_CONFIG.deliveryCost;
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('milenio_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('milenio_cart', JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving cart', e);
    }
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.items, this.getTotals()));
  }

  addItem(productId, quantity = 1, notes = '', customOptions = null) {
    const product = BAKERY_PRODUCTS.find(p => p.id === productId);
    if (!product) return false;

    // Check if identical item already in cart
    const existingIndex = this.items.findIndex(
      item => item.id === productId && item.notes === notes && JSON.stringify(item.customOptions) === JSON.stringify(customOptions)
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        quantity: quantity,
        notes: notes,
        customOptions: customOptions
      });
    }

    this.saveCart();
    return true;
  }

  updateQuantity(index, quantity) {
    if (this.items[index]) {
      if (quantity <= 0) {
        this.items.splice(index, 1);
      } else {
        this.items[index].quantity = quantity;
      }
      this.saveCart();
    }
  }

  removeItem(index) {
    if (this.items[index]) {
      this.items.splice(index, 1);
      this.saveCart();
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
  }

  setDeliveryType(type) {
    this.deliveryType = type;
    this.notifyListeners();
  }

  setPaymentMethod(method) {
    this.paymentMethod = method;
    this.notifyListeners();
  }

  getTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = this.deliveryType === 'delivery' && subtotal > 0 ? this.deliveryFee : 0;
    const total = subtotal + shipping;

    return {
      count,
      subtotal,
      shipping,
      total,
      subtotalFormatted: this.formatMoney(subtotal),
      shippingFormatted: this.formatMoney(shipping),
      totalFormatted: this.formatMoney(total)
    };
  }

  formatMoney(amount) {
    return '$' + amount.toLocaleString('es-CO');
  }

  /**
   * Genera el mensaje optimizado para WhatsApp y abre el enlace
   */
  generateWhatsAppOrder(customerData) {
    const totals = this.getTotals();
    if (this.items.length === 0) return false;

    const dateStr = new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let msg = `🥐 *¡HOLA! DESEO HACER UN PEDIDO EN PANADERÍA EL NUEVO MILENIO* 🥖\n`;
    msg += `📅 *Fecha:* ${dateStr}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `📋 *DETALLE DE MI PEDIDO:*\n`;
    this.items.forEach((item, idx) => {
      const itemSub = item.price * item.quantity;
      msg += `▪️ *${item.quantity}x* ${item.name}\n`;
      msg += `   └ Precio: $${item.price.toLocaleString('es-CO')} c/u = *$${itemSub.toLocaleString('es-CO')}*\n`;
      if (item.notes) {
        msg += `   └ 📝 *Nota:* _${item.notes}_\n`;
      }
      if (item.customOptions) {
        msg += `   └ 🎨 *Detalles:* ${Object.entries(item.customOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
      }
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *RESUMEN DE PAGO:*\n`;
    msg += `▪️ *Subtotal:* ${totals.subtotalFormatted}\n`;
    if (this.deliveryType === 'delivery') {
      msg += `▪️ *Domicilio:* ${totals.shippingFormatted}\n`;
    } else {
      msg += `▪️ *Tipo Entrega:* 🏬 Retiro en Tienda (Sin costo)\n`;
    }
    msg += `⭐ *TOTAL A PAGAR:* *${totals.totalFormatted}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👤 *DATOS DEL CLIENTE:*\n`;
    msg += `▪️ *Nombre:* ${customerData.name || 'No especificado'}\n`;
    msg += `▪️ *Teléfono:* ${customerData.phone || 'No especificado'}\n`;
    
    if (this.deliveryType === 'delivery') {
      msg += `▪️ *Modalidad:* 🛵 Domicilio\n`;
      msg += `▪️ *Dirección:* ${customerData.address || 'No especificada'}\n`;
      if (customerData.neighborhood) {
        msg += `▪️ *Barrio / Sector:* ${customerData.neighborhood}\n`;
      }
      if (customerData.reference) {
        msg += `▪️ *Punto de referencia:* ${customerData.reference}\n`;
      }
    } else {
      msg += `▪️ *Modalidad:* 🏬 Recoger en Panadería (Calle Principal #12-34)\n`;
      if (customerData.pickupTime) {
        msg += `▪️ *Hora estimada de retiro:* ${customerData.pickupTime}\n`;
      }
    }

    msg += `▪️ *Método de Pago:* 💳 ${customerData.paymentMethod || this.paymentMethod}\n`;
    if (customerData.cashAmount && customerData.paymentMethod === 'Efectivo') {
      msg += `▪️ *Paga con billete de:* $${Number(customerData.cashAmount).toLocaleString('es-CO')} (Requiero cambio)\n`;
    }
    if (customerData.generalNotes) {
      msg += `▪️ *Instrucciones especiales:* ${customerData.generalNotes}\n`;
    }

    msg += `\n✨ *¡Muchas gracias! Quedo a la espera de su confirmación para preparar el pedido.* ✨`;

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${BAKERY_CONFIG.whatsappNumber}&text=${encodedMsg}`;
    
    return {
      message: msg,
      url: whatsappUrl
    };
  }
}

// Instancia global
const bakeryCart = new BakeryCart();
