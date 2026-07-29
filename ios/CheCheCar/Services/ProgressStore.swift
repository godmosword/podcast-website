import Foundation
import SwiftUI

/// 與官網 `ContinueState` 欄位對齊（本機專用；**不**與 PWA `cheche:progress` 互通）。
struct ContinueListening: Codable, Equatable, Sendable {
    var slug: String
    var page: Int
    var time: Double
    var updatedAt: Double // epoch ms
}

struct AppProgressSnapshot: Codable, Equatable, Sendable {
    var schemaVersion: Int
    var favorites: [String]
    var continueListening: ContinueListening?

    enum CodingKeys: String, CodingKey {
        case schemaVersion
        case favorites
        case continueListening = "continue"
    }

    static let empty = AppProgressSnapshot(
        schemaVersion: 1,
        favorites: [],
        continueListening: nil
    )
}

/// UserDefaults 本機進度：收藏＋繼續聽。
@MainActor
final class ProgressStore: ObservableObject {
    static let shared = ProgressStore()
    static let storageKey = "chechecar.ios.progress"

    @Published private(set) var snapshot: AppProgressSnapshot

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        if let data = defaults.data(forKey: Self.storageKey),
           let decoded = try? JSONDecoder().decode(AppProgressSnapshot.self, from: data) {
            snapshot = decoded
        } else {
            snapshot = .empty
        }
    }

    func isFavorite(_ slug: String) -> Bool {
        snapshot.favorites.contains(slug)
    }

    func toggleFavorite(_ slug: String) {
        var next = snapshot
        if let idx = next.favorites.firstIndex(of: slug) {
            next.favorites.remove(at: idx)
        } else {
            next.favorites.insert(slug, at: 0)
        }
        persist(next)
    }

    func setContinue(slug: String, page: Int, time: Double) {
        var next = snapshot
        next.continueListening = ContinueListening(
            slug: slug,
            page: max(0, page),
            time: max(0, time),
            updatedAt: Date().timeIntervalSince1970 * 1000
        )
        persist(next)
    }

    func clearContinue(ifSlug slug: String? = nil) {
        var next = snapshot
        if let slug {
            if next.continueListening?.slug == slug {
                next.continueListening = nil
            }
        } else {
            next.continueListening = nil
        }
        persist(next)
    }

    private func persist(_ next: AppProgressSnapshot) {
        snapshot = next
        if let data = try? JSONEncoder().encode(next) {
            defaults.set(data, forKey: Self.storageKey)
        }
    }
}
