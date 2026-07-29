import SwiftUI

/// 深連結 `/story/{slug}/play`：載入詳情後進播放器。
struct StoryPlayDestination: View {
    let slug: String

    @StateObject private var model: StoryDetailViewModel

    init(slug: String) {
        self.slug = slug
        _model = StateObject(wrappedValue: StoryDetailViewModel(slug: slug))
    }

    var body: some View {
        Group {
            if let detail = model.detail {
                StoryPlayerView(detail: detail)
            } else if let error = model.errorMessage {
                ContentUnavailableView("無法播放", systemImage: "wifi.exclamationmark", description: Text(error))
            } else {
                ProgressView("載入播放器…")
            }
        }
        .task { await model.load() }
    }
}
