const chokidar = require('chokidar');
const fs = require('fs');
const username = require('username');
const fetch = require('node-fetch');

async function watchReplays(token) {
    console.log('in watchReplays');
    let replayPath;
    const accountPath = '/Accounts/**/Replays/Multiplayer/*.SC2Replay';
    const user = await username();

    if (process.platform === 'win32') {
        replayPath = `/Users/${user}/Documents/StarCraft II${accountPath}`;
    } else {
        // mac
        replayPath = `/Users/${user}/Library/Application Support/Blizzard/Starcraft II${accountPath}`;
    }

    const watcher = chokidar.watch(replayPath, {
        ignoreInitial: true,
    });
    console.log('created watcher');

    const url = 'https://zephyrus.gg/api/upload/';
    watcher.on('add', async (filePath) => {
        console.log('adding file');
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
    console.log('watching replays');
}

module.exports = watchReplays;
