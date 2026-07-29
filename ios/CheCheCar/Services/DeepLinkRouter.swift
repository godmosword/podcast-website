import Foundation
import SwiftUI

/// 與官網 Universal Links 路徑對照（docs/IOS-APP-ARCHITECTURE.md §8）。
enum DeepLink: Equatable, Sendable {
    case stories
    case story(slug: String)
    case play(slug: String)
}

enum AppRoute: Hashable {
    case detail(slug: String)
    case play(slug: String)
}

enum DeepLinkParser {
    static func parse(_ url: URL) -> DeepLink? {
        let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let parts = path.split(separator: "/").map(String.init)

        if parts.isEmpty {
            return .stories
        }
        if parts.count == 1, parts[0] == "stories" {
            return .stories
        }
        if parts.count >= 2, parts[0] == "story" {
            let slug = parts[1]
            guard !slug.isEmpty else { return nil }
            if parts.count >= 3, parts[2] == "play" {
                return .play(slug: slug)
            }
            return .story(slug: slug)
        }
        return nil
    }
}

@MainActor
final class AppRouter: ObservableObject {
    static let shared = AppRouter()

    @Published var path = NavigationPath()

    func open(_ link: DeepLink) {
        path = NavigationPath()
        switch link {
        case .stories:
            break
        case .story(let slug):
            path.append(AppRoute.detail(slug: slug))
        case .play(let slug):
            path.append(AppRoute.detail(slug: slug))
            path.append(AppRoute.play(slug: slug))
        }
    }

    func handle(url: URL) {
        if let link = DeepLinkParser.parse(url) {
            open(link)
        }
    }

    func handle(userActivity: NSUserActivity) {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else { return }
        handle(url: url)
    }
}
