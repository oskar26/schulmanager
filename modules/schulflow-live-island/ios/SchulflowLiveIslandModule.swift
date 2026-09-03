import ActivityKit
import ExpoModulesCore

/// Die JSI-Seite der Live-Island (iOS).
///
/// Kapselt ActivityKit hinter der vorhandenen JS-API (`show`/`hide` in
/// `src/features/island/bridge.ts`), damit die JS-Seite keine
/// Plattform-Kenntnisse braucht. Läuft nur in einem Dev-Build, in dem
/// zusätzlich die WidgetKit-Extension „LiveIsland" gebaut wurde
/// (`expo-apple-targets`, siehe `widgets/spec.md`) — sonst bricht
/// `Activity.request` und wird hier geschluckt.
public class SchulflowLiveIslandModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SchulflowLiveIsland")

    Function("isSupported") { () -> Bool in
      Self.isActivityKitReady
    }

    AsyncFunction("show") { (title: String, body: String, progress: Int, targetAt: Int) -> Bool in
      guard Self.isActivityKitReady else { return false }
      return await Self.upsert(title: title, body: body, progress: Double(progress) / 100.0, targetAtMs: targetAt)
    }

    AsyncFunction("hide") { () -> Void in
      guard Self.isActivityKitReady else { return }
      for activity in Activity<LiveIslandAttributes>.activities {
        try? activity.end(
          at: Date(),
          transition: .dismiss(LiveIslandAttributes.ContentState(title: "", body: "", progress: 0, targetAtMs: 0))
        )
      }
    }
  }

  @available(iOS 16.1, *)
  private static var isActivityKitReady: Bool {
    ActivityAuthorizationInfo().areActivitiesEnabled
  }

  @available(iOS 16.1, *)
  private static func upsert(title: String, body: String, progress: Double, targetAtMs: Int) async -> Bool {
    let state = LiveIslandAttributes.ContentState(
      title: title, body: body, progress: progress, targetAtMs: targetAtMs
    )

    // Bestehende Aktivität aktualisieren (gleiche Stunde = gleiche Zielzeit).
    if let running = Activity<LiveIslandAttributes>.activities.first(where: {
      abs($0.contentState.targetAtMs - targetAtMs) < 60_000
    }) {
      await running.update(ActivityContentState.transition(.content, state))
      return true
    }

    let activity = try? await Activity.request(
      attributes: LiveIslandAttributes(),
      content: .init(state: state, staleDate: nil)
    )
    return activity != nil
  }
}
