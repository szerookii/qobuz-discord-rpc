import { spawn } from 'bun';
import fs from 'fs';
import path from 'path';

async function runCommand(cmd: string[]) {
    const proc = spawn(cmd, {
        stdout: 'inherit',
        stderr: 'inherit',
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        throw new Error(`Command failed: ${cmd.join(' ')}`);
    }
}

async function build() {
    console.log('🏗️  Building UI with Vite...');
    await runCommand(['bun', 'run', 'vite', 'build']);

    console.log('📦 Reading compiled UI...');
    const uiPath = path.resolve('dist/ui/renderer.js');
    if (!fs.existsSync(uiPath)) {
        throw new Error('UI build failed: renderer.js not found');
    }
    const uiCode = fs.readFileSync(uiPath, 'utf-8');
    const escapedUiCode = JSON.stringify(uiCode);

    console.log('🔗 Building Preload...');
    // Build preload to a temp file first
    await runCommand([
        'bun', 'run', 'esbuild',
        './src/preload.ts',
        '--bundle',
        '--platform=node',
        '--target=node16',
        '--format=cjs',
        '--outfile=dist/temp_preload.js',
        '--external:electron'
    ]);
    
    const preloadPath = path.resolve('dist/temp_preload.js');
    const preloadCode = fs.readFileSync(preloadPath, 'utf-8');
    // Escape for define injection
    const escapedPreloadCode = JSON.stringify(preloadCode);
    
    // Clean up temp file
    fs.unlinkSync(preloadPath);

    console.log('🛠️  Building Main Process with esbuild...');
    await runCommand([
        'bun', 'run', 'esbuild',
        './src/index.ts',
        '--bundle',
        '--platform=node',
        '--target=node16',
        '--format=cjs',
        '--outfile=dist/qobuz-discord-rpc.js',
        '--external:electron',
        `--define:UI_BUNDLE_CODE=${escapedUiCode}`,
        `--define:PRELOAD_CODE=${escapedPreloadCode}`
    ]);

    console.log('✅ Build complete! Output: dist/qobuz-discord-rpc.js');
}

build().catch(console.error);
