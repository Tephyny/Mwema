const { ipcRenderer } = require('electron');

function openVideo() {
    ipcRenderer.send('open-video-window');
}

function backToMain() {
    ipcRenderer.send('back-to-main-window');
}
