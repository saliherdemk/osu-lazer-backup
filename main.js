const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { registerBackupHandlers } = require("./Pages/Backup/backup-handlers");
const { registerRestoreHandlers } = require("./Pages/Restore/restore-handlers");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile("index.html");

  registerBackupHandlers();
  registerRestoreHandlers();
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
