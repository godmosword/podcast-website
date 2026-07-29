import SwiftUI

@main
struct CheCheCarApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                StoryListView()
            }
            .environmentObject(ProgressStore.shared)
            .environmentObject(OfflineLibrary.shared)
            .tint(AppTheme.accentPink)
        }
    }
}
