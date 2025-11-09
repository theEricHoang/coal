import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Add any electron APIs you want to expose to renderer
  platform: process.platform,
});