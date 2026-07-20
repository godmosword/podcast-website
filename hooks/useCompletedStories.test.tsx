// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  DEFAULT_PROGRESS,
  getProgressSync,
  subscribeProgress,
} from "@/lib/progress-store";

vi.mock("@/lib/progress-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress-store")>();
  return {
    ...actual,
    getProgressSync: vi.fn(),
    subscribeProgress: vi.fn(),
  };
});

// RTL 的 act() 需要此旗標，否則 React 會警告測試環境未設定
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const listeners = new Set<() => void>();

/** 以真實 DEFAULT_PROGRESS 為基底，確保型別完整且貼近實際 store 形狀。 */
function progressWith(storiesCompleted: string[]) {
  return {
    ...DEFAULT_PROGRESS,
    engagement: { ...DEFAULT_PROGRESS.engagement, storiesCompleted },
  };
}

/** 模組級快取跨測試會殘留，每則測試重新載入以求隔離。 */
async function loadHook() {
  vi.resetModules();
  return (await import("./useCompletedStories")).useCompletedStories;
}

function makeProbe(useCompletedStories: () => ReadonlySet<string>) {
  return function Probe({ slug }: { slug: string }) {
    const completed = useCompletedStories();
    return <span>{completed.has(slug) ? "yes" : "no"}</span>;
  };
}

describe("useCompletedStories", () => {
  beforeEach(() => {
    listeners.clear();
    vi.mocked(subscribeProgress).mockImplementation((cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    });
    vi.mocked(getProgressSync).mockReset();
  });

  it("回傳已聽完 slug 集合", async () => {
    vi.mocked(getProgressSync).mockReturnValue(progressWith(["ep-1"]));
    const Probe = makeProbe(await loadHook());
    const { container } = render(<Probe slug="ep-1" />);
    expect(container.textContent).toBe("yes");
  });

  it("多個 consumer 共用一次 parse（集中訂閱，非每卡一次）", async () => {
    vi.mocked(getProgressSync).mockReturnValue(progressWith(["ep-1"]));
    const Probe = makeProbe(await loadHook());
    render(
      <>
        <Probe slug="ep-1" />
        <Probe slug="ep-2" />
        <Probe slug="ep-3" />
      </>,
    );
    expect(vi.mocked(getProgressSync)).toHaveBeenCalledTimes(1);
  });

  it("進度變更後快照失效並更新", async () => {
    vi.mocked(getProgressSync).mockReturnValue(progressWith([]));
    const Probe = makeProbe(await loadHook());
    const { container } = render(<Probe slug="ep-1" />);
    expect(container.textContent).toBe("no");

    vi.mocked(getProgressSync).mockReturnValue(progressWith(["ep-1"]));
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(container.textContent).toBe("yes");
  });

  it("全部 consumer unmount 期間的變更仍會使快取失效", async () => {
    vi.mocked(getProgressSync).mockReturnValue(progressWith([]));
    const Probe = makeProbe(await loadHook());
    const first = render(<Probe slug="ep-1" />);
    expect(first.container.textContent).toBe("no");

    // 模擬離開 /stories：consumer 退訂，但模組級 listener 仍在
    first.unmount();
    vi.mocked(getProgressSync).mockReturnValue(progressWith(["ep-1"]));
    listeners.forEach((cb) => cb());

    // 返回列表：不得讀到過期快取
    const second = render(<Probe slug="ep-1" />);
    expect(second.container.textContent).toBe("yes");
  });
});
