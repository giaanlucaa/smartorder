// Browser-kompatible Upload-Funktionalität
export interface UploadOptions {
  maxSize?: number; // in Bytes
  allowedTypes?: string[];
  quality?: number; // für Bildkompression
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  file?: File;
  dataUrl?: string;
}

// Browser-kompatible Datei-Upload-Funktion
export async function uploadFile(
  file: File, 
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB Standard
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    quality = 0.8
  } = options;

  try {
    // Dateigröße prüfen
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Datei ist zu groß. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Dateityp prüfen
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Dateityp nicht erlaubt. Erlaubt: ${allowedTypes.join(', ')}`
      };
    }

    // Für Bilder: Komprimierung
    if (file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file, quality);
      const dataUrl = await fileToDataUrl(compressedFile);
      
      return {
        success: true,
        url: dataUrl,
        file: compressedFile,
        dataUrl
      };
    }

    // Für andere Dateien: Direkt als Data URL
    const dataUrl = await fileToDataUrl(file);
    
    return {
      success: true,
      url: dataUrl,
      file,
      dataUrl
    };

  } catch (error) {
    console.error('Upload-Fehler:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Upload-Fehler'
    };
  }
}

// Bildkompression für Browser
export async function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Canvas-Größe setzen
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      let { width, height } = img;
      
      // Verhältnis beibehalten
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Bild zeichnen
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Als Blob konvertieren
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Bildkompression fehlgeschlagen'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = URL.createObjectURL(file);
  });
}

// File zu Data URL konvertieren
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Datei konnte nicht gelesen werden'));
      }
    };
    
    reader.onerror = () => reject(new Error('Datei-Lesefehler'));
    reader.readAsDataURL(file);
  });
}

// Data URL zu File konvertieren
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

// Drag & Drop Handler
export function createDropZone(
  element: HTMLElement,
  onDrop: (files: File[]) => void,
  options: UploadOptions = {}
): () => void {
  const { allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer?.files || []);
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  };

  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', handleDrop);

  // Cleanup-Funktion
  return () => {
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('drop', handleDrop);
  };
}

// Datei-Auswahl Dialog
export function selectFile(options: UploadOptions = {}): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (options.allowedTypes) {
      input.accept = options.allowedTypes.join(',');
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      resolve(file);
    };
    
    input.click();
  });
}

// Mehrere Dateien auswählen
export function selectFiles(options: UploadOptions = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    if (options.allowedTypes) {
      input.accept = options.allowedTypes.join(',');
    }
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      resolve(files);
    };
    
    input.click();
  });
}
