const chokidar = require('chokidar');
const username = require('username');
const { ipcRenderer } = require('electron');
const remote = require('electron').remote;

let watcher;

async function watchReplays(replaySet) {
    let accountPath;
    let fullPath;
    const replayPath = '/**/Replays/Multiplayer/*.SC2Replay';
    if (!remote.getGlobal('dir').path) {
        const user = await username();

        if (process.platform === 'win32') {
            accountPath = `/Users/${user}/Documents/StarCraft II/Accounts`;
        } else {
            // mac
            accountPath = `/Users/${user}/Library/Application Support/Blizzard/Starcraft II/Accounts`;
        }
        remote.getGlobal('dir').path = accountPath;
        fullPath = accountPath + replayPath;
    } else {
        fullPath = remote.getGlobal('dir').path + replayPath;
    }

    watcher = chokidar.watch(fullPath, {
        ignoreInitial: true,
    });

    watcher.on('add', async (filePath) => {
        const replayQueue = remote.getGlobal('uploadQueue').queue;
        replayQueue.push([filePath, replaySet]);
        remote.getGlobal('uploadQueue').queue = replayQueue;
    });
};

async function restart(replaySet) {
    await watcher.close();
    await watchReplays(replaySet);
};

async function close() {
    await watcher.close();
}

module.exports = {
    watchReplays: watchReplays,
    restart: restart,
    close: close,
};
