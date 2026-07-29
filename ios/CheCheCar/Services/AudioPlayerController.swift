import AVFoundation
import Foundation

/// 串流音檔 + 依 `captionTimes` 推算翻頁（對齊網頁 StoryPlayer 行為的精簡版）。
@MainActor
final class AudioPlayerController: ObservableObject {
    @Published private(set) var isPlaying = false
    @Published private(set) var currentTime: Double = 0
    @Published private(set) var duration: Double = 0
    @Published private(set) var pageIndex: Int = 0
    @Published var errorMessage: String?

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var captionTimes: [Double] = []
    private var pageCount: Int = 1

    func load(audioURL: URL, captionTimes: [Double]?, pageCount: Int) {
        tearDown()
        self.captionTimes = captionTimes ?? []
        self.pageCount = max(1, pageCount)
        self.pageIndex = 0
        self.currentTime = 0
        self.duration = 0
        self.errorMessage = nil

        let item = AVPlayerItem(url: audioURL)
        let player = AVPlayer(playerItem: item)
        self.player = player

        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            Task { @MainActor in
                self?.handleTime(time.seconds)
            }
        }

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isPlaying = false
            }
        }

        Task {
            do {
                let dur = try await item.asset.load(.duration)
                let seconds = dur.seconds
                if seconds.isFinite, seconds > 0 {
                    self.duration = seconds
                }
            } catch {
                self.errorMessage = "無法讀取音檔長度"
            }
        }
    }

    func togglePlay() {
        guard let player else { return }
        if isPlaying {
            player.pause()
            isPlaying = false
        } else {
            player.play()
            isPlaying = true
        }
    }

    func skip(by seconds: Double) {
        guard let player else { return }
        let target = max(0, currentTime + seconds)
        let capped = duration > 0 ? min(target, duration) : target
        player.seek(to: CMTime(seconds: capped, preferredTimescale: 600))
        currentTime = capped
        pageIndex = pageIndex(for: capped)
    }

    func seek(toPage index: Int) {
        guard !captionTimes.isEmpty else {
            pageIndex = min(max(0, index), pageCount - 1)
            return
        }
        let clamped = min(max(0, index), captionTimes.count - 1)
        pageIndex = clamped
        let t = captionTimes[clamped]
        player?.seek(to: CMTime(seconds: t, preferredTimescale: 600))
        currentTime = t
    }

    func tearDown() {
        if let timeObserver, let player {
            player.removeTimeObserver(timeObserver)
        }
        timeObserver = nil
        if let endObserver {
            NotificationCenter.default.removeObserver(endObserver)
        }
        endObserver = nil
        player?.pause()
        player = nil
        isPlaying = false
    }

    private func handleTime(_ seconds: Double) {
        currentTime = seconds
        pageIndex = pageIndex(for: seconds)
        if let item = player?.currentItem {
            let d = item.duration.seconds
            if d.isFinite, d > 0 {
                duration = d
            }
        }
    }

    /// 與網頁類似：找最後一個 `captionTimes[i] <= t` 的頁。
    private func pageIndex(for time: Double) -> Int {
        guard !captionTimes.isEmpty else { return pageIndex }
        var idx = 0
        for (i, cue) in captionTimes.enumerated() {
            if cue <= time {
                idx = i
            } else {
                break
            }
        }
        return min(idx, pageCount - 1)
    }
}
