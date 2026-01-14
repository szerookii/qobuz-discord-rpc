import { Client, SetActivity } from '@xhayper/discord-rpc';
import { ipcMain, IpcMainEvent } from 'electron';

const client = new Client({ clientId: "1461057192387153930", transport: { type: 'ipc' } });
let rpcReady = false;

interface Metadata {
    title?: string;
    performer: { name?: string };
    album: { title?: string; image: { thumbnail?: string, large?: string, small?: string } };
    duration?: number;
}

interface CurrentMetadata {
    title: string;
    artist: string;
    album: string;
    image: string;
    started_at?: number;
    duration: number;
    paused: boolean;
}

const currentMetadata: CurrentMetadata = {
    title: '',
    artist: '',
    album: '',
    image: 'qobuz_large',
    duration: 0,
    paused: true,
};

client.on('ready', () => {
    rpcReady = true;
});

function sendRPCUpdate(seek: number = 0): void {
    if (!rpcReady) return;

    const activity: SetActivity = {
        type: 2,
        name: currentMetadata.title,
        details: `${currentMetadata.title}`,
        state: `by ${currentMetadata.artist}`,
        largeImageKey: currentMetadata.image,
        largeImageText: currentMetadata.album,
        smallImageKey: currentMetadata.paused ? 'icon-paused' : 'icon-playing',
        smallImageText: "Qobuz mod by szeroki (https://github.com/szerookii/qobuz-discord-rpc)",
    };

    // TODO: Support timestamps properly with seek position
    delete activity.startTimestamp;
    delete activity.endTimestamp;

    client.user?.setActivity(activity).catch(console.error);
}

const originalEmit = ipcMain.emit.bind(ipcMain);

ipcMain.emit = function (channel: string, event?: IpcMainEvent | unknown, ...args: unknown[]): boolean {
    if (channel === 'player-load-music') {
        const metadata = args[1] as Metadata;

        currentMetadata.started_at = Date.now();
        currentMetadata.title = metadata.title || 'Unknown Title';
        currentMetadata.artist = metadata.performer?.name || 'Unknown Artist';
        currentMetadata.album = metadata.album?.title || 'Unknown Album';
        currentMetadata.duration = metadata.duration || 0;
        currentMetadata.image = metadata.album?.image?.small || 'qobuz_large';

        sendRPCUpdate();
    } else if (channel === 'player-pause-music') {
        currentMetadata.paused = true;
        sendRPCUpdate();
    } else if (channel === 'player-play-music') {
        currentMetadata.paused = false;
        sendRPCUpdate();
    } else if (channel === 'player-change-offset') {
        const offset = args[1] as number;
        sendRPCUpdate(offset);
    }

    return originalEmit(channel, event, ...args);
} as typeof ipcMain.emit;

client.login().catch(() => { });