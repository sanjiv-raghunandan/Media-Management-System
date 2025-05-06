import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { spawn } from "child_process"; // For Python integration
import { isDev } from "./util.js";
import url from 'url';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
const normalizeFilePath = (fileUri: string): string => {
  if (fileUri.startsWith('file://')) {
    return url.fileURLToPath(fileUri);
  }
  return fileUri; // Assume it's already a valid file path
};
app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Allow node modules in the renderer process
      contextIsolation: false, // Required for IPC to work seamlessly
      webSecurity: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
    console.log('Current working directory:', process.cwd());
});

// Map extensions to applications
const mediaApps = {
  image: "/path/to/image/viewer", // Replace with the actual path to your image viewer app
  video: "/usr/bin/stremio", // Replace with the actual path to your video player app
  audio: "/path/to/audio/player", // Replace with the actual path to your audio player app
};

// Supported extensions for each media type
const extensionMap = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
  video: ['mp4', 'mkv', 'avi', 'mov'],
  audio: ['mp3', 'wav', 'flac', 'aac'],
};

ipcMain.handle("delete-media-item", async (event, mediaId) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      "./db/main.py",
      "delete_media_item",
      mediaId.toString()
    ]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});

ipcMain.handle('open-media', async (_, mediaUri: string) => {
    const mediaPath = normalizeFilePath(mediaUri);

    if (!fs.existsSync(mediaPath)) {
      throw new Error(`Media path does not exist: ${mediaPath}`);
    }

    const ext = path.extname(mediaPath).toLowerCase().substring(1);
    let appToUse = null;

    if (['jpg', 'png', 'gif'].includes(ext)) {
      appToUse = mediaApps.image;
    } else if (['mp4', 'mkv', 'avi'].includes(ext)) {
      appToUse = mediaApps.video;
    } else if (['mp3', 'wav'].includes(ext)) {
      appToUse = mediaApps.audio;
    }

    if (!appToUse) {
      // Fallback to the default app if no specific app is found
      await shell.openExternal(`file://${mediaPath}`);
      return `Opened ${mediaPath} with the default app.`;
    }

    // Open with the specified app
    const child = spawn(appToUse, [mediaPath], { shell: true });
    child.on('error', (err) => {
      throw new Error(`Failed to open media with ${appToUse}: ${err.message}`);
    });

    return `Opened ${mediaPath} with ${appToUse}`;
});
// Handle Python communication
ipcMain.handle("fetch-media", async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./db/main.py", "fetch"]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});
ipcMain.handle("add-files-to-collection", async (event, collectionId, fileIds) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      "./db/main.py",
      "add_files_to_collection",
      collectionId.toString(),
      JSON.stringify(fileIds)
    ]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});

  ipcMain.handle('upload-media', async (event, filePaths) => {
    
    console.log("File paths before IPC:", filePaths)
    const pythonProcess = spawn('python', ['./db/main.py', 'upload', ...filePaths])
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`)
    })

    return new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve('Upload completed successfully')
        } else {
          reject(`Python process exited with code ${code}`)
        }
      })
    })
  })

  ipcMain.handle('upload-media-folder', async (event, folderPath) => {
    console.log(folderPath)
    const pythonProcess = spawn('python', ['./db/main.py', 'upload-folder', folderPath])
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`)
    })

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`)
    })

    return new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve('Folder upload completed successfully')
        } else {
          reject(`Python process exited with code ${code}`)
        }
      })
    })
  })
  ipcMain.handle("fetch-collections", async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./db/main.py", "fetch_collections"]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});

ipcMain.handle("fetch-media-in-collection", async (event, collectionId) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./db/main.py", "fetch_media_in_collection", collectionId.toString()]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});
ipcMain.handle("add-collection", async (event, name, description) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./db/main.py", "add_collection", name, description]);

    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
      reject(data.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const parsedResult = JSON.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject("Failed to parse Python output");
      }
    });
  });
});

// File selection handler
ipcMain.handle("dialog:openFiles", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Media Files", extensions: ["jpg", "png", "mp4", "mp3"] },
    ],
  });
  return result.filePaths; // Return the selected file paths to the renderer process
});

// Folder selection handler
ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0]; // Return the selected folder path
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
	preload: "./preload.js"
      },
    });

    if (isDev()) {
      mainWindow.loadURL("http://localhost:5123");
    } else {
      mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }
  }
});

