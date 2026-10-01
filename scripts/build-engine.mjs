import { existsSync, rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "engine", "daemon.py");
const dist = resolve(root, "engine", "dist");
const build = resolve(root, "engine", "build");
const executable = resolve(dist, process.platform === "win32" ? "chupacabra-engine.exe" : "chupacabra-engine");
const python = process.platform === "win32" ? "python" : "python3";

function run(args) {
  const result = spawnSync(python, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PyInstaller falhou com código ${result.status}.`);
  }
}

if (!existsSync(source)) {
  throw new Error(`Engine não encontrado: ${source}`);
}

mkdirSync(dist, { recursive: true });
if (existsSync(build)) rmSync(build, { recursive: true, force: true });
if (existsSync(executable)) rmSync(executable, { force: true });

console.log(`[Chupacabra] Gerando engine self-contained para ${process.platform}...`);

run([
  "-m", "PyInstaller",
  "--noconfirm",
  "--clean",
  "--onefile",
  "--name", "chupacabra-engine",
  "--distpath", dist,
  "--workpath", build,
  "--paths", root,
  "--paths", resolve(root, "mapScraper"),
  "--hidden-import", "pipeline.orchestrator",
  "--hidden-import", "enrichment.features",
  "--hidden-import", "enrichment.scoring",
  "--hidden-import", "enrichment.web_scraper",
  "--hidden-import", "mapScraper.placesCrawlerV2",
  "--hidden-import", "gerar_relatorio",
  "--hidden-import", "openpyxl",
  "--collect-all", "aiohttp",
  "--collect-all", "pandas",
  source,
]);

if (!existsSync(executable)) {
  throw new Error(`PyInstaller terminou sem gerar ${executable}`);
}

console.log(`[Chupacabra] Engine gerado em: ${executable}`);
