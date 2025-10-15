import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  saveBase64Pdf: async (fileName: string, base64: string) => {
    return await ipcRenderer.invoke('save-base64-pdf', { fileName, base64 });
  },
  savePdfFromUrl: async (fileName: string, url: string) => {
    return await ipcRenderer.invoke('save-pdf-from-url', { fileName, url });
  },
});

export {};

