# Qobuz Discord RPC

This mod adds Discord Rich Presence support to the Qobuz desktop application.

## Installation

### 1. Build the script
First, clone this repository and build the script:

```bash
bun install
bun run build
```

This will generate a `qobuz-discord-rpc.js` file in the `dist` folder.

### 2. Locate Qobuz resources
You need to find where Qobuz is installed on your system and locate the `resources/app` directory.

- **Windows**: `%AppData%\Local\Programs\Qobuz\resources\app`
- **macOS**: `/Applications/Qobuz.app/Contents/Resources/app`
- **Linux**: `/usr/lib/qobuz/resources/app` (or similar depending on installation)

### 3. Install the script
1. Copy the generated `dist/qobuz-discord-rpc.js` file into the `resources/app` folder you located in the previous step.

2. In that same folder, look for the main entry point file. It is usually named **`main-<platform>.js`** (e.g., `main-prod.js`, `main-darwin.js`, `main-win32.js`, or just `index.js`).

3. Open that file in a text editor and add the following line **at the very top**:

   ```javascript
   require("./qobuz-discord-rpc.js");
   ```

### 4. Restart Qobuz
Restart the Qobuz application. Discord RPC should now be active when you play music.

```
