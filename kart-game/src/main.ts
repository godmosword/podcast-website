import { Game } from "./core/Game";

const mount = document.getElementById("game-root");
if (!mount) throw new Error("找不到 #game-root");

const game = new Game(mount);

window.addEventListener("beforeunload", () => game.dispose());
