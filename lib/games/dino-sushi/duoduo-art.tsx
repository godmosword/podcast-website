import type { Mood } from "./reactions";

/**
 * 多多的嘴與表情名稱。局內畫面用黏土貼紙（duoduo-sticker.tsx），
 * 向量檔已退役，這裡只留貼紙還在用的型別。
 */

export type DuoDuoMouth = "closed" | "open" | "chew" | "laugh";
export type DuoDuoFace = Mood | "idle";
