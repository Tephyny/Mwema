const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Navigation
    navigate: (page) => ipcRenderer.send('navigate', page),

    // AI Story Generation
    checkModelStatus: () => ipcRenderer.invoke('check-model-status'),
    downloadModel: () => ipcRenderer.invoke('download-model'),
    initializeModel: () => ipcRenderer.invoke('initialize-model'),
    generateStory: (params) => ipcRenderer.invoke('generate-story', params),
    getSavedStories: () => ipcRenderer.invoke('get-saved-stories'),
    deleteStory: (storyId) => ipcRenderer.invoke('delete-story', storyId),

    // Download progress listener
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => callback(progress));
    },
    removeDownloadProgressListener: () => {
        ipcRenderer.removeAllListeners('download-progress');
    },

    // Text-to-Speech
    readStory: (text, options) => ipcRenderer.send('read-story', text, options),
    stopReading: () => ipcRenderer.send('stop-reading'),
    isTTSSpeaking: () => ipcRenderer.invoke('is-tts-speaking'),
    getTTSVoices: () => ipcRenderer.invoke('get-tts-voices'),

    // TTS event listeners
    onTTSFinished: (callback) => {
        ipcRenderer.on('tts-finished', callback);
    },
    onTTSError: (callback) => {
        ipcRenderer.on('tts-error', (event, error) => callback(error));
    },
    removeTTSListeners: () => {
        ipcRenderer.removeAllListeners('tts-finished');
        ipcRenderer.removeAllListeners('tts-error');
    }
});
