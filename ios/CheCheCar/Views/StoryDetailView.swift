import SwiftUI

@MainActor
final class StoryDetailViewModel: ObservableObject {
    @Published private(set) var detail: StoryDetail?
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let client: APIClient
    private let slug: String

    init(slug: String, client: APIClient = .shared) {
        self.slug = slug
        self.client = client
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            detail = try await client.fetchStory(slug: slug)
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

struct StoryDetailView: View {
    let slug: String
    let preview: StoryListItem?

    @StateObject private var model: StoryDetailViewModel

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
                NavigationLink {
                    if let detail = model.detail {
                        StoryPlayerView(detail: detail)
                    } else {
                        ProgressView()
                    }
                } label: {
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
}
