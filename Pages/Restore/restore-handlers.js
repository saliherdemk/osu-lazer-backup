const { ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const axios = require("axios");

const DOWNLOAD_URL = "https://catboy.best/d/";

function registerRestoreHandlers() {
  ipcMain.handle("restore-open-file-dialog", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Json", extensions: ["json"] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    } else {
      return null;
    }
  });

  ipcMain.handle("read-json-file", async (_event, filePath) => {
    try {
      const fileContent = await fs.promises.readFile(filePath, "utf8");
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error("Error reading or parsing the JSON file:", error);
    }
  });

  ipcMain.handle("open-folder-dialog", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (!result.canceled) {
      return result.filePaths[0];
    } else {
      return null;
    }
  });

  ipcMain.handle("download-beatmapset", async (_event, id, savePath) => {
    const url = `${DOWNLOAD_URL}${id}`;
    const filePath = path.join(savePath, `beatmapset-${id}.osz`);

    try {
      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
        headers: {
          "User-Agent": "osu-lazer-backup",
        },
      });

      const writer = fs.createWriteStream(filePath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);

        writer.on("finish", () => {
          resolve({
            status: response.status,
          });
        });

        writer.on("error", (err) => {
          reject({
            status: response.status,
            error: `Failed to download beatmapset: ${err.message}`,
          });
        });
      });
    } catch (error) {
      return {
        status: error.response ? error.response.status : null,
        error: `Error downloading beatmapset: ${error.message}`,
      };
    }
  });
}

module.exports = { registerRestoreHandlers };
