import SwiftUI

enum AppTheme {
    static let ink = Color(red: 0.204, green: 0.188, blue: 0.169) // #34302b
    static let inkSoft = Color(red: 0.478, green: 0.447, blue: 0.408) // #7a7268
    static let bg = Color.white
    static let bg2 = Color(red: 0.984, green: 0.984, blue: 0.992) // #fbfbfd
    static let accentPink = Color(red: 0.969, green: 0.659, blue: 0.769) // #f7a8c4
    static let sky = Color(red: 0.561, green: 0.804, blue: 0.910) // #8fcde8

    static func episodeColor(_ hex: String) -> Color {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&int)
        let r, g, b: Double
        switch cleaned.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8) & 0xFF) / 255
            b = Double(int & 0xFF) / 255
        default:
            return accentPink
        }
        return Color(red: r, green: g, blue: b)
    }
}
