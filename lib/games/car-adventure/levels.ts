import type {
  AdventureAbility,
  AdventureEnemyKind,
  AdventureLevelJson,
} from "@/lib/gamekit/games/adventure-level";

/**
 * 共用關卡建造器。所有地面缺口維持 3 格（與第 1 關相同、已驗證可跳過），
 * 尖刺一律放在地面格正上方（row 9），確保不是懸空陷阱。
 */
function levelBuilder() {
  const solid: string[] = [];
  const spikes: string[] = [];
  const coins: [number, number][] = [];
  const enemies: { x: number; y: number; kind?: AdventureEnemyKind }[] = [];
  const breakableTiles: string[] = [];
  const secretTiles: string[] = [];
  const movingPlatforms: NonNullable<AdventureLevelJson["movingPlatforms"]> =
    [];
  const abilityGates: NonNullable<AdventureLevelJson["abilityGates"]> = [];
  const grantedAbilities: AdventureAbility[] = [];

  return {
    ground(a: number, b: number, baseRow = 10): void {
      for (let x = a; x <= b; x++) {
        solid.push(`${x},${baseRow}`, `${x},${baseRow + 1}`);
      }
    },
    plat(a: number, b: number, row: number): void {
      for (let x = a; x <= b; x++) solid.push(`${x},${row}`);
    },
    coin(x: number, y: number): void {
      coins.push([x, y]);
    },
    coinRow(a: number, b: number, y: number): void {
      for (let x = a; x <= b; x++) coins.push([x, y]);
    },
    spike(x: number, y: number): void {
      spikes.push(`${x},${y}`);
    },
    enemy(x: number, y: number, kind?: AdventureEnemyKind): void {
      enemies.push(kind ? { x, y, kind } : { x, y });
    },
    breakable(x: number, y: number): void {
      breakableTiles.push(`${x},${y}`);
    },
    secret(x: number, y: number): void {
      secretTiles.push(`${x},${y}`);
    },
    movingPlatform(
      x: number,
      y: number,
      opts: { w?: number; axis?: "x" | "y"; range?: number; speed?: number } = {},
    ): void {
      movingPlatforms.push({ x, y, ...opts });
    },
    abilityGate(x: number, y: number, ability: AdventureAbility): void {
      abilityGates.push({ x, y, ability });
    },
    grantAbility(ability: AdventureAbility): void {
      if (!grantedAbilities.includes(ability)) grantedAbilities.push(ability);
    },
    done(
      meta: Pick<AdventureLevelJson, "id" | "name" | "cols"> & {
        start: [number, number];
        finish: [number, number, number?, number?];
        targetTime: number;
      },
    ): AdventureLevelJson {
      return {
        id: meta.id,
        name: meta.name,
        tileSize: 36,
        cols: meta.cols,
        rows: 12,
        solid,
        spikes,
        coins,
        enemies,
        start: meta.start,
        finish: meta.finish,
        targetTime: meta.targetTime,
        ...(breakableTiles.length ? { breakable: breakableTiles } : {}),
        ...(secretTiles.length ? { secrets: secretTiles } : {}),
        ...(movingPlatforms.length ? { movingPlatforms } : {}),
        ...(abilityGates.length ? { abilityGates } : {}),
        ...(grantedAbilities.length ? { abilities: grantedAbilities } : {}),
      };
    },
  };
}

/** 關卡 1：草原出發（入門，原硬編關卡）。 */
function buildLevel01Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 13);
  b.ground(17, 29);
  b.ground(32, 49);
  b.ground(52, 89);
  b.ground(92, 107);
  b.plat(5, 8, 7);
  b.plat(20, 24, 7);
  b.plat(36, 40, 6);
  b.plat(45, 48, 6);
  b.coinRow(5, 8, 6);
  b.coinRow(14, 16, 7);
  b.coinRow(20, 24, 6);
  b.coinRow(36, 40, 5);
  b.coin(43, 7);
  b.coin(44, 6);
  b.coinRow(45, 48, 5);
  b.coinRow(56, 60, 6);
  b.coinRow(64, 68, 4);
  b.coinRow(78, 82, 9);
  b.coinRow(95, 100, 9);
  b.spike(70, 9);
  b.spike(71, 9);
  b.spike(72, 9);
  b.enemy(24, 9);
  b.enemy(40, 9);
  b.enemy(60, 9);
  b.enemy(82, 9);
  return b.done({
    id: "level-01",
    name: "草原出發",
    cols: 108,
    start: [2, 9],
    finish: [104, 8, 1, 2],
    targetTime: 75,
  });
}

/** 關卡 2：彩虹捷徑（補足長度與難度，使其高於第 1 關）。 */
function buildLevel02Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 13);
  b.ground(17, 30);
  b.ground(34, 50);
  b.ground(54, 78);
  b.ground(82, 100);
  b.ground(104, 119);
  b.plat(6, 9, 7);
  b.plat(20, 24, 7);
  b.plat(38, 42, 6);
  b.plat(60, 64, 6);
  b.plat(88, 92, 5);
  b.plat(108, 112, 7);
  b.coinRow(6, 9, 6);
  b.coinRow(20, 24, 6);
  b.coinRow(38, 42, 5);
  b.coinRow(60, 64, 5);
  b.coinRow(88, 92, 4);
  b.coinRow(108, 112, 6);
  // 可破壞磚示範：撞碎頭頂磚才拿得到上方藏起來的金幣。
  b.breakable(28, 7);
  b.breakable(29, 7);
  b.coin(28, 5);
  b.coin(29, 5);
  // 秘密格在短缺口上方，跳過時會揭示一枚隱藏金幣。
  b.secret(15, 8);
  b.spike(70, 9);
  b.spike(71, 9);
  b.enemy(24, 9);
  b.enemy(44, 9);
  b.enemy(68, 9);
  b.enemy(95, 9);
  return b.done({
    id: "level-02",
    name: "彩虹捷徑",
    cols: 120,
    start: [2, 9],
    finish: [116, 8, 1, 2],
    targetTime: 88,
  });
}

/** 關卡 3：高低起伏（更多平台與尖刺）。 */
function buildLevel03Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 28);
  b.ground(32, 46);
  b.ground(50, 66);
  b.ground(70, 86);
  b.ground(90, 108);
  b.ground(112, 131);
  b.plat(5, 8, 7);
  b.plat(20, 24, 6);
  b.plat(36, 40, 6);
  b.plat(56, 60, 5);
  b.plat(76, 80, 6);
  b.plat(96, 100, 5);
  b.plat(118, 122, 7);
  // 移動平台示範：橫跨 13–15 的 3 格缺口（缺口本身可跳過，reduced 靜止仍可通）。
  b.movingPlatform(13, 10, { w: 2, axis: "x", range: 2, speed: 70 });
  b.coinRow(5, 8, 6);
  b.coinRow(20, 24, 5);
  b.coinRow(36, 40, 5);
  b.coinRow(56, 60, 4);
  b.coinRow(76, 80, 5);
  b.coinRow(96, 100, 4);
  b.coinRow(118, 122, 6);
  b.spike(40, 9);
  b.spike(41, 9);
  b.spike(78, 9);
  b.spike(79, 9);
  b.enemy(22, 9);
  b.enemy(38, 9);
  b.enemy(58, 9);
  b.enemy(82, 9);
  b.enemy(100, 9);
  return b.done({
    id: "level-03",
    name: "高低起伏",
    cols: 132,
    start: [2, 9],
    finish: [126, 8, 1, 2],
    targetTime: 102,
  });
}

/** 關卡 4：尖刺迷宮（尖刺密度提高）。 */
function buildLevel04Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 44);
  b.ground(48, 62);
  b.ground(66, 80);
  b.ground(84, 100);
  b.ground(104, 120);
  b.ground(124, 145);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(34, 38, 6);
  b.plat(52, 56, 5);
  b.plat(70, 74, 6);
  b.plat(90, 94, 5);
  b.plat(110, 114, 6);
  b.plat(130, 134, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(34, 38, 5);
  b.coinRow(52, 56, 4);
  b.coinRow(70, 74, 5);
  b.coinRow(90, 94, 4);
  b.coinRow(110, 114, 5);
  b.coinRow(130, 134, 6);
  b.spike(38, 9);
  b.spike(39, 9);
  b.spike(56, 9);
  b.spike(57, 9);
  b.spike(92, 9);
  b.spike(93, 9);
  b.enemy(20, 9);
  b.enemy(36, 9);
  b.enemy(54, 9);
  b.enemy(72, 9);
  b.enemy(95, 9);
  b.enemy(112, 9);
  // 新敵人示範：定點彈跳車（可踩）＋飄浮尖刺球（不可踩＝危險）。
  b.enemy(60, 9, "hopper");
  b.enemy(75, 6, "floater");
  return b.done({
    id: "level-04",
    name: "尖刺迷宮",
    cols: 146,
    start: [2, 9],
    finish: [140, 8, 1, 2],
    targetTime: 116,
  });
}

/** 關卡 5：空中走廊（長度與敵人再升級）。 */
function buildLevel05Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 42);
  b.ground(46, 58);
  b.ground(62, 74);
  b.ground(78, 92);
  b.ground(96, 112);
  b.ground(116, 132);
  b.ground(136, 157);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(33, 37, 5);
  b.plat(49, 53, 6);
  b.plat(65, 69, 5);
  b.plat(82, 86, 6);
  b.plat(100, 104, 5);
  b.plat(120, 124, 6);
  b.plat(142, 146, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(33, 37, 4);
  b.coinRow(49, 53, 5);
  b.coinRow(65, 69, 4);
  b.coinRow(82, 86, 5);
  b.coinRow(100, 104, 4);
  b.coinRow(120, 124, 5);
  b.coinRow(142, 146, 6);
  b.spike(36, 9);
  b.spike(37, 9);
  b.spike(52, 9);
  b.spike(53, 9);
  b.spike(84, 9);
  b.spike(85, 9);
  b.spike(104, 9);
  b.spike(105, 9);
  b.enemy(20, 9);
  b.enemy(34, 9);
  b.enemy(50, 9);
  b.enemy(68, 9);
  b.enemy(86, 9);
  b.enemy(108, 9);
  b.enemy(124, 9);
  // 能力示範：當關暫時獲得跳高，穿過能力門越過較高的捷徑。
  b.grantAbility("jump-higher");
  b.abilityGate(28, 8, "jump-higher");
  return b.done({
    id: "level-05",
    name: "空中走廊",
    cols: 158,
    start: [2, 9],
    finish: [150, 8, 1, 2],
    targetTime: 132,
  });
}

/** 關卡 6：終極大冒險（最長、最多障礙的收尾關）。 */
function buildLevel06Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 42);
  b.ground(46, 56);
  b.ground(60, 72);
  b.ground(76, 88);
  b.ground(92, 104);
  b.ground(108, 122);
  b.ground(126, 140);
  b.ground(144, 175);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(33, 37, 5);
  b.plat(48, 52, 6);
  b.plat(63, 67, 5);
  b.plat(79, 83, 6);
  b.plat(95, 99, 5);
  b.plat(112, 116, 6);
  b.plat(130, 134, 5);
  b.plat(150, 154, 7);
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(33, 37, 4);
  b.coinRow(48, 52, 5);
  b.coinRow(63, 67, 4);
  b.coinRow(79, 83, 5);
  b.coinRow(95, 99, 4);
  b.coinRow(112, 116, 5);
  b.coinRow(130, 134, 4);
  b.coinRow(150, 154, 6);
  b.spike(36, 9);
  b.spike(37, 9);
  b.spike(50, 9);
  b.spike(51, 9);
  b.spike(66, 9);
  b.spike(67, 9);
  b.spike(98, 9);
  b.spike(99, 9);
  b.spike(116, 9);
  b.spike(117, 9);
  b.spike(132, 9);
  b.enemy(20, 9);
  b.enemy(34, 9);
  b.enemy(48, 9);
  b.enemy(64, 9);
  b.enemy(82, 9);
  b.enemy(98, 9);
  b.enemy(114, 9);
  b.enemy(134, 9);
  b.enemy(160, 9);
  // 收尾關示範衝刺能力門與水平破磚；能力只在本關生效，不改 garage。
  b.grantAbility("dash");
  b.grantAbility("break");
  b.abilityGate(58, 8, "dash");
  b.breakable(126, 9);
  b.coin(126, 7);
  return b.done({
    id: "level-06",
    name: "終極大冒險",
    cols: 176,
    start: [2, 9],
    finish: [168, 8, 1, 2],
    targetTime: 150,
  });
}

/** 關卡 7：黏土工坊（綜合能力、移動平台與秘密格）。 */
function buildLevel07Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 28);
  b.ground(32, 46);
  b.ground(50, 64);
  b.ground(68, 82);
  b.ground(86, 101);
  b.ground(105, 120);
  b.ground(124, 142);
  b.ground(146, 179);
  b.plat(5, 8, 7);
  b.plat(19, 23, 6);
  b.plat(36, 40, 5);
  b.plat(54, 58, 6);
  b.plat(73, 77, 5);
  b.plat(91, 95, 6);
  b.plat(112, 116, 5);
  b.plat(132, 136, 6);
  b.plat(153, 158, 7);
  b.movingPlatform(29, 10, { w: 2, axis: "x", range: 2, speed: 82 });
  b.coinRow(5, 8, 6);
  b.coinRow(19, 23, 5);
  b.coinRow(36, 40, 4);
  b.coinRow(54, 58, 5);
  b.coinRow(73, 77, 4);
  b.coinRow(91, 95, 5);
  b.coinRow(112, 116, 4);
  b.coinRow(132, 136, 5);
  b.coinRow(153, 158, 6);
  b.spike(39, 9);
  b.spike(40, 9);
  b.spike(57, 9);
  b.spike(58, 9);
  b.spike(76, 9);
  b.spike(77, 9);
  b.spike(94, 9);
  b.spike(95, 9);
  b.spike(116, 9);
  b.spike(117, 9);
  b.spike(136, 9);
  b.spike(137, 9);
  b.enemy(22, 9);
  b.enemy(38, 9, "hopper");
  b.enemy(56, 9);
  b.enemy(75, 6, "floater");
  b.enemy(92, 9);
  b.enemy(114, 9, "hopper");
  b.enemy(134, 9);
  b.enemy(156, 9);
  b.enemy(168, 9, "hopper");
  b.enemy(174, 6, "floater");
  b.breakable(96, 9);
  b.breakable(97, 9);
  b.coin(96, 7);
  b.coin(97, 7);
  b.secret(81, 8);
  b.grantAbility("dash");
  b.grantAbility("break");
  b.abilityGate(30, 8, "dash");
  return b.done({
    id: "level-07",
    name: "黏土工坊",
    cols: 180,
    start: [2, 9],
    finish: [174, 8, 1, 2],
    targetTime: 168,
  });
}

/** 關卡 8：月光終點（八關收尾，三種能力全部登場）。 */
function buildLevel08Json(): AdventureLevelJson {
  const b = levelBuilder();
  b.ground(0, 12);
  b.ground(16, 26);
  b.ground(30, 42);
  b.ground(46, 58);
  b.ground(62, 74);
  b.ground(78, 90);
  b.ground(94, 108);
  b.ground(112, 126);
  b.ground(130, 145);
  b.ground(149, 169);
  b.ground(173, 195);
  b.plat(5, 8, 7);
  b.plat(18, 22, 6);
  b.plat(33, 37, 5);
  b.plat(49, 53, 6);
  b.plat(65, 69, 4);
  b.plat(81, 85, 6);
  b.plat(98, 102, 5);
  b.plat(115, 119, 6);
  b.plat(134, 138, 5);
  b.plat(153, 157, 6);
  b.plat(180, 185, 7);
  b.movingPlatform(27, 9, { w: 2, axis: "y", range: 1, speed: 56 });
  b.movingPlatform(170, 9, { w: 2, axis: "x", range: 2, speed: 90 });
  b.coinRow(5, 8, 6);
  b.coinRow(18, 22, 5);
  b.coinRow(33, 37, 4);
  b.coinRow(49, 53, 5);
  b.coinRow(65, 69, 3);
  b.coinRow(81, 85, 5);
  b.coinRow(98, 102, 4);
  b.coinRow(115, 119, 5);
  b.coinRow(134, 138, 4);
  b.coinRow(153, 157, 5);
  b.coinRow(180, 185, 6);
  b.spike(35, 9);
  b.spike(36, 9);
  b.spike(52, 9);
  b.spike(53, 9);
  b.spike(68, 9);
  b.spike(69, 9);
  b.spike(84, 9);
  b.spike(85, 9);
  b.spike(101, 9);
  b.spike(102, 9);
  b.spike(118, 9);
  b.spike(119, 9);
  b.spike(136, 9);
  b.spike(137, 9);
  b.spike(155, 9);
  b.spike(156, 9);
  b.enemy(20, 9);
  b.enemy(34, 9, "hopper");
  b.enemy(50, 9);
  b.enemy(66, 9, "hopper");
  b.enemy(82, 6, "floater");
  b.enemy(100, 9);
  b.enemy(116, 9, "hopper");
  b.enemy(134, 9);
  b.enemy(152, 9, "hopper");
  b.enemy(168, 6, "floater");
  b.enemy(184, 9);
  b.breakable(126, 9);
  b.breakable(127, 9);
  b.coin(126, 7);
  b.coin(127, 7);
  b.secret(73, 8);
  b.secret(144, 8);
  b.grantAbility("jump-higher");
  b.grantAbility("dash");
  b.grantAbility("break");
  b.abilityGate(43, 8, "jump-higher");
  b.abilityGate(59, 8, "dash");
  return b.done({
    id: "level-08",
    name: "月光終點",
    cols: 196,
    start: [2, 9],
    finish: [190, 8, 1, 2],
    targetTime: 188,
  });
}

export const CAR_ADVENTURE_LEVELS: AdventureLevelJson[] = [
  buildLevel01Json(),
  buildLevel02Json(),
  buildLevel03Json(),
  buildLevel04Json(),
  buildLevel05Json(),
  buildLevel06Json(),
  buildLevel07Json(),
  buildLevel08Json(),
];
