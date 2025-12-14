let ipcRenderer;
try {
  ipcRenderer = require('electron').ipcRenderer;
} catch (e) {
  console.log('Electron not available, running in browser mode.');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (event) => {
      if (ipcRenderer) {
        event.preventDefault();  // Prevent the default browser navigation
        const page = link.getAttribute('href');  // Get the href attribute
        ipcRenderer.send('navigate', page);  // Send the page name to main process
      }
      // If no ipcRenderer, default behavior (href navigation) applies
    });
  });
});