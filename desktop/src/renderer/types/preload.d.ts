export {};
declare global {
  interface Window {
    api: {
      saveBase64Pdf: (fileName: string, base64: string) => Promise<{ canceled: boolean; filePath?: string }>;
      savePdfFromUrl: (fileName: string, url: string) => Promise<{ canceled: boolean; filePath?: string }>;
    };
  }
}

