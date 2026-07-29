import SwiftUI

struct StoryPlayerView: View {
    let detail: StoryDetail

    @StateObject private var player = AudioPlayerController()

    var body: some View {
        VStack(spacing: 0) {
            pageStage
            captionBar
            controls
        }
        .background(AppTheme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(detail.title)
                    .font(.headline)
                    .lineLimit(1)
            }
        }
        .onAppear {
            player.load(
                audioURL: detail.audioUrl,
                captionTimes: detail.captionTimes,
                pageCount: detail.pageCount
            )
        }
        .onDisappear {
            player.tearDown()
        }
        .statusBarHidden(true)
    }

    private var pageStage: some View {
        let urls = detail.pageImageUrls
        let index = min(player.pageIndex, max(0, urls.count - 1))
        let url = urls.isEmpty ? detail.coverUrl : urls[index]

        return TabView(selection: Binding(
            get: { player.pageIndex },
            set: { player.seek(toPage: $0) }
        )) {
            ForEach(Array(urls.enumerated()), id: \.offset) { idx, pageURL in
                AsyncImage(url: pageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                    case .failure:
                        AppTheme.episodeColor(detail.color)
                    default:
                        ProgressView()
                    }
                }
                .tag(idx)
                .padding(.horizontal, 8)
                .accessibilityLabel("第 \(idx + 1) 頁，共 \(detail.pageCount) 頁")
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .automatic))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        // 單頁集仍顯示封面
        .overlay {
            if urls.isEmpty {
                AsyncImage(url: url) { phase in
                    if case .success(let image) = phase {
                        image.resizable().scaledToFit()
                    }
                }
            }
        }
    }

    private var captionBar: some View {
        let captions = detail.captions ?? []
        let text: String = {
            guard !captions.isEmpty else { return detail.summary ?? "" }
            let idx = min(player.pageIndex, captions.count - 1)
            return captions[idx]
        }()

        return Text(text)
            .font(.title3)
            .multilineTextAlignment(.center)
            .foregroundStyle(AppTheme.ink)
            .padding()
            .frame(maxWidth: .infinity)
            .background(AppTheme.bg2)
            .accessibilityLabel("場景字幕")
    }

    private var controls: some View {
        VStack(spacing: 12) {
            ProgressView(value: player.duration > 0 ? player.currentTime / player.duration : 0)
                .tint(AppTheme.sky)
                .accessibilityLabel("播放進度")

            HStack(spacing: 28) {
                Button {
                    player.skip(by: -10)
                } label: {
                    Image(systemName: "gobackward.10")
                        .font(.title)
                }
                .accessibilityLabel("倒退十秒")

                Button {
                    player.togglePlay()
                } label: {
                    Image(systemName: player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 56))
                }
                .accessibilityLabel(player.isPlaying ? "暫停" : "播放")

                Button {
                    player.skip(by: 10)
                } label: {
                    Image(systemName: "goforward.10")
                        .font(.title)
                }
                .accessibilityLabel("快進十秒")
            }
            .foregroundStyle(AppTheme.ink)
            .padding(.bottom, 16)

            if let err = player.errorMessage {
                Text(err)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal)
    }
}
