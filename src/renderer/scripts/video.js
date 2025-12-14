let ipcRenderer;
try {
    ipcRenderer = require('electron').ipcRenderer;
} catch (e) {
    console.log('Electron not available, video features disabled in browser mode.');
}

function openVideo() {
    if (ipcRenderer) {
        ipcRenderer.send('open-video-window');
    } else {
        console.warn('Video window requires Electron');
    }
}

function backToMain() {
    if (ipcRenderer) {
        ipcRenderer.send('back-to-main-window');
    } else {
        window.history.back();
    }
}
