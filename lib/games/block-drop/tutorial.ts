export type BlockDropTutorialStep = "move" | "rotate" | "line";

export type BlockDropTutorialProgress = {
  move: boolean;
  rotate: boolean;
  line: boolean;
};

export const BLOCK_DROP_TUTORIAL_STORAGE_KEY = "cheche:block-drop-tutorial-v1";

export const EMPTY_BLOCK_DROP_TUTORIAL: BlockDropTutorialProgress = {
  move: false,
  rotate: false,
  line: false,
};

export const BLOCK_DROP_TUTORIAL_COPY: Record<
  BlockDropTutorialStep,
  { title: string; body: string }
> = {
  move: { title: "先試試移動", body: "左右移動，找一個舒服的位置。" },
  rotate: { title: "需要轉彎時", body: "按一下旋轉，方塊就會換個方向。" },
  line: { title: "快要排滿了！", body: "把這一排補滿，就會整排消除。" },
};

export function firstBlockDropTutorialStep(
  progress: BlockDropTutorialProgress,
): BlockDropTutorialStep | null {
  if (!progress.move) return "move";
  if (!progress.rotate) return "rotate";
  if (!progress.line) return "line";
  return null;
}

/** 動作完成後的提示：旋轉完成後先收起，等盤面真的接近滿排才提示 line。 */
export function stepAfterBlockDropAction(
  progress: BlockDropTutorialProgress,
  step: Exclude<BlockDropTutorialStep, "line">,
): BlockDropTutorialStep | null {
  if (step === "move" && !progress.rotate) return "rotate";
  return null;
}

export function completeBlockDropTutorialStep(
  progress: BlockDropTutorialProgress,
  step: BlockDropTutorialStep,
): BlockDropTutorialProgress {
  return { ...progress, [step]: true };
}

export function skipBlockDropTutorial(): BlockDropTutorialProgress {
  return { move: true, rotate: true, line: true };
}

/** 棋盤任一行只差 threshold 格，代表玩家正要理解消行。 */
export function isBlockDropBoardNearLine(
  board: readonly (readonly unknown[])[],
  threshold = 2,
): boolean {
  return board.some((row) => row.filter(Boolean).length >= Math.max(1, row.length - threshold));
}
