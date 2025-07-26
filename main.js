const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('submit-form', (event, data) => {
  const { urls, author, targetSites, comments, include404 } = data;
  console.log('Received form data:', data);

  // Process URLs and target sites
  const urlList = urls.split('\n').filter(url => url.trim());
  const siteList = targetSites.split('\n').filter(site => site.trim());
  const commentList = comments.split('\n').filter(comment => comment.trim());

  // Simulate processing (e.g., checking 404 pages)
  const results = siteList.map(site => {
    let result = `Processing ${site} with author ${author}`;
    if (include404) {
      result += `, including 404 page: ${site}/abc123`;
    }
    return result;
  });

  // Send results back to renderer
  event.reply('form-result', results.join('\n'));
});