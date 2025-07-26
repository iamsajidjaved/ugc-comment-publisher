const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  submitForm: (data) => ipcRenderer.send('submit-form', data),
  onFormResult: (callback) => ipcRenderer.on('form-result', (event, data) => callback(data))
});