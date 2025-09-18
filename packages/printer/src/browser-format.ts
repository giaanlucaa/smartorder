// Browser-kompatible Drucker-Formatierung
export interface PrintItem {
  name: string;
  quantity: number;
  modifiers?: string[];
  price?: number;
  notes?: string;
}

export interface PrintOrder {
  orderId: string;
  tableLabel: string;
  items: PrintItem[];
  timestamp: Date;
  total?: number;
}

// Browser-kompatible HTML-Formatierung für Druck
export function formatOrderForPrint(order: PrintOrder): string {
  const timestamp = order.timestamp.toLocaleString('de-DE');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Bestellung ${order.orderId}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          margin: 20px;
          color: #000;
          background: #fff;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .order-info {
          margin-bottom: 20px;
        }
        
        .items {
          margin-bottom: 20px;
        }
        
        .item {
          margin-bottom: 8px;
          padding: 5px 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .item-name {
          font-weight: bold;
        }
        
        .modifiers {
          margin-left: 20px;
          font-size: 11px;
          color: #666;
        }
        
        .quantity {
          float: right;
          font-weight: bold;
        }
        
        .total {
          border-top: 2px solid #000;
          padding-top: 10px;
          text-align: right;
          font-weight: bold;
          font-size: 14px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        
        .print-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 20px 0;
        }
        
        .print-btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SMARTORDER</h1>
        <h2>Küchenzettel</h2>
      </div>
      
      <div class="order-info">
        <strong>Bestellung:</strong> ${order.orderId}<br>
        <strong>Tisch:</strong> ${order.tableLabel}<br>
        <strong>Zeit:</strong> ${timestamp}
      </div>
      
      <div class="items">
        <h3>Bestellte Artikel:</h3>
        ${order.items.map(item => `
          <div class="item">
            <span class="quantity">${item.quantity}x</span>
            <span class="item-name">${item.name}</span>
            ${item.modifiers && item.modifiers.length > 0 ? `
              <div class="modifiers">
                ${item.modifiers.map(mod => `• ${mod}`).join('<br>')}
              </div>
            ` : ''}
            ${item.notes ? `<div class="modifiers">Notiz: ${item.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
      
      ${order.total ? `
        <div class="total">
          Gesamt: ${order.total.toFixed(2)} €
        </div>
      ` : ''}
      
      <div class="footer">
        Gedruckt am ${new Date().toLocaleString('de-DE')}
      </div>
      
      <div class="no-print">
        <button class="print-btn" onclick="window.print()">Drucken</button>
        <button class="print-btn" onclick="window.close()">Schließen</button>
      </div>
    </body>
    </html>
  `;
}

// Bestellung in neuem Fenster drucken
export function printOrderInWindow(order: PrintOrder): void {
  const html = formatOrderForPrint(order);
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  
  if (!printWindow) {
    throw new Error('Popup wurde blockiert');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Automatisch drucken nach dem Laden
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

// Bestellung als PDF herunterladen (Browser-kompatibel)
export async function downloadOrderAsPDF(order: PrintOrder): Promise<void> {
  try {
    // Verwende html2pdf.js oder ähnliche Bibliothek
    const html = formatOrderForPrint(order);
    
    // Erstelle ein temporäres Element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Verwende Browser's Print-to-PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    
    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('PDF-Download-Fehler:', error);
    throw error;
  }
}

// Bestellung als Text herunterladen
export function downloadOrderAsText(order: PrintOrder): void {
  const timestamp = order.timestamp.toLocaleString('de-DE');
  
  let text = `SMARTORDER - Küchenzettel\n`;
  text += `========================\n\n`;
  text += `Bestellung: ${order.orderId}\n`;
  text += `Tisch: ${order.tableLabel}\n`;
  text += `Zeit: ${timestamp}\n\n`;
  text += `Bestellte Artikel:\n`;
  text += `------------------\n`;
  
  order.items.forEach(item => {
    text += `${item.quantity}x ${item.name}\n`;
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(mod => {
        text += `  • ${mod}\n`;
      });
    }
    if (item.notes) {
      text += `  Notiz: ${item.notes}\n`;
    }
    text += `\n`;
  });
  
  if (order.total) {
    text += `Gesamt: ${order.total.toFixed(2)} €\n`;
  }
  
  text += `\nGedruckt am ${new Date().toLocaleString('de-DE')}\n`;
  
  // Download als .txt Datei
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `bestellung-${order.orderId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}
