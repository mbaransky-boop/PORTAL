import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('portalAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  restart: () => ipcRenderer.invoke('restart-app'),
  logError: (message: string) => ipcRenderer.send('log-error', message),
  onAppEvent: (callback: (event: string) => void) => {
    ipcRenderer.on('app-event', (_, event) => callback(event as string));
  },
});
