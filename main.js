const { app, BrowserWindow, Tray, Menu } = require('electron');
const username = require('username');
const login = require('./login');
const watchReplays = require('./replayWatcher');

global.dir = { path: null };

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    win.loadFile('index.html');
    win.on('close', (event) => {
        event.preventDefault();
        win.hide();
    });
};

let tray;
app.on('ready', async () => {
    createWindow();

    let contextMenu = Menu.buildFromTemplate([{
        label: 'Quit Auto-Uploader', click: () => {
            win.removeAllListeners('close');
            win.close();
        }
    }]);

    tray = new Tray('favicon.png');
    tray.setTitle('Zephyrus Replay Auto-Uploader');
    tray.on('click', () => {
        win.show();
    });
    tray.setToolTip('Zephyrus Replay Auto-Uploader');
    tray.setContextMenu(contextMenu);
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
