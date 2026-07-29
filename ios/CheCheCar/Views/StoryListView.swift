import SwiftUI

@MainActor
final class StoryListViewModel: ObservableObject {
    @Published private(set) var stories: [StoryListItem] = []
    @Published private(set) var metaTitle: String = "車車遊樂園"
    @Published private(set) var isLoading = false
    @Published private(set) var usedOfflineFallback = false
    @Published var errorMessage: String?

    private let client: APIClient
    private let offline: OfflineLibrary

    init(client: APIClient = .shared, offline: OfflineLibrary = .shared) {
        self.client = client
        self.offline = offline
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        usedOfflineFallback = false
        defer { isLoading = false }
        do {
            async let list = client.fetchStories()
            async let meta = client.fetchMeta()
            stories = try await list
            metaTitle = try await meta.title
        } catch {
            let offlineStories = offline.downloadedSlugs().compactMap { slug -> StoryListItem? in
                offline.cachedDetail(slug: slug).map(Self.listItem(from:))
            }
            if !offlineStories.isEmpty {
                stories = offlineStories
                usedOfflineFallback = true
                errorMessage = nil
            } else {
                errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            }
        }
    }

    private static func listItem(from detail: StoryDetail) -> StoryListItem {
        StoryListItem(
            slug: detail.slug,
            ep: detail.ep,
            title: detail.title,
            date: detail.date,
            duration: detail.duration,
            vehicle: detail.vehicle,
            summary: detail.summary,
            tags: detail.tags,
            ageRange: detail.ageRange,
            color: detail.color,
            pageCount: detail.pageCount,
            coverUrl: detail.coverUrl,
            audioUrl: detail.audioUrl,
            zoneId: detail.zoneId,
            hasTranscriptVtt: detail.hasTranscriptVtt
        )
    }
}

struct StoryListView: View {
    @StateObject private var model = StoryListViewModel()
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var offline: OfflineLibrary

    var body: some View {
        Group {
            if model.isLoading && model.stories.isEmpty {
                ProgressView("載入故事…")
            } else if let error = model.errorMessage, model.stories.isEmpty {
                ContentUnavailableView {
                    Label("無法載入", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(error)
                } actions: {
                    Button("再試一次") {
                        Task { await model.load() }
                    }
                }
            } else {
                listContent
            }
        }
        .background(AppTheme.bg)
        .navigationTitle(model.metaTitle)
        .task { await model.load() }
        .refreshable { await model.load() }
    }

    private var listContent: some View {
        List {
            if model.usedOfflineFallback {
                Section {
                    Label("目前顯示已下載的離線故事", systemImage: "arrow.down.circle")
                        .font(.footnote)
                        .foregroundStyle(AppTheme.inkSoft)
                }
            }

            if let cont = progress.snapshot.continueListening,
               let story = model.stories.first(where: { $0.slug == cont.slug }) {
                Section("繼續聽") {
                    NavigationLink(value: story) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(story.title)
                                .font(.headline)
                                .foregroundStyle(AppTheme.ink)
                            Text("第 \(cont.page + 1) 頁 · \(formatTime(cont.time))")
                                .font(.caption)
                                .foregroundStyle(AppTheme.inkSoft)
                        }
                    }
                    .accessibilityLabel("繼續聽 \(story.title)")
                }
            }

            let favorites = model.stories.filter { progress.isFavorite($0.slug) }
            if !favorites.isEmpty {
                Section("收藏") {
                    ForEach(favorites) { story in
                        storyLink(story)
                    }
                }
            }

            Section("全部故事") {
                ForEach(model.stories) { story in
                    storyLink(story)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationDestination(for: StoryListItem.self) { story in
            StoryDetailView(slug: story.slug, preview: story)
        }
    }

    private func storyLink(_ story: StoryListItem) -> some View {
        NavigationLink(value: story) {
            StoryRowView(
                story: story,
                isFavorite: progress.isFavorite(story.slug),
                isOffline: offline.isDownloaded(story.slug)
            )
        }
        .listRowBackground(AppTheme.bg2)
    }

    private func formatTime(_ seconds: Double) -> String {
        let s = Int(seconds.rounded())
        return String(format: "%d:%02d", s / 60, s % 60)
    }
}

private struct StoryRowView: View {
    let story: StoryListItem
    var isFavorite: Bool = false
    var isOffline: Bool = false

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: story.coverUrl) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    AppTheme.episodeColor(story.color)
                default:
                    AppTheme.bg2
                }
            }
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text("第 \(story.ep) 集 · \(story.vehicle)")
                    .font(.caption)
                    .foregroundStyle(AppTheme.inkSoft)
                Text(story.title)
                    .font(.headline)
                    .foregroundStyle(AppTheme.ink)
                    .lineLimit(2)
                HStack(spacing: 8) {
                    if let duration = story.duration {
                        Text(duration)
                            .font(.caption2)
                            .foregroundStyle(AppTheme.inkSoft)
                    }
                    if isFavorite {
                        Image(systemName: "heart.fill")
                            .font(.caption2)
                            .foregroundStyle(AppTheme.accentPink)
                            .accessibilityLabel("已收藏")
                    }
                    if isOffline {
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.caption2)
                            .foregroundStyle(AppTheme.sky)
                            .accessibilityLabel("已下載離線")
                    }
                }
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("第 \(story.ep) 集，\(story.title)")
    }
}

#Preview {
    NavigationStack {
        StoryListView()
            .environmentObject(ProgressStore.shared)
            .environmentObject(OfflineLibrary.shared)
    }
}
