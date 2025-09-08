const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  contextMenu: () => ipcRenderer.send('show-context-menu'),
  loadMWObjects: (callback) => ipcRenderer.on('MWObjects', (_event, data) => callback(data))
})

