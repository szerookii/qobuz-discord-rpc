import { contextBridge, ipcRenderer } from 'electron';

function insertAPI(name: string, api: any): void {
    try {
        contextBridge.exposeInMainWorld(name, api);
    } catch {
        (window as any)[name] = api;
    }
}

const originalPreload = process.env.QOBUZ_ORIGINAL_PRELOAD;

if (originalPreload) {
    try {
        require(originalPreload);
    } catch (error) {
        console.error('Failed to load original preload:', error);
    }
}

insertAPI('QobuzDiscordRPC', {
    toggle: (enabled: boolean) => {
        ipcRenderer.send('rpc-toggle', enabled);
    },
});