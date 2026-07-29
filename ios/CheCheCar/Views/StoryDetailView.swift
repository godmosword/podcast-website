import SwiftUI

@MainActor
final class StoryDetailViewModel: ObservableObject {
    @Published private(set) var detail: StoryDetail?
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let client: APIClient
    private let offline: OfflineLibrary
    private let slug: String

    init(slug: String, client: APIClient = .shared, offline: OfflineLibrary = .shared) {
        self.slug = slug
        self.client = client
        self.offline = offline
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            detail = try await client.fetchStory(slug: slug)
        } catch {
            if let cached = offline.cachedDetail(slug: slug) {
                detail = cached
            } else {
                errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            }
        }
    }
}

struct StoryDetailView: View {
    let slug: String
    let preview: StoryListItem?

    @StateObject private var model: StoryDetailViewModel
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var offline: OfflineLibrary

    init(slug: String, preview: StoryListItem? = nil) {
        self.slug = slug
        self.preview = preview
        _model = StateObject(wrappedValue: StoryDetailViewModel(slug: slug))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                cover
                titleBlock
                if let summary = model.detail?.summary ?? preview?.summary {
                    Text(summary)
                        .font(.body)
                        .foregroundStyle(AppTheme.ink)
                }
                if let error = model.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
                if let err = offline.lastError {
                    Text(err)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
                actionButtons
                playButton
                Text("進度與收藏僅存於此裝置，不會與網站同步。")
                    .font(.caption2)
                    .foregroundStyle(AppTheme.inkSoft)
            }
            .padding()
        }
        .background(AppTheme.bg)
        .navigationTitle(model.detail?.title ?? preview?.title ?? "故事")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }

    private var cover: some View {
        let url = model.detail?.coverUrl ?? preview?.coverUrl
        return AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .scaledToFit()
            default:
                RoundedRectangle(cornerRadius: 16)
                    .fill(AppTheme.bg2)
                    .aspectRatio(1, contentMode: .fit)
                    .overlay { ProgressView() }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityLabel("故事封面")
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let ep = model.detail?.ep ?? preview?.ep {
                Text("第 \(ep) 集")
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.inkSoft)
            }
            Text(model.detail?.title ?? preview?.title ?? "")
                .font(.title2.bold())
                .foregroundStyle(AppTheme.ink)
            if let vehicle = model.detail?.vehicle ?? preview?.vehicle {
                Text(vehicle)
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.inkSoft)
            }
        }
    }

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button {
                progress.toggleFavorite(slug)
            } label: {
                Label(
                    progress.isFavorite(slug) ? "已收藏" : "收藏",
                    systemImage: progress.isFavorite(slug) ? "heart.fill" : "heart"
                )
                .frame(maxWidth: .infinity)
                .padding()
                .background(AppTheme.bg2)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .accessibilityLabel(progress.isFavorite(slug) ? "取消收藏" : "加入收藏")

            Button {
                Task {
                    if offline.isDownloaded(slug) {
                        offline.remove(slug: slug)
                    } else if let detail = model.detail {
                        await offline.download(detail: detail)
                    }
                }
            } label: {
                Group {
                    if offline.downloadingSlug == slug {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        Label(
                            offline.isDownloaded(slug) ? "移除離線" : "下載離線",
                            systemImage: offline.isDownloaded(slug)
                                ? "arrow.down.circle.fill"
                                : "arrow.down.circle"
                        )
                        .frame(maxWidth: .infinity)
                        .padding()
                    }
                }
                .background(AppTheme.bg2)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .disabled(model.detail == nil && !offline.isDownloaded(slug))
            .accessibilityLabel(offline.isDownloaded(slug) ? "移除離線檔案" : "下載離線檔案")
        }
        .foregroundStyle(AppTheme.ink)
    }

    private var playButton: some View {
        NavigationLink(value: AppRoute.play(slug: slug)) {
            Label("開始看圖聽故事", systemImage: "play.fill")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(AppTheme.accentPink)
                .foregroundStyle(AppTheme.ink)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .disabled(model.detail == nil)
        .accessibilityHint("開啟全螢幕播放器")
    }
}
