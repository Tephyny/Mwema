const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();  // Prevent the default browser navigation
      const page = link.getAttribute('href');  // Get the href attribute
      ipcRenderer.send('navigate', page);  // Send the page name to main process
    });
  });
});