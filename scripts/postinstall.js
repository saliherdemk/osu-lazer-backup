const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const electronDir = path.join(__dirname, "..", "node_modules", "electron");
const pathFile = path.join(electronDir, "path.txt");
const distDir = path.join(electronDir, "dist");

function isElectronInstalled() {
  try {
    if (!fs.existsSync(pathFile)) return false;
    const platformPath = fs.readFileSync(pathFile, "utf-8").trim();
    const binaryPath = path.join(distDir, platformPath);
    return fs.existsSync(binaryPath);
  } catch {
    return false;
  }
}

function extractElectron() {
  if (isElectronInstalled()) return;

  console.log("Ensuring Electron binary is installed...");

  const installScript = path.join(electronDir, "install.js");
  if (fs.existsSync(installScript)) {
    spawnSync(process.execPath, [installScript], { stdio: "inherit" });
  }

  if (isElectronInstalled()) return;

  const version = require(path.join(electronDir, "package.json")).version;
  const platform = process.platform;
  const arch = process.arch;
  const zipName = `electron-v${version}-${platform}-${arch}.zip`;
  const cacheRoot =
    process.env.electron_config_cache ||
    path.join(os.homedir(), ".cache", "electron");

  const cacheDirs = fs.existsSync(cacheRoot)
    ? fs.readdirSync(cacheRoot).map((d) => path.join(cacheRoot, d))
    : [];

  for (const dir of cacheDirs) {
    const zipPath = path.join(dir, zipName);
    if (fs.existsSync(zipPath)) {
      console.log(`Extracting ${zipName} from cache...`);
      if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
      }
      try {
        execSync(`unzip -qo "${zipPath}" -d "${distDir}"`, {
          stdio: "inherit",
        });
        const binName = platform === "win32" ? "electron.exe" : "electron";
        fs.writeFileSync(pathFile, binName);
        console.log("Electron binary installed.");
        return;
      } catch (e) {
        console.error("Failed to extract with unzip:", e.message);
      }
    }
  }

  console.error("Could not install Electron binary automatically.");
  console.error("Try running: npx install-electron");
}

const os = require("os");
extractElectron();

require("@electron/rebuild")
  .rebuild({
    buildPath: path.join(__dirname, ".."),
    electronVersion: require(path.join(electronDir, "package.json")).version,
  })
  .then(() => console.log("Native modules rebuilt."))
  .catch((e) => {
    console.error("Rebuild failed:", e.message);
    process.exit(1);
  });
