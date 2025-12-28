import { app, BrowserWindow, dialog, ipcMain, protocol } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";

const isDev = !app.isPackaged;

function getBundledTemplatesDir(): string {
  // In dev, templates folder sits at project root.
  // In prod, you’ll typically copy it into resources. Adjust as needed when packaging.
  if (!app.isPackaged) {
    return path.join(process.cwd(), "templates");
  }
  return path.join(process.resourcesPath, "templates");
}

function getUserTemplatesDir(): string {
  return path.join(app.getPath("userData"), "templates");
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function listTemplates(): Array<any> {
  const bundledDir = getBundledTemplatesDir();
  const userDir = getUserTemplatesDir();
  ensureDir(userDir);

  const scan = (baseDir: string, source: "bundled" | "user") => {
    if (!fs.existsSync(baseDir)) return [];
    const entries: fs.Dirent[] = fs.readdirSync(baseDir, { withFileTypes: true });
    const folders = entries.filter((e: fs.Dirent) => e.isDirectory()).map((e: fs.Dirent) => e.name);

    const templates = [];
    for (const folder of folders) {
      const tmplPath = path.join(baseDir, folder, "template.json");
      if (!fs.existsSync(tmplPath)) continue;
      try {
        const tmpl = JSON.parse(fs.readFileSync(tmplPath, "utf-8"));
        templates.push({
          ...tmpl,
          source,
          baseDir: path.join(baseDir, folder)
        });
      } catch {
        // ignore invalid template
      }
    }
    return templates;
  };

  return [...scan(bundledDir, "bundled"), ...scan(userDir, "user")];
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      //preload: path.join(app.getAppPath(), "dist-electron/preload.js"),
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await win.loadURL("http://127.0.0.1:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // After vite build, renderer output is in dist/
    await win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
  }
}

app.whenReady().then(async () => {
  
  protocol.registerBufferProtocol("appimg", (request, respond) => {
    try {
      // request.url like: appimg://C:/Users/.../plate.jpg  (encoded)
      const raw = request.url.replace("appimg://", "");
      const filePath = decodeURIComponent(raw);

      const data = fs.readFileSync(filePath);

      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".webp" ? "image/webp" :
        "application/octet-stream";

      respond({ mimeType: mime, data });
    } catch (err) {
      console.error("appimg load failed:", err);
      respond({ mimeType: "text/plain", data: Buffer.from("Not found") });
    }
  });

  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC: list templates
ipcMain.handle("templates:list", async () => {
  const bundled = getBundledTemplatesDir();
  const user = getUserTemplatesDir();

  console.log("Bundled templates dir:", bundled);
  console.log("User templates dir:", user);
  console.log("Bundled exists:", fs.existsSync(bundled));
  console.log(
    "Bundled entries:",
    fs.existsSync(bundled) ? fs.readdirSync(bundled) : []
  );
  return listTemplates();
});

// IPC: read template assets (image path + anchors json string)
ipcMain.handle("templates:readAssets", async (_evt, templateId: string) => {
  const templates = listTemplates();
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) throw new Error(`Template not found: ${templateId}`);

  const imgPath = path.join(tmpl.baseDir, tmpl.image);
  const anchorsPath = path.join(tmpl.baseDir, tmpl.anchors);

  const anchorsJson = fs.readFileSync(anchorsPath, "utf-8");
  return { imagePath: imgPath, anchorsJson };
});

// IPC: open Lua diff files
ipcMain.handle("files:openLuaDiff", async (evt, opts: { single?: boolean } = {}) => {
  const win = BrowserWindow.fromWebContents(evt.sender);

  const res = await dialog.showOpenDialog(win!, {
    title: "Select DCS .diff.lua file",
    properties: opts.single ? ["openFile"] : ["openFile", "multiSelections"],
    filters: [{ name: "DCS diff lua", extensions: ["lua"] }]
  });

  if (res.canceled) return [];

  return res.filePaths.map((p) => ({
    name: path.basename(p),
    path: p,
    content: fs.readFileSync(p, "utf-8")
  }));
});

// IPC: add template (copy into user templates)
ipcMain.handle(
  "templates:add",
  async (
    _evt,
    payload: {
      name: string;
      imageFilePath: string;
      anchorsFilePath: string;
      defaultPage?: { size: string; orientation: string; marginMm: number };
    }
  ) => {
    const userDir = getUserTemplatesDir();
    ensureDir(userDir);

    const safeIdBase = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const id = `${safeIdBase}-${Date.now()}`;
    const outDir = path.join(userDir, id);
    ensureDir(outDir);

    const imageExt = path.extname(payload.imageFilePath).toLowerCase();
    const imageName = `plate${imageExt}`;
    const anchorsName = `anchors.json`;

    fs.copyFileSync(payload.imageFilePath, path.join(outDir, imageName));
    fs.copyFileSync(payload.anchorsFilePath, path.join(outDir, anchorsName));

    const templateJson = {
      id,
      name: payload.name,
      image: imageName,
      anchors: anchorsName,
      defaultPage: payload.defaultPage ?? {
        size: "A4",
        orientation: "landscape",
        marginMm: 8
      }
    };

    fs.writeFileSync(
      path.join(outDir, "template.json"),
      JSON.stringify(templateJson, null, 2),
      "utf-8"
    );

    return { ...templateJson, source: "user", baseDir: outDir };
  }
);

// IPC: export PDF using printToPDF
ipcMain.handle(
  "pdf:export",
  async (
    evt,
    options: { pageSize: "A4" | "A5" | "Letter"; landscape: boolean }
  ) => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    if (!win) throw new Error("No BrowserWindow for export.");

    const res = await dialog.showSaveDialog(win, {
      title: "Save PDF",
      defaultPath: "hotas-layout.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });

    if (res.canceled || !res.filePath) return { savedPath: null };

    const pdfData = await win.webContents.printToPDF({
      pageSize: options.pageSize,
      landscape: options.landscape,
      printBackground: true,
      //marginsType: 0
    });

    fs.writeFileSync(res.filePath, pdfData);
    return { savedPath: res.filePath };
  }
);
