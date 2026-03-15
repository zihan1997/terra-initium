const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('terraDesktop', {
  platform: process.platform,
});
