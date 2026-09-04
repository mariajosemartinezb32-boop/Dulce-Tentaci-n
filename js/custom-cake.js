/**
 * Cotizador y Diseñador de Tortas Personalizadas
 * Panadería y Repostería El Nuevo Milenio
 */

class CakeCustomizer {
  constructor() {
    this.basePrices = {
      portions_10: 45000,
      portions_15: 55000,
      portions_20: 68000,
      portions_30: 95000,
      portions_50: 150000
    };

    this.spongeAddons = {
      vainilla: 0,
      chocolate: 2000,
      red_velvet: 5000,
      tres_leches: 6000,
      naranja_amapola: 4000
    };

    this.fillings = {
      arequipe: 0,
      crema_pastelera: 0,
      frutos_rojos: 4000,
      chocolate_ganache: 4000,
      fresas_crema: 5000,
      maracuya_mousse: 5000
    };

    this.decorations = {
      chantilly_frutas: 5000,
      fondant_tematico: 15000,
      drip_chocolate: 6000,
      topper_personalizado: 8000,
      impresion_comestible: 12000
    };
  }

  calculateEstimate(formData) {
    const portionsKey = formData.portions || 'portions_15';
    let total = this.basePrices[portionsKey] || 55000;

    // Sponge
    if (formData.sponge && this.spongeAddons[formData.sponge]) {
      total += this.spongeAddons[formData.sponge];
    }

    // Filling
    if (formData.filling && this.fillings[formData.filling]) {
      total += this.fillings[formData.filling];
    }

    // Decoration options
    if (Array.isArray(formData.decorations)) {
      formData.decorations.forEach(dec => {
        if (this.decorations[dec]) {
          total += this.decorations[dec];
        }
      });
    }

    return {
      total,
      formattedTotal: '$' + total.toLocaleString('es-CO')
    };
  }

  generateWhatsAppQuote(formData) {
    const calc = this.calculateEstimate(formData);

    let msg = `🎂 *¡HOLA! DESEO COTIZAR UNA TORTA PERSONALIZADA* 🎨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📋 *ESPECIFICACIONES DE LA TORTA:*\n`;
    msg += `▪️ *Tamaño / Porciones:* ${formData.portionsText || formData.portions}\n`;
    msg += `▪️ *Sabor de Bizcocho:* ${formData.spongeText || formData.sponge}\n`;
    msg += `▪️ *Relleno:* ${formData.fillingText || formData.filling}\n`;
    msg += `▪️ *Temática / Diseño:* ${formData.theme || 'Diseño de la casa / A definir'}\n`;
    
    if (formData.dedication) {
      msg += `▪️ *Mensaje en la torta:* "${formData.dedication}"\n`;
    }

    if (formData.decorationsList && formData.decorationsList.length > 0) {
      msg += `▪️ *Decoraciones adicionales:* ${formData.decorationsList.join(', ')}\n`;
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *PRESUPUESTO ESTIMADO:* *${calc.formattedTotal}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👤 *DATOS DE CONTACTO:*\n`;
    msg += `▪️ *Nombre:* ${formData.name || 'Cliente'}\n`;
    msg += `▪️ *Teléfono:* ${formData.phone || 'No especificado'}\n`;
    msg += `▪️ *Fecha del evento / entrega:* ${formData.eventDate || 'Por coordinar'}\n`;
    
    if (formData.additionalNotes) {
      msg += `▪️ *Detalles adicionales:* ${formData.additionalNotes}\n`;
    }

    msg += `\n🍰 _(Adjuntaré foto o imagen de referencia a continuación de este mensaje)_ ✨`;

    const encoded = encodeURIComponent(msg);
    return `https://api.whatsapp.com/send?phone=${BAKERY_CONFIG.whatsappNumber}&text=${encoded}`;
  }
}

const cakeCustomizer = new CakeCustomizer();
