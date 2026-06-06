const organizer = new Organizer();

document.getElementById("back-to-main").addEventListener("click", function () {
  window.location.href = "../../index.html";
});

async function openJsonFileAndSetData(action) {
  try {
    const filePath = await window.restoreAPI.openFileDialog();
    if (!filePath) return;
    try {
      const data = await window.restoreAPI.readJsonFile(filePath);
      action(data);
    } catch (error) {
      addDownloadInfo(`Failed to read JSON file: ${error.message}`, true);
    }
  } catch (err) {
    addDownloadInfo(`Failed to load data: ${err.message}`, true);
  }
}

addClickEvent("backup-file-btn", () =>
  openJsonFileAndSetData((data) => organizer.setBackupData(data)),
);

addClickEvent("skip-file-btn", () =>
  openJsonFileAndSetData((data) => organizer.setSkipData(data)),
);

addClickEvent("save-folder-btn", async function () {
  try {
    const folderPath = await window.restoreAPI.openFolderDialog();
    if (!folderPath) return;
    organizer.setSavePath(folderPath);
  } catch (err) {
    alert(err);
  }
});

addClickEvent("stop-btn", function () {
  organizer.stop("Stopped.");
});

addClickEvent("download-file-btn", async function () {
  try {
    const { filePath, canceled } = await window.backupAPI.showSaveDialog({
      title: "Save Remaining Data",
      defaultPath: "remaining-data.json",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (canceled || !filePath) return;

    await window.backupAPI.saveFile(
      filePath,
      JSON.stringify(organizer.getRemainings(), null, 2),
    );

    addDownloadInfo(`Remaining file has been downloaded to ${filePath}`);
  } catch (err) {
    alert("Failed to save backup data.");
  }
});

addClickEvent("download-btn", async function () {
  organizer.start();
  const { data, totalNum } = organizer.getFinalData();
  const savePath = organizer.getSavePath();

  let i = 0;

  while (i < data.length && organizer.isStarted()) {
    organizer.setCursor(i);
    const id = data[i];
    const res = await window.restoreAPI.downloadBeatmapset(id, savePath);
    const success = await handleApiResponse(res, id, i, totalNum);
    if (success) {
      i += 1;
      organizer.resetRetryCount();
    }
  }
  if (i == data.length) {
    organizer.stop("Completed", false);
  } else if (!organizer.isStarted()) {
    organizer.stop("Cancelled.");
  }
});

async function handleApiResponse(response, id, index, totalData) {
  switch (response.status) {
    case 200:
      addDownloadInfo(
        `Id ${id} successfully downloaded. ${index + 1}/${totalData}`,
      );
      await sleep(1);
      return true;

    case 404:
      addDownloadInfo(`Skipping id ${id}. No beatmapset found.`, true);
      return true;

    case 429:
      organizer.increaseRetryCount();

      if (organizer.getRetryCount() > 2) {
        organizer.stop(
          "Too many rate limit errors. Wait a few minutes before trying again.",
        );
        return false;
      }

      addDownloadInfo(
        `Rate limit exceeded while downloading ${id}. Waiting for 30 seconds.`,
        true,
      );

      await sleep(30);
      return false;

    default:
      organizer.stop(
        "Unable to reach the server. Save your remaining beatmaps and try again later.",
      );
      return false;
  }
}

function sleep(s) {
  return new Promise((resolve) => setTimeout(resolve, 1000 * s));
}

function addDownloadInfo(text, isError = false) {
  const container = document.getElementById("download-info-container");
  const p = document.createElement("p");
  p.innerText = text;
  isError && p.classList.add("err-text");
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
}

function addClickEvent(id, func) {
  document.getElementById(id).addEventListener("click", func);
}
