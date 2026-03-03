import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupFrontend(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../dist/public");
    const expressModule = await import("express");
    app.use(expressModule.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    return;
  }

  try {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "../vite.config.mjs"),
      server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } catch (e) {
    console.warn("Vite not available, serving static files:", (e as Error).message);
    const clientDir = path.resolve(__dirname, "../client");
    const expressModule = await import("express");
    app.use(expressModule.default.static(clientDir));
  }
}
