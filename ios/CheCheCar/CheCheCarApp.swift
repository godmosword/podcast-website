import SwiftUI

@main
struct CheCheCarApp: App {
    @StateObject private var router = AppRouter.shared

    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $router.path) {
                StoryListView()
                    .navigationDestination(for: AppRoute.self) { route in
                        switch route {
                        case .detail(let slug):
                            StoryDetailView(slug: slug)
                        case .play(let slug):
                            StoryPlayDestination(slug: slug)
                        }
                    }
            }
            .environmentObject(ProgressStore.shared)
            .environmentObject(OfflineLibrary.shared)
            .environmentObject(router)
            .tint(AppTheme.accentPink)
            .onOpenURL { router.handle(url: $0) }
            .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                router.handle(userActivity: activity)
            }
        }
    }
}
