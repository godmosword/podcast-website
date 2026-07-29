import SwiftUI

@MainActor
final class StoryListViewModel: ObservableObject {
    @Published private(set) var stories: [StoryListItem] = []
    @Published private(set) var metaTitle: String = "車車遊樂園"
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let list = client.fetchStories()
            async let meta = client.fetchMeta()
            stories = try await list
            metaTitle = try await meta.title
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

struct StoryListView: View {
    @StateObject private var model = StoryListViewModel()

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
                List(model.stories) { story in
                    NavigationLink(value: story) {
                        StoryRowView(story: story)
                    }
                    .listRowBackground(AppTheme.bg2)
                }
                .listStyle(.plain)
                .navigationDestination(for: StoryListItem.self) { story in
                    StoryDetailView(slug: story.slug, preview: story)
                }
            }
        }
        .background(AppTheme.bg)
        .navigationTitle(model.metaTitle)
        .task { await model.load() }
        .refreshable { await model.load() }
    }
}

private struct StoryRowView: View {
    let story: StoryListItem

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
                if let duration = story.duration {
                    Text(duration)
                        .font(.caption2)
                        .foregroundStyle(AppTheme.inkSoft)
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
    }
}
