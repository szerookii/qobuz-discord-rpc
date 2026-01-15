import { Client, type SetActivity } from '@xhayper/discord-rpc';
import { ipcMain, app, type BrowserWindowConstructorOptions, type IpcMainEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

declare const UI_BUNDLE_CODE: string;
declare const PRELOAD_CODE: string;

//////////////////////////////////////////////////////////////////
// DISCORD RPC
//////////////////////////////////////////////////////////////////

const discord = new Client({ clientId: "1461057192387153930", transport: { type: 'ipc' } });
let discordReady = false;
let discordEnabled = true;

interface Metadata {
    title?: string;
    performer: { name?: string };
    album: { title?: string; image: { thumbnail?: string; large?: string; small?: string } };
    duration?: number;
}

interface PlayQueueInfo {
    trackTitle?: string;
    artistName?: string;
    album?: string;
}

interface TrackInfo {
    title: string;
    artist: string;
    album: string;
    image: string;
    duration: number;
    paused: boolean;
    startedAt?: number;
}

const trackInfo: TrackInfo = {
    title: '',
    artist: '',
    album: '',
    image: 'qobuz_large',
    duration: 0,
    paused: true,
};

discord.on('ready', () => {
    discordReady = true;
});

function updateDiscordActivity(): void {
    if (!discordReady || !discordEnabled) return;

    const activity: SetActivity = {
        type: 2,
        name: trackInfo.title,
        details: trackInfo.title,
        state: `by ${trackInfo.artist}`,
        largeImageKey: trackInfo.image,
        largeImageText: trackInfo.album,
        smallImageKey: trackInfo.paused ? 'icon-paused' : 'icon-playing',
        smallImageText: 'Qobuz mod by szeroki (https://github.com/szerookii/qobuz-discord-rpc)',
    };

    discord.user?.setActivity(activity).catch(console.error);
}

function clearDiscordActivity(): void {
    discord.user?.clearActivity().catch(() => { });
}

discord.login().catch(() => { });

//////////////////////////////////////////////////////////////////
// ELECTRON HOOKS
//////////////////////////////////////////////////////////////////

const Module = require('module');
const originalRequire = Module.prototype.require;
const electronModule = originalRequire.call(Module, 'electron');
const OriginalBrowserWindow = electronModule.BrowserWindow;

const HookedBrowserWindow = new Proxy(OriginalBrowserWindow, {
    construct(target, [options = {}]: [BrowserWindowConstructorOptions]) {
        if (options.webPreferences) {
            if (options.webPreferences.preload) {
                process.env.QOBUZ_ORIGINAL_PRELOAD = options.webPreferences.preload;
            }

            try {
                const preloadPath = path.join(app.getPath('userData'), 'qobuz-rpc-preload.js');
                fs.writeFileSync(preloadPath, PRELOAD_CODE);
                options.webPreferences.preload = preloadPath;
            } catch (e) {
                console.error('Failed to write preload:', e);
            }
        }

        return new target(options);
    },
});

Module.prototype.require = function (id: string) {
    const mod = originalRequire.call(this, id);

    if (id === 'electron') {
        return new Proxy(mod, {
            get: (target, prop: string) => prop === 'BrowserWindow' ? HookedBrowserWindow : target[prop],
        });
    }

    return mod;
};

//////////////////////////////////////////////////////////////////
// ELECTRON EVENTS
//////////////////////////////////////////////////////////////////

app.on('browser-window-created', (_, win) => {
    // TODO: Enable devtools based development mode
    // win.webContents.openDevTools();
    win.webContents.on('did-finish-load', () => {
        if (typeof UI_BUNDLE_CODE !== 'undefined') {
            win.webContents.executeJavaScript(UI_BUNDLE_CODE).catch(console.error);
        }
    });
});

//////////////////////////////////////////////////////////////////
// IPC EVENTS
//////////////////////////////////////////////////////////////////

ipcMain.on('rpc-toggle', (_, enabled: boolean) => {
    discordEnabled = enabled;
    enabled ? updateDiscordActivity() : clearDiscordActivity();
});

const originalEmit = ipcMain.emit.bind(ipcMain);

ipcMain.emit = function (channel: string, event?: IpcMainEvent | unknown, ...args: unknown[]): boolean {
    switch (channel) {
        case 'player-load-music': {
            const meta = args[1] as Metadata;
            trackInfo.title = meta.title || 'Unknown Title';
            trackInfo.artist = meta.performer?.name || 'Unknown Artist';
            trackInfo.album = meta.album?.title || 'Unknown Album';
            trackInfo.duration = meta.duration || 0;
            trackInfo.image = meta.album?.image?.small || 'qobuz_large';
            trackInfo.startedAt = Date.now();
            updateDiscordActivity();
            break;
        }

        case 'player-get-playqueue-info': { // idk its used by auto next and when forward but not rewind wtf idk but ok
            const meta = args[0] as PlayQueueInfo;
            trackInfo.title = meta.trackTitle || 'Unknown Title';
            trackInfo.artist = meta.artistName || 'Unknown Artist';
            trackInfo.album = meta.album || 'Unknown Album';
            updateDiscordActivity();
            break;
        }

        case 'player-pause-music':
            trackInfo.paused = true;
            updateDiscordActivity();
            break;

        case 'player-play-music':
            trackInfo.paused = false;
            updateDiscordActivity();
            break;

        case 'player-change-offset':
            updateDiscordActivity();
            break;
    }

    return originalEmit(channel, event, ...args);
} as typeof ipcMain.emit;