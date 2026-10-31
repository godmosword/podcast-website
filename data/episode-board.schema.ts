/**
 * 角色看板 JSON 的 Zod 契約。
 * 執行時用 safeParse，單筆壞掉只丟掉那一筆，不讓整頁丟例外。
 * 這個模組只給 server 與測試用，client 元件不直接 import。
 */
import { z } from "zod";

export const episodeBoardEntrySchema = z.object({
  id: z.string().trim().min(1).max(40),
  character: z.string().trim().min(1).max(40),
  action: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(240),
  href: z.string().trim().min(1).max(120),
});

export const episodeBoardFileSchema = z.object({
  version: z.literal(1),
  episodes: z.array(z.unknown()),
});

export type EpisodeBoardEntry = z.infer<typeof episodeBoardEntrySchema>;
