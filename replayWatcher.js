const chokidar = require('chokidar');
const username = require('username');
const { ipcRenderer } = require('electron');
// Avoid using deprecated remote when possible
// const remote = require('electron').remote;

let watcher = null;

// Use a simple singleton for path/queue state
const globalState = {
    dir: {
        path: null
    },
    uploadQueue: {
        queue: []
    }
};

/**
 * Helper to resolve user account replay directory in a cross-platform, robust way.
 */
async function resolveAccountPath() {
    try {
        const user = await username();

        if (process.platform === 'win32') {
            return `C:/Users/${user}/Documents/StarCraft II/Accounts`;
        } else if (process.platform === 'darwin') {
            return `/Users/${user}/Library/Application Support/Blizzard/Starcraft II/Accounts`;
        } else {
            // Extend here for Linux/other OS if needed
            throw new Error('Unsupported OS for replay watcher.');
        }
    } catch (err) {
        console.error('[ReplayWatcher] Failed to resolve account path:', err);
        throw err;
    }
}

/**
 * Determine the full path to watch for replay files.
 */
async function getReplayWatchPath() {
    const replayGlob = '/**/Replays/Multiplayer/*.SC2Replay';

    if (!globalState.dir.path) {
        const accountPath = await resolveAccountPath();
        globalState.dir.path = accountPath;
    }
    return globalState.dir.path + replayGlob;
}

/**
 * Add a replay to the upload queue, guarding against duplicate rapid events.
 */
function enqueueReplay(filePath, replaySet) {
    const entry = [filePath, replaySet];
    // Prevent duplicates (could enhance with more advanced deduplication)
    if (!globalState.uploadQueue.queue.some(q => q[0] === filePath)) {
        globalState.uploadQueue.queue.push(entry);
        // You could emit/log upload events here if integrating an event system
        console.log(`[ReplayWatcher] Queued replay for upload: ${filePath}`);
    } else {
        console.log(`[ReplayWatcher] Duplicate replay ignored: ${filePath}`);
    }
}

/**
 * Set up and start watching for replay file changes, with error handling.
 */
async function watchReplays(replaySet) {
    let watchPath;
    try {
        watchPath = await getReplayWatchPath();

        // Clean up previous watcher if any, before creating a new one
        if (watcher) {
            await watcher.close();
        }

        watcher = chokidar.watch(watchPath, {
            ignoreInitial: true,
        });

        watcher.on('add', (filePath) => {
            try {
                enqueueReplay(filePath, replaySet);
            } catch (err) {
                console.error('[ReplayWatcher] Failed to enqueue replay:', err);
            }
        });

        watcher.on('error', (err) => {
            console.error('[ReplayWatcher] Watcher error:', err);
        });

        console.log(`[ReplayWatcher] Watching for replays at: ${watchPath}`);
    } catch (err) {
        console.error('[ReplayWatcher] Error setting up watcher:', err);
        throw err;
    }
}

/**
 * Restart the watcher (close and re-initiate).
 */
async function restart(replaySet) {
    try {
        if (watcher) {
            await watcher.close();
            watcher = null;
        }
        await watchReplays(replaySet);
        console.log('[ReplayWatcher] Watcher restarted.');
    } catch (err) {
        console.error('[ReplayWatcher] Error restarting watcher:', err);
    }
}

/**
 * Dispose of the watcher resource.
 */
async function close() {
    try {
        if (watcher) {
            await watcher.close();
            watcher = null;
            console.log('[ReplayWatcher] Watcher closed.');
        }
    } catch (err) {
        console.error('[ReplayWatcher] Error closing watcher:', err);
    }
}

module.exports = {
    watchReplays,
    restart,
    close,
    // For test/debug: expose state (remove in production)
    _globalState: globalState
};