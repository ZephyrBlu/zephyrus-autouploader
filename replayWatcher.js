const chokidar = require('chokidar');
const fs = require('fs');
const username = require('username');
const fetch = require('node-fetch');
const remote = require('electron').remote;

let watcher;

async function watchReplays(token) {
    let accountPath;
    let fullPath;
    if (!remote.getGlobal('dir').path) {
        const replayPath = '/**/Replays/Multiplayer/*.SC2Replay';
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
        fullPath = remote.getGlobal('dir').path;
    }

    watcher = chokidar.watch(fullPath, {
        ignoreInitial: true,
    });

    const url = 'https://zephyrus.gg/api/upload/';
    watcher.on('add', async (filePath) => {
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Token ${token}`,
            },
            body: fs.readFileSync(filePath),
        }).then(response => response);

        if (result.ok) {
            console.log('success');
        } else {
            console.log('fail');
        }
    });
};

async function stopWatchingReplays() {
    await watcher.close();
};

async function restart(token) {
    await stopWatchingReplays();
    await watchReplays(token);
};

module.exports = {
    watchReplays: watchReplays,
    stopWatchingReplays: stopWatchingReplays,
    restart: restart,
};
