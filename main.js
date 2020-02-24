const { app, BrowserWindow, Tray, Menu } = require('electron');
const username = require('username');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const login = require('./login');
const watchReplays = require('./replayWatcher');

global.dir = { path: null };
global.uploadQueue = { queue: [], inProgress: false };
global.token = { token: null };

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
        },
        resizable: false,
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

    tray = new Tray(path.join(__dirname, 'favicon.png'));
    tray.setTitle('Zephyrus Replay Auto-Uploader');
    tray.on('click', () => {
        win.show();
    });
    tray.setToolTip('Zephyrus Replay Auto-Uploader');
    tray.setContextMenu(contextMenu);

    setInterval(async () => {
        if (!global.uploadQueue.inProgress) {
            const failedUploads = [];
            global.uploadQueue.inProgress = true;
            await Promise.all(global.uploadQueue.queue.map(([replayFilePath, replaySet], index) => {
                return new Promise((resolve, reject) => {
                    fs.readFile(replayFilePath, async (err, replayFile) => {
                        if (err) {
                            console.error(err);
                            return
                        }

                        const replayHash = crypto.createHash('md5').update(replayFile).digest('hex');
                        if (!replaySet.includes(replayHash)) {
                            // const url = 'https://zephyrus.gg/api/upload/';
                            const url = 'https://testing-dot-reflected-codex-228006.appspot.com/api/upload/';
                            const result = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Token ${global.token.token}`,
                                },
                                body: replayFile,
                            }).then(response => (
                                response
                            )).catch((error) => {
                                failedUploads.push([replayFilePath, replaySet]);
                            });

                            if (result) {
                                if (result.ok) {
                                    const message = { e: 'updateAll', replayHash: replayHash };
                                    win.webContents.send('update', JSON.stringify(message));
                                }
                            }
                        } else {
                        }
                        resolve();
                    });
                });
            }));
            global.uploadQueue.inProgress = false;
            global.uploadQueue.queue = failedUploads;
        }
    }, 10000);
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
