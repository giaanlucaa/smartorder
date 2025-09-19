export * from './browser-generate';

// Re-export für direkten Import
export { 
  generateTableQR, 
  showQRInWindow, 
  downloadQRCode,
  createQRCanvas,
  createQRBlob,
  type QRGenerationOptions,
  type QRResult
} from './browser-generate';