let mainWindow; // Define mainWindow globally

const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const aiService = require('./ai-service');
const ttsService = require('./tts-service');

const isDev = process.env.NODE_ENV !== 'production';


// Define the Content Security Policy
const contentSecurityPolicy = {
    defaultSrc: "self",
    scriptSrc: ["self", "unsafe-inline", "unsafe-eval"],
    styleSrc: ["self", "unsafe-inline"],
    imgSrc: ["self", "data:"],
    fontSrc: ["self"],
    objectSrc: [],
    connectSrc: ["self"],
    frameSrc: [],
    workerSrc: ["self", "blob:"],
    childSrc: ["self"],
    frameAncestors: ["self"],
    formAction: ["self"],
    upgradeInsecureRequests: false,
    blockAllMixedContent: false,
    requireSRIFor: [],
    scriptSrcAttr: [],
    styleSrcAttr: [],
    reportUri: null,
    reportTo: null,
    sandbox: [],
    reflectedXss: "block",
    policyDocument: null,
    featurePolicy: null,
};

// Create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Mwema App',
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Open dev tools if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, '../renderer/pages/index.html'));
}

// App is ready
app.whenReady().then(async () => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Initialize AI and TTS services
    try {
        console.log('Initializing AI service...');
        await aiService.initializeAI();
        console.log('Initializing TTS service...');
        await ttsService.initializeTTS();
        console.log('Services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
        // Continue even if services fail to initialize
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Menu template
const menu = [
    {
        role: 'fileMenu'
    }
];

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC event handler to navigate to different pages
ipcMain.on('navigate', (event, page) => {
    mainWindow.loadFile(path.join(__dirname, `../renderer/pages/${page}`));
});

// ============================================
// AI Story Generation IPC Handlers
// ============================================

// Check model status
ipcMain.handle('check-model-status', async () => {
    try {
        return await aiService.getModelStatus();
    } catch (error) {
        console.error('Error checking model status:', error);
        return { exists: false, initialized: false, ready: false, error: error.message };
    }
});

// Download model
ipcMain.handle('download-model', async (event) => {
    try {
        return await aiService.downloadModel((progress) => {
            event.sender.send('download-progress', progress);
        });
    } catch (error) {
        console.error('Model download error:', error);
        return { success: false, error: error.message };
    }
});

// Initialize model
ipcMain.handle('initialize-model', async () => {
    try {
        return await aiService.initializeModel();
    } catch (error) {
        console.error('Model initialization error:', error);
        return { success: false, error: error.message };
    }
});

// Delete model (Repair)
ipcMain.handle('delete-model', async () => {
    try {
        return await aiService.deleteModel();
    } catch (error) {
        console.error('Model deletion error:', error);
        return { success: false, error: error.message };
    }
});

// Generate story
ipcMain.handle('generate-story', async (event, { childName, value, language }) => {
    try {
        return await aiService.generateStory(childName, value, language);
    } catch (error) {
        console.error('Story generation error:', error);
        throw error;
    }
});

// Get saved stories
ipcMain.handle('get-saved-stories', async () => {
    try {
        return await aiService.getSavedStories();
    } catch (error) {
        console.error('Error getting saved stories:', error);
        return [];
    }
});

// Delete story
ipcMain.handle('delete-story', async (event, storyId) => {
    try {
        return await aiService.deleteStory(storyId);
    } catch (error) {
        console.error('Error deleting story:', error);
        throw error;
    }
});

// ============================================
// TTS IPC Handlers
// ============================================

// Read story with TTS
ipcMain.on('read-story', (event, text, options = {}) => {
    ttsService.speakText(text, options)
        .then(() => {
            event.sender.send('tts-finished');
        })
        .catch((error) => {
            console.error('TTS error:', error);
            event.sender.send('tts-error', error.message);
        });
});

// Stop TTS
ipcMain.on('stop-reading', () => {
    ttsService.stopSpeaking();
});

// Check if TTS is speaking
ipcMain.handle('is-tts-speaking', () => {
    return ttsService.isTTSSpeaking();
});

// Get available voices
ipcMain.handle('get-tts-voices', async () => {
    try {
        const voices = await ttsService.getAvailableVoices();
        const initStatus = await ttsService.initializeTTS();
        return {
            success: true,
            voices,
            defaultVoice: initStatus.defaultVoice
        };
    } catch (error) {
        console.error('Error getting voices:', error);
        return { success: false, error: error.message };
    }
});

