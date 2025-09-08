const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    receivePdfData: (callback) => ipcRenderer.on('send-pdf-data', (_event, data) => callback(data)),
    sendToPrint: (printOptions) => ipcRenderer.send('send-to-printer', printOptions),
    cancelPrint: () => ipcRenderer.send('cancel-print'),
    genPDF: (printObj) => ipcRenderer.invoke('genPDF', printObj)
})