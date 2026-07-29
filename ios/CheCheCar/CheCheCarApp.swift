import SwiftUI

@main
struct CheCheCarApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                StoryListView()
            }
            .tint(AppTheme.accentPink)
        }
    }
}
