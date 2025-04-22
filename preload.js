const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zephyrusAPI', {
    // Replay watcher controls
    watchReplays: (replaySet) => ipcRenderer.invoke('replayWatcher:watch', replaySet),
    restartWatcher: (replaySet) => ipcRenderer.invoke('replayWatcher:restart', replaySet),
    closeWatcher: () => ipcRenderer.invoke('replayWatcher:close'),

    // Directory path/get/set
    getDirPath: () => ipcRenderer.invoke('zephyrus:getDirPath'),
    setDirPath: (path) => ipcRenderer.invoke('zephyrus:setDirPath', path),

    // Upload queue access
    getUploadQueue: () => ipcRenderer.invoke('zephyrus:getUploadQueue'),

    // Listen for updates, errors, etc.
    onWatcherStatus: (callback) => {
        ipcRenderer.removeAllListeners('replayWatcher:status');
        ipcRenderer.on('replayWatcher:status', (event, status) => callback(status));
    },
    onUpdate: (callback) => {
        ipcRenderer.removeAllListeners('update');
        ipcRenderer.on('update', (event, message) => callback(message));
    }
});