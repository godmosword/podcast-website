import Foundation

struct OfflineStoryRecord: Codable, Equatable, Sendable {
    var slug: String
    var title: String
    var ep: Int
    var downloadedAt: Double
    var audioFileName: String
    var pageFileNames: [String]
    var detailFileName: String
}

struct OfflineIndex: Codable, Equatable, Sendable {
    var stories: [String: OfflineStoryRecord]

    static let empty = OfflineIndex(stories: [:])
}

enum OfflineError: Error, LocalizedError {
    case notFound
    case downloadFailed(String)
    case encoding

    var errorDescription: String? {
        switch self {
        case .notFound:
            return "尚無離線檔案"
        case .downloadFailed(let message):
            return "下載失敗：\(message)"
        case .encoding:
            return "無法寫入離線資料"
        }
    }
}

/// 基本離線：下載音檔＋翻頁圖＋詳情 JSON 至 Application Support。
@MainActor
final class OfflineLibrary: ObservableObject {
    static let shared = OfflineLibrary()

    @Published private(set) var index: OfflineIndex = .empty
    @Published private(set) var downloadingSlug: String?
    @Published var lastError: String?

    private let fileManager: FileManager
    private let rootURL: URL
    private let indexURL: URL
    private let session: URLSession

    init(
        fileManager: FileManager = .default,
        session: URLSession = .shared
    ) {
        self.fileManager = fileManager
        self.session = session
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fileManager.temporaryDirectory
        rootURL = base.appending(path: "CheCheCarOffline", directoryHint: .isDirectory)
        indexURL = rootURL.appending(path: "index.json")
        try? fileManager.createDirectory(at: rootURL, withIntermediateDirectories: true)
        index = Self.loadIndex(from: indexURL) ?? .empty
    }

    func isDownloaded(_ slug: String) -> Bool {
        index.stories[slug] != nil
    }

    func downloadedSlugs() -> [String] {
        index.stories.values.sorted { $0.downloadedAt > $1.downloadedAt }.map(\.slug)
    }

    func localAudioURL(slug: String) -> URL? {
        guard let record = index.stories[slug] else { return nil }
        let url = storyDir(slug).appending(path: record.audioFileName)
        return fileManager.fileExists(atPath: url.path) ? url : nil
    }

    func localPageURLs(slug: String) -> [URL]? {
        guard let record = index.stories[slug] else { return nil }
        let dir = storyDir(slug)
        let urls = record.pageFileNames.map { dir.appending(path: $0) }
        guard urls.allSatisfy({ fileManager.fileExists(atPath: $0.path) }) else { return nil }
        return urls
    }

    func cachedDetail(slug: String) -> StoryDetail? {
        guard let record = index.stories[slug] else { return nil }
        let url = storyDir(slug).appending(path: record.detailFileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(StoryDetail.self, from: data)
    }

    func download(detail: StoryDetail) async {
        guard downloadingSlug == nil else { return }
        downloadingSlug = detail.slug
        lastError = nil
        defer { downloadingSlug = nil }

        let dir = storyDir(detail.slug)
        do {
            try fileManager.createDirectory(at: dir, withIntermediateDirectories: true)

            let audioName = "audio.mp3"
            let audioURL = dir.appending(path: audioName)
            try await downloadFile(from: detail.audioUrl, to: audioURL)

            var pageNames: [String] = []
            for (i, pageURL) in detail.pageImageUrls.enumerated() {
                let name = String(format: "%02d.jpg", i + 1)
                try await downloadFile(from: pageURL, to: dir.appending(path: name))
                pageNames.append(name)
            }
            if pageNames.isEmpty {
                let name = "01.jpg"
                try await downloadFile(from: detail.coverUrl, to: dir.appending(path: name))
                pageNames = [name]
            }

            let detailName = "detail.json"
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.sortedKeys]
            guard let detailData = try? encoder.encode(detail) else {
                throw OfflineError.encoding
            }
            try detailData.write(to: dir.appending(path: detailName), options: .atomic)

            var next = index
            next.stories[detail.slug] = OfflineStoryRecord(
                slug: detail.slug,
                title: detail.title,
                ep: detail.ep,
                downloadedAt: Date().timeIntervalSince1970 * 1000,
                audioFileName: audioName,
                pageFileNames: pageNames,
                detailFileName: detailName
            )
            try persist(next)
            index = next
        } catch {
            lastError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            try? fileManager.removeItem(at: dir)
        }
    }

    func remove(slug: String) {
        var next = index
        next.stories.removeValue(forKey: slug)
        try? fileManager.removeItem(at: storyDir(slug))
        try? persist(next)
        index = next
    }

    private func storyDir(_ slug: String) -> URL {
        rootURL.appending(path: slug, directoryHint: .isDirectory)
    }

    private func downloadFile(from remote: URL, to local: URL) async throws {
        let (temp, response) = try await session.download(from: remote)
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw OfflineError.downloadFailed("HTTP \(http.statusCode)")
        }
        if fileManager.fileExists(atPath: local.path) {
            try fileManager.removeItem(at: local)
        }
        try fileManager.moveItem(at: temp, to: local)
    }

    private func persist(_ next: OfflineIndex) throws {
        let data = try JSONEncoder().encode(next)
        try data.write(to: indexURL, options: .atomic)
    }

    private static func loadIndex(from url: URL) -> OfflineIndex? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(OfflineIndex.self, from: data)
    }
}
