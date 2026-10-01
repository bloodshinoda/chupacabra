import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "icon.png");
const target = resolve(root, "public", "icon.png");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("[Chupacabra] Ícone preparado para o frontend:", target);
