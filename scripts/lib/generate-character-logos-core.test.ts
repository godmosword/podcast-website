import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PILOT_SLUGS,
  TIER1_SLUGS,
  getCharacterLogos,
} from "@/data/character-logos";
import { CLAY_STYLE_PREFIX } from "./illustrate-core";
import {
  LOGO_NATIVE_SIZE,
  LOGO_OUTPUT_PX,
  LOGO_PILOT_PARAMS_LOCKED,
  LOGO_STAGING_DIR,
  assertGenerationAllowed,
  assertLogoPublicPath,
  assertPromptIsNotClay,
  buildContactHtml,
  buildLogoJobs,
  candidateFileName,
  defaultCandidateCount,
  estimateLogoCostUsd,
  formatDryRunReport,
  isRetryableImageError,
  isModerationBlockedError,
  formatImageGenerationError,
  logoPathsFor,
  parseLogoCliArgs,
  remainingTier1Slugs,
  selectApproveCandidate,
  updateCharacterLogoStatus,
  withOneRetry,
  writeApprovedWebpPyramid,
  generateJobsToStaging,
  approveLogoFromStaging,
  assertLogoContrastForTargets,
} from "./generate-character-logos-core";

const PILOT_REMAINING_TIER1 = TIER1_SLUGS.filter(
  (slug) => !(PILOT_SLUGS as readonly string[]).includes(slug),
);

describe("parseLogoCliArgs", () => {
  it("拒絕空手，避免誤生 35 張", () => {
    expect(() => parseLogoCliArgs([])).toThrow(/--pilot、--tier 或 --slug/);
  });

  it("解析 --pilot --dry-run，預設 4 候選、high", () => {
    const args = parseLogoCliArgs(["--pilot", "--dry-run"]);
    expect(args.mode).toBe("dry-run");
    expect(args.selection).toEqual({ kind: "pilot" });
    expect(args.quality).toBe("high");
    expect(args.candidates).toBeUndefined();
  });

  it("解析 --tier 1／2 與 --slug、--candidates、--pick", () => {
    expect(parseLogoCliArgs(["--tier", "1"]).selection).toEqual({
      kind: "tier",
      tier: 1,
    });
    expect(parseLogoCliArgs(["--tier", "2", "--quality", "medium"]).quality).toBe(
      "medium",
    );
    const slugArgs = parseLogoCliArgs([
      "--slug",
      "xiao-hong",
      "--candidates",
      "3",
      "--approve",
      "--pick",
      "2",
    ]);
    expect(slugArgs.mode).toBe("approve");
    expect(slugArgs.selection).toEqual({
      kind: "slug",
      slugs: ["xiao-hong"],
    });
    expect(slugArgs.candidates).toBe(3);
    expect(slugArgs.pick).toBe(2);
  });

  it("互斥旗標與非法值會丟錯", () => {
    expect(() => parseLogoCliArgs(["--pilot", "--tier", "1"])).toThrow(/只能選一種/);
    expect(() => parseLogoCliArgs(["--dry-run", "--approve", "--pilot"])).toThrow(
      /不能同時/,
    );
    expect(() => parseLogoCliArgs(["--tier", "3"])).toThrow(/--tier 只能是 1 或 2/);
    expect(() => parseLogoCliArgs(["--slug", "xiao-hong", "--candidates", "0"])).toThrow(
      /--candidates/,
    );
    expect(() => parseLogoCliArgs(["--approve", "--pilot"])).toThrow(
      /--approve 必須搭配單一 --slug/,
    );
  });
});

describe("buildLogoJobs", () => {
  it("Pilot 三位、每角 4 張，prompt 走 logo 系統而非黏土前綴", () => {
    const jobs = buildLogoJobs(parseLogoCliArgs(["--pilot", "--dry-run"]));
    expect(jobs.map((job) => job.slug)).toEqual([...PILOT_SLUGS]);
    expect(jobs.every((job) => job.candidates === 4)).toBe(true);
    expect(jobs.reduce((sum, job) => sum + job.candidates, 0)).toBe(12);
    for (const job of jobs) {
      expect(job.prompt).not.toContain(CLAY_STYLE_PREFIX);
      expect(job.prompt).toContain("simplified IP mascot logo");
      assertPromptIsNotClay(job.prompt);
    }
  });

  it("--tier 1 只生 Pilot 以外的 7 位、預設 2 候選", () => {
    const jobs = buildLogoJobs(parseLogoCliArgs(["--tier", "1", "--dry-run"]));
    expect(jobs.map((job) => job.slug)).toEqual([...PILOT_REMAINING_TIER1]);
    expect(jobs).toHaveLength(7);
    expect(jobs.every((job) => job.candidates === 2)).toBe(true);
  });

  it("--tier 2 列出 25 位但未鎖定參數時禁止真正生圖", () => {
    expect(LOGO_PILOT_PARAMS_LOCKED).toBe(false);
    const jobs = buildLogoJobs(parseLogoCliArgs(["--tier", "2", "--dry-run"]));
    expect(jobs).toHaveLength(25);
    expect(jobs.every((job) => job.candidates === 1)).toBe(true);
    expect(() =>
      assertGenerationAllowed(parseLogoCliArgs(["--tier", "2"])),
    ).toThrow(/未回填 Pilot 系統參數前不得開 Tier 2/);
    expect(() =>
      assertGenerationAllowed(parseLogoCliArgs(["--tier", "2", "--dry-run"])),
    ).not.toThrow();
  });

  it("未知 slug 拒絕", () => {
    expect(() =>
      buildLogoJobs(parseLogoCliArgs(["--slug", "not-a-car", "--dry-run"])),
    ).toThrow(/未知 slug：not-a-car/);
  });
});

describe("dry-run 報價", () => {
  it("標明不呼叫 API，並列張數與估價", () => {
    const args = parseLogoCliArgs(["--pilot", "--dry-run"]);
    const jobs = buildLogoJobs(args);
    const report = formatDryRunReport({
      args,
      jobs,
      model: "gpt-image-2",
    });
    expect(report).toContain("【dry-run】不呼叫 API");
    expect(report).toContain(LOGO_NATIVE_SIZE);
    expect(report).toContain("影像呼叫次數：12");
    expect(report).toContain("不含 timeout／審核重試");
    expect(report).toContain(`約 US$${estimateLogoCostUsd(12, "high").toFixed(2)}`);
    expect(report).toContain("xiao-hong");
    expect(report).not.toContain(CLAY_STYLE_PREFIX);
  });

  it("估價用 medium／high 單價", () => {
    expect(estimateLogoCostUsd(10, "medium")).toBeCloseTo(0.53, 5);
    expect(estimateLogoCostUsd(10, "high")).toBeCloseTo(2.11, 5);
  });

  it("dry-run 扣除已有 staging，不把沿用檔算進估價", () => {
    const repo = mkdtempSync(join(tmpdir(), "logo-dry-"));
    const stagingRoot = join(repo, "public/.logo-staging");
    mkdirSync(join(stagingRoot, "xiao-hong"), { recursive: true });
    writeFileSync(join(stagingRoot, "xiao-hong/01.png"), "png");
    writeFileSync(join(stagingRoot, "xiao-hong/02.png"), "png");
    const args = parseLogoCliArgs(["--pilot", "--dry-run"]);
    const jobs = buildLogoJobs(args);
    const report = formatDryRunReport({
      args,
      jobs,
      model: "gpt-image-2",
      stagingRoot,
    });
    expect(report).toContain("影像呼叫次數：10");
    expect(report).toContain("已有 2 張 staging 將跳過");
    expect(report).toContain("xiao-hong  小紅  ×4（沿用 2，待生 2）");
    expect(report).toContain(`約 US$${estimateLogoCostUsd(10, "high").toFixed(2)}`);
  });
});

describe("approve 契約", () => {
  it("多候選必須 --pick；單一候選可省略", () => {
    const many = [
      { index: 1, file: "01.png" },
      { index: 2, file: "02.png" },
    ];
    expect(() => selectApproveCandidate(many)).toThrow(/--pick/);
    expect(selectApproveCandidate(many, 2).file).toBe("02.png");
    expect(selectApproveCandidate([{ index: 1, file: "01.png" }]).file).toBe(
      "01.png",
    );
  });

  it("只准寫入 characters/logo webp，禁止定裝照 jpg", () => {
    expect(() =>
      assertLogoPublicPath("/tmp/repo/public/characters/小紅賽車.jpg"),
    ).toThrow(/定裝照/);
    expect(() =>
      assertLogoPublicPath("/tmp/repo/public/characters/logo/xiao-hong-32.webp"),
    ).not.toThrow();
  });

  it("更新 roster status 不改其他欄位", () => {
    const dir = mkdtempSync(join(tmpdir(), "logo-roster-"));
    const rosterPath = join(dir, "character-logos.json");
    writeFileSync(
      rosterPath,
      JSON.stringify(
        [
          {
            slug: "xiao-hong",
            name: "小紅",
            vehicle: "賽車",
            family: "speed",
            feature: "單一尾翼",
            ipColorPrimary: "#FFC9B8",
            ipColorSecondary: "#C5D8F0",
            tier: 1,
            status: "pending",
            notes: "keep-me",
          },
        ],
        null,
        2,
      ) + "\n",
    );
    updateCharacterLogoStatus(rosterPath, "xiao-hong", "accepted");
    const updated = JSON.parse(readFileSync(rosterPath, "utf8")) as Array<{
      status: string;
      notes: string;
    }>;
    expect(updated[0]?.status).toBe("accepted");
    expect(updated[0]?.notes).toBe("keep-me");
  });
});

describe("retry 與檔名", () => {
  it("5xx／timeout／審核擋可重試一次，其他 4xx 不重試", () => {
    expect(isRetryableImageError({ status: 503 })).toBe(true);
    expect(isRetryableImageError({ code: "ETIMEDOUT" })).toBe(true);
    expect(isRetryableImageError({ status: 400 })).toBe(false);
    expect(
      isRetryableImageError({ status: 400, code: "moderation_blocked" }),
    ).toBe(true);
    expect(
      isModerationBlockedError({
        status: 400,
        code: "moderation_blocked",
        error: {
          code: "moderation_blocked",
          moderation_details: {
            moderation_stage: "output",
            categories: ["violence"],
          },
        },
      }),
    ).toBe(true);
    expect(
      formatImageGenerationError({
        code: "moderation_blocked",
        error: {
          moderation_details: {
            moderation_stage: "output",
            categories: ["violence"],
          },
        },
      }),
    ).toBe('moderation_blocked stage=output categories=["violence"]');
  });

  it("withOneRetry：第一次失敗且可重試則再呼叫一次", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ status: 502 })
      .mockResolvedValueOnce("ok");
    await expect(withOneRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("withOneRetry：第二次仍失敗就停", async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue({ status: 502 });
    await expect(withOneRetry(fn)).rejects.toMatchObject({ status: 502 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("候選檔名從 01 起跳", () => {
    expect(candidateFileName(1)).toBe("01.png");
    expect(candidateFileName(4)).toBe("04.png");
  });
});

describe("contact html 與路徑", () => {
  it("contact 含 32px 預覽與候選檔名", () => {
    const html = buildContactHtml({
      slug: "xiao-hong",
      name: "小紅",
      candidateCount: 4,
    });
    expect(html).toContain("01.png");
    expect(html).toContain("04.png");
    expect(html).not.toContain("現有");
    expect(html).toContain("32px");
    expect(html).toContain("小紅");
  });

  it("staging 目錄名對齊 gitignore 契約", () => {
    expect(LOGO_STAGING_DIR).toBe("public/.logo-staging");
    expect(logoPathsFor("/repo").stagingRoot).toBe(
      "/repo/public/.logo-staging",
    );
    const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");
    expect(gitignore).toContain("/public/.logo-staging/");
    expect(LOGO_OUTPUT_PX).toEqual([512, 128, 32]);
    expect(defaultCandidateCount({ kind: "pilot" })).toBe(4);
    expect(remainingTier1Slugs()).toEqual([...PILOT_REMAINING_TIER1]);
    expect(getCharacterLogos()).toHaveLength(35);
  });
});

describe("webp 金字塔", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("從 master 寫出 512／128／32 webp", async () => {
    const { default: sharp } = await import("sharp");
    const dir = mkdtempSync(join(tmpdir(), "logo-public-"));
    const destDir = join(dir, "public/characters/logo");
    mkdirSync(destDir, { recursive: true });
    const master = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 180, g: 80, b: 60 },
      },
    })
      .png()
      .toBuffer();
    const written = await writeApprovedWebpPyramid(
      master,
      destDir,
      "xiao-hong",
    );
    expect(written).toEqual([
      join(destDir, "xiao-hong-512.webp"),
      join(destDir, "xiao-hong-128.webp"),
      join(destDir, "xiao-hong-32.webp"),
    ]);
    for (const file of written) {
      const meta = await sharp(file).metadata();
      const px = Number(file.match(/-(\d+)\.webp$/)?.[1]);
      expect(meta.width).toBe(px);
      expect(meta.height).toBe(px);
      expect(meta.format).toBe("webp");
    }
  });
});

describe("staging round-trip（fake generator，不連網）", () => {
  it("寫入候選＋contact，approve 後產出 webp 並改 status", async () => {
    const { default: sharp } = await import("sharp");
    const repo = mkdtempSync(join(tmpdir(), "logo-repo-"));
    mkdirSync(join(repo, "data"), { recursive: true });
    const paths = logoPathsFor(repo);
    writeFileSync(
      paths.rosterPath,
      `${JSON.stringify(
        [
          {
            slug: "xiao-hong",
            name: "小紅",
            vehicle: "賽車",
            family: "speed",
            feature: "單一尾翼",
            ipColorPrimary: "#FFC9B8",
            ipColorSecondary: "#C5D8F0",
            tier: 1,
            status: "pending",
            notes: "",
          },
        ],
        null,
        2,
      )}\n`,
    );
    const png = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 200, g: 90, b: 70 },
      },
    })
      .png()
      .toBuffer();
    const jobs = [
      {
        slug: "xiao-hong",
        name: "小紅",
        candidates: 2,
        prompt: "Create one highly simplified IP mascot logo\nForbid: clay",
      },
    ];
    const generatePng = vi.fn(async () => png);
    await generateJobsToStaging({
      paths,
      jobs,
      // 假名冊可用 xiao-hong；對比閘門讀現役資料，任務 I 下該 slug 未過，改用仍過的 an-an。
      args: parseLogoCliArgs(["--slug", "an-an", "--candidates", "2"]),
      model: "gpt-image-2",
      generatePng,
    });
    expect(generatePng).toHaveBeenCalledTimes(2);
    expect(existsSync(join(paths.stagingRoot, "xiao-hong/contact.html"))).toBe(
      true,
    );
    const approved = await approveLogoFromStaging({
      paths,
      slug: "xiao-hong",
      pick: 2,
    });
    expect(approved.some((path) => path.endsWith("xiao-hong-32.webp"))).toBe(
      true,
    );
    const roster = JSON.parse(
      readFileSync(join(repo, "data/character-logos.json"), "utf8"),
    ) as Array<{ status: string }>;
    expect(roster[0]?.status).toBe("accepted");
  });

  it("既有 PNG 跳過不呼叫 generator", async () => {
    const { default: sharp } = await import("sharp");
    const repo = mkdtempSync(join(tmpdir(), "logo-skip-"));
    mkdirSync(join(repo, "data"), { recursive: true });
    const paths = logoPathsFor(repo);
    writeFileSync(paths.rosterPath, "[]\n");
    const png = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();
    mkdirSync(join(paths.stagingRoot, "xiao-hong"), { recursive: true });
    writeFileSync(join(paths.stagingRoot, "xiao-hong/01.png"), png);
    const generatePng = vi.fn(async () => png);
    const result = await generateJobsToStaging({
      paths,
      jobs: [
        {
          slug: "xiao-hong",
          name: "小紅",
          candidates: 2,
          prompt: "Create one highly simplified IP mascot logo\nForbid: clay",
        },
      ],
      args: parseLogoCliArgs(["--slug", "an-an", "--candidates", "2"]),
      model: "gpt-image-2",
      generatePng,
      log: () => undefined,
    });
    expect(generatePng).toHaveBeenCalledTimes(1);
    expect(result.skippedExisting).toBe(1);
    expect(result.generated).toBe(1);
    expect(existsSync(join(paths.stagingRoot, "xiao-hong/02.png"))).toBe(true);
  });

  it("審核擋單張留下空號並繼續，不中止整批", async () => {
    const { default: sharp } = await import("sharp");
    const repo = mkdtempSync(join(tmpdir(), "logo-mod-"));
    mkdirSync(join(repo, "data"), { recursive: true });
    const paths = logoPathsFor(repo);
    writeFileSync(paths.rosterPath, "[]\n");
    const png = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 3,
        background: { r: 40, g: 50, b: 60 },
      },
    })
      .png()
      .toBuffer();
    const moderation = {
      status: 400,
      code: "moderation_blocked",
      error: {
        code: "moderation_blocked",
        moderation_details: {
          moderation_stage: "output",
          categories: ["violence"],
        },
      },
    };
    const generatePng = vi
      .fn<() => Promise<Buffer>>()
      .mockRejectedValueOnce(moderation)
      .mockRejectedValueOnce(moderation)
      .mockResolvedValue(png);
    const logs: string[] = [];
    const result = await generateJobsToStaging({
      paths,
      jobs: [
        {
          slug: "xiao-hong",
          name: "小紅",
          candidates: 2,
          prompt: "Create one highly simplified IP mascot logo\nForbid: clay",
        },
      ],
      args: parseLogoCliArgs(["--slug", "an-an", "--candidates", "2"]),
      model: "gpt-image-2",
      generatePng,
      log: (line) => logs.push(line),
    });
    expect(generatePng).toHaveBeenCalledTimes(3);
    expect(result.blocked).toBe(1);
    expect(result.generated).toBe(1);
    expect(existsSync(join(paths.stagingRoot, "xiao-hong/01.png"))).toBe(false);
    expect(existsSync(join(paths.stagingRoot, "xiao-hong/02.png"))).toBe(true);
    expect(logs.some((line) => line.includes("審核跳過 xiao-hong/01.png"))).toBe(
      true,
    );
    expect(logs.some((line) => line.includes('categories=["violence"]'))).toBe(
      true,
    );
    const contact = readFileSync(
      join(paths.stagingRoot, "xiao-hong/contact.html"),
      "utf8",
    );
    expect(contact).toContain("現有 1／計劃 2");
    expect(contact).toContain("02.png");
    expect(contact).not.toContain("01.png");
  });

  it("非審核 4xx 仍中止整批", async () => {
    const repo = mkdtempSync(join(tmpdir(), "logo-400-"));
    mkdirSync(join(repo, "data"), { recursive: true });
    const paths = logoPathsFor(repo);
    writeFileSync(paths.rosterPath, "[]\n");
    await expect(
      generateJobsToStaging({
        paths,
        jobs: [
          {
            slug: "xiao-hong",
            name: "小紅",
            candidates: 2,
            prompt: "Create one highly simplified IP mascot logo\nForbid: clay",
          },
        ],
        args: parseLogoCliArgs(["--slug", "an-an", "--candidates", "2"]),
        model: "gpt-image-2",
        generatePng: async () => {
          throw { status: 400, code: "invalid_prompt", message: "bad" };
        },
        log: () => undefined,
      }),
    ).rejects.toMatchObject({ status: 400, code: "invalid_prompt" });
  });
});

describe("色彩驗證閘門", () => {
  it("目標角色對比未過就中止並列違規", () => {
    expect(() =>
      assertLogoContrastForTargets([
        {
          slug: "fake-low-contrast",
          family: "joy",
          ipColorPrimary: "#352E02",
          ipColorSecondary: "#FFFFFF",
          faceSurface: "primary",
          secondaryTouchesBackground: true,
        },
      ]),
    ).toThrow(/色彩驗證未過，不得生圖：[\s\S]*fake-low-contrast/);
  });

  it("現役通過的角色不擋生圖", () => {
    expect(() =>
      assertGenerationAllowed(parseLogoCliArgs(["--slug", "an-an"])),
    ).not.toThrow();
  });

  it("同色相未過加權門檻的角色擋生圖", () => {
    expect(() =>
      assertLogoContrastForTargets([
        {
          slug: "fake-same-hue",
          family: "speed",
          ipColorPrimary: "#023538",
          ipColorSecondary: "#C5D8F0",
          faceSurface: "secondary",
          secondaryTouchesBackground: false,
        },
      ]),
    ).toThrow(/色彩驗證未過，不得生圖：[\s\S]*fake-same-hue/);
  });
});

describe("CLI 紅線", () => {
  it("CLI 不走定裝黏土生圖函式", () => {
    const source = readFileSync(
      join(process.cwd(), "scripts/generate-character-logos.ts"),
      "utf8",
    );
    expect(source).not.toContain("generateCharacterPortrait");
    expect(source).not.toContain("generateSceneImage");
    expect(source).not.toContain("CLAY_STYLE_PREFIX");
    expect(source).toContain("--dry-run");
  });
});
