// Browser-kompatible QR-Code-Generierung
export interface QRGenerationOptions {
  venueId: string;
  tableToken: string;
  tableLabel: string;
  appUrl?: string;
}

export interface QRResult {
  dataUrl: string;
  url: string;
  tableLabel: string;
  downloadUrl?: string;
}

// Browser-kompatible QR-Code-Generierung ohne PDF
export async function generateTableQR(options: QRGenerationOptions): Promise<QRResult> {
  const { venueId, tableToken, tableLabel, appUrl } = options;
  const baseUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const url = `${baseUrl}/t/${venueId}/${tableToken}`;
  
  try {
    // Dynamisch QR-Code-Bibliothek laden
    const QRCode = await import('qrcode');
    
    // QR-Code als Data URL generieren
    const dataUrl = await QRCode.toDataURL(url, { 
      margin: 1, 
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      dataUrl,
      url,
      tableLabel,
      downloadUrl: dataUrl // Kann direkt als Download verwendet werden
    };
  } catch (error) {
    console.error('Fehler bei QR-Code-Generierung:', error);
    throw new Error('QR-Code konnte nicht generiert werden');
  }
}

// QR-Code als Canvas-Element erstellen
export function createQRCanvas(qrDataUrl: string, tableLabel: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas-Kontext konnte nicht erstellt werden');
  }
  
  // Canvas-Größe setzen
  canvas.width = 400;
  canvas.height = 500;
  
  // Hintergrund
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // QR-Code-Bild laden und zeichnen
  const img = new Image();
  img.onload = () => {
    // QR-Code in der Mitte zeichnen
    const qrSize = 300;
    const x = (canvas.width - qrSize) / 2;
    const y = 50;
    ctx.drawImage(img, x, y, qrSize, qrSize);
    
    // Titel hinzufügen
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Tisch ${tableLabel}`, canvas.width / 2, 30);
    
    // URL hinzufügen
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    const url = `${window.location.origin}/t/${tableLabel}`;
    ctx.fillText(url, canvas.width / 2, 380);
  };
  
  img.src = qrDataUrl;
  
  return canvas;
}

// QR-Code als Blob für Download erstellen
export async function createQRBlob(qrDataUrl: string, tableLabel: string): Promise<Blob> {
  const canvas = createQRCanvas(qrDataUrl, tableLabel);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Blob konnte nicht erstellt werden'));
      }
    }, 'image/png');
  });
}

// QR-Code herunterladen
export async function downloadQRCode(qrDataUrl: string, tableLabel: string, filename?: string): Promise<void> {
  try {
    const blob = await createQRBlob(qrDataUrl, tableLabel);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `tisch-${tableLabel}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Fehler beim Download:', error);
    throw error;
  }
}

// QR-Code in einem neuen Fenster anzeigen
export function showQRInWindow(qrDataUrl: string, tableLabel: string): void {
  const newWindow = window.open('', '_blank', 'width=500,height=600');
  
  if (!newWindow) {
    throw new Error('Popup wurde blockiert');
  }
  
  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tisch ${tableLabel} - QR Code</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        h2 { color: #666; margin-bottom: 20px; }
        .qr-container {
          margin: 20px 0;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .qr-code {
          max-width: 100%;
          height: auto;
          border: 2px solid #ddd;
          border-radius: 8px;
        }
        .url-info {
          margin-top: 15px;
          padding: 10px;
          background: #e8f4fd;
          border-radius: 6px;
          font-size: 12px;
          word-break: break-all;
          color: #666;
        }
        .print-btn {
          margin-top: 20px;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }
        .print-btn:hover {
          background: #0056b3;
        }
        @media print {
          body { background: white; }
          .container { box-shadow: none; }
          .print-btn { display: none; }
          .url-info { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SmartOrder</h1>
        <h2>Tisch ${tableLabel}</h2>
        <div class="qr-container">
          <img src="${qrDataUrl}" alt="QR Code" class="qr-code">
        </div>
        <div class="url-info">
          ${window.location.origin}/t/${tableLabel}
        </div>
        <button class="print-btn" onclick="window.print()">Drucken</button>
      </div>
    </body>
    </html>
  `);
  
  newWindow.document.close();
}
