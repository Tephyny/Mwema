let mainWindow; // Define mainWindow globally

const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

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

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// App is ready
app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

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
    mainWindow.loadFile(path.join(__dirname, 'renderer',`${page}`));
});
