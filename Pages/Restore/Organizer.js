class Organizer {
  constructor() {
    this.started = false;
    this.backupData = null;
    this.skipData = null;
    this.savePath = null;
    this.remainings = [];
    this.cursor = 0;
    this.retryCount = 0;
  }

  start() {
    this.started = true;
    this.setBtnDisabled("stop-btn", false);
    this.disableAll();
    addDownloadInfo("Download started.");
  }

  disableAll() {
    const ids = [
      "backup-file-btn",
      "skip-file-btn",
      "save-folder-btn",
      "download-btn",
    ];

    ids.forEach((id) => this.setBtnDisabled(id, true));
  }

  enableAll() {
    const ids = [
      "backup-file-btn",
      "skip-file-btn",
      "save-folder-btn",
      "download-btn",
    ];

    ids.forEach((id) => this.setBtnDisabled(id, false));
  }

  stop(stopMsg, err = true) {
    organizer.generateRemainingsFile();
    this.started = false;
    addDownloadInfo(stopMsg, err);
    this.setBtnDisabled("stop-btn", true);
    this.setBtnDisabled("download-file-btn", false);
    this.enableAll();
  }

  setBtnDisabled(id, value) {
    document.getElementById(id).disabled = value;
  }

  isStarted() {
    return this.started;
  }

  setCursor(data) {
    this.cursor = data;
  }

  generateRemainingsFile() {
    const { data } = this.getFinalData();
    this.remainings = data.slice(this.cursor + 1);
    document.getElementById("remaining-label").innerText =
      `Found ${this.remainings.length} beatmapIds.`;
  }

  getRemainings() {
    return this.remainings;
  }

  setBackupData(data) {
    this.backupData = [...new Set(data.filter((item) => item >= 0))];
    this.setBtnDisabled("save-folder-btn", false);

    document.getElementById("backup-label").innerText =
      `Found ${this.backupData.length} beatmapIds`;
  }

  setSkipData(data) {
    this.skipData = [...new Set(data.filter((item) => item >= 0))];
    document.getElementById("skip-label").innerText =
      `Found ${this.skipData.length} beatmapIds`;
  }

  setSavePath(path) {
    this.savePath = path;
    this.setBtnDisabled("download-btn", false);
    document.getElementById("save-folder-label").innerText =
      `Beatmaps will be downloaded to ${path}`;
  }

  increaseRetryCount() {
    this.retryCount += 1;
  }

  resetRetryCount() {
    this.retryCount = 0;
  }

  getFinalData() {
    let result = this.backupData;
    if (this.skipData) {
      result = this.backupData.filter((item) => !this.skipData.includes(item));
    }
    return { data: result, totalNum: result.length };
  }

  getSavePath() {
    return this.savePath;
  }

  getRetryCount() {
    return this.retryCount;
  }
}
