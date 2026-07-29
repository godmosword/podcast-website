import Foundation

/// 與官網 `GET /api/v1/*` JSON 對齊的 Codable 模型（P1 契約）。
/// 欄位命名維持 camelCase，與 [`lib/api-v1.ts`](../../lib/api-v1.ts) 一致。

struct StoryListResponse: Codable, Sendable {
    let stories: [StoryListItem]
}

struct StoryListItem: Codable, Identifiable, Hashable, Sendable {
    var id: String { slug }

    let slug: String
    let ep: Int
    let title: String
    let date: String
    let duration: String?
    let vehicle: String
    let summary: String?
    let tags: [String]?
    let ageRange: String?
    let color: String
    let pageCount: Int
    let coverUrl: URL
    let audioUrl: URL
    let zoneId: String?
    let hasTranscriptVtt: Bool
}

struct StoryDetail: Codable, Identifiable, Hashable, Sendable {
    var id: String { slug }

    let slug: String
    let ep: Int
    let title: String
    let date: String
    let duration: String?
    let vehicle: String
    let summary: String?
    let tags: [String]?
    let ageRange: String?
    let color: String
    let pageCount: Int
    let coverUrl: URL
    let audioUrl: URL
    let zoneId: String?
    let hasTranscriptVtt: Bool
    let captions: [String]?
    let captionTimes: [Double]?
    let pageImageUrls: [URL]
    let transcriptVttUrl: URL?
    let reflectionPrompt: ReflectionPrompt?
    let characterIds: [String]?
}

struct ReflectionPrompt: Codable, Hashable, Sendable {
    let child: String
    let parentFollowUp: String
}

struct ChannelMeta: Codable, Sendable {
    let title: String
    let siteUrl: URL
    let feedUrl: URL
    let artworkUrl: URL
    let platforms: [PlatformLink]
}

struct PlatformLink: Codable, Hashable, Identifiable, Sendable {
    var id: String { label }
    let label: String
    let url: URL
}

enum APIError: Error, LocalizedError {
    case badStatus(Int)
    case decoding(Error)
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .badStatus(let code):
            return "伺服器回應異常（\(code)）"
        case .decoding:
            return "資料格式無法解析"
        case .transport:
            return "網路連線失敗"
        }
    }
}
