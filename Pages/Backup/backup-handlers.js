const { ipcMain, dialog } = require("electron");
const path = require("node:path");
const Realm = require("realm");
const fs = require("fs");
const os = require("os");

function registerBackupHandlers() {
  ipcMain.handle("open-file-dialog", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Realm Files", extensions: ["realm"] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    } else {
      return null;
    }
  });

  ipcMain.handle("read-realm-file", async (_event, filePath) => {
    try {
      const appDir = path.join(os.homedir(), "temp_for_client");
      const destinationPath = path.join(appDir, "client.realm");
      await fs.promises.mkdir(appDir, { recursive: true });

      await fs.promises.copyFile(filePath, destinationPath);
      const realm = await Realm.open({
        path: destinationPath,
      });
      const beatmapIds = realm
        .objects("BeatmapSet")
        .map((beatmap) => beatmap.OnlineID);

      realm.close();
      await fs.promises.rm(appDir, { recursive: true, force: true });
      return { data: beatmapIds };
    } catch (err) {
      return { error: "Failed to read the Realm file." + err };
    }
  });

  ipcMain.handle("show-save-dialog", async (_event, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  ipcMain.handle("save-file", async (_event, filePath, content) => {
    try {
      await fs.promises.writeFile(filePath, content, "utf8");
      return { success: true };
    } catch (error) {
      throw new Error("Failed to save the file.");
    }
  });

  ipcMain.handle("get-default-path", async () => {
    const platform = os.platform();
    const homeDir = os.homedir();
    let readFilePath = "";

    if (platform === "win32") {
      readFilePath = path.join(process.env.APPDATA, "osu", "client.realm");
    } else if (platform === "darwin") {
      readFilePath = path.join(
        homeDir,
        "Library",
        "Application Support",
        "osu",
        "client.realm",
      );
    } else if (platform === "linux") {
      readFilePath = path.join(
        homeDir,
        ".local",
        "share",
        "osu",
        "client.realm",
      );
    } else {
      console.error("Unsupported platform");
    }

    return readFilePath;
  });
}

module.exports = { registerBackupHandlers };
