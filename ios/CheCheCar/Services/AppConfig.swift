import Foundation

enum AppConfig {
    /// 正式站 canonical（對齊 `lib/site-url.ts` CANONICAL_SITE_URL）。
    static let productionBaseURL = URL(string: "https://podcast-website-mu.vercel.app")!

    /// 可改為本機 `http://127.0.0.1:3000` 做對照測試（模擬器需允許 ATS 例外，見 Info）。
    static var apiBaseURL: URL {
        if let raw = ProcessInfo.processInfo.environment["CHECHECAR_API_BASE"],
           let url = URL(string: raw),
           !raw.isEmpty {
            return url
        }
        return productionBaseURL
    }
}
