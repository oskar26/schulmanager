import ActivityKit
import ExpoModulesCore

/// ActivityKit is deliberately behind the JS bridge. Expo Go simply has no
/// linked module, while a development/production build can render a genuine
/// Live Activity without an in-app overlay.
public class SchulflowLiveIslandModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SchulflowLiveIsland")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.1, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("show") { (title: String, body: String, progress: Int, targetAt: Int) -> Bool in
      guard #available(iOS 16.1, *) else { return false }
      return await Self.upsert(title: title, body: body, progress: progress, targetAtMs: targetAt)
    }

    AsyncFunction("hide") { () -> Void in
      guard #available(iOS 16.1, *) else { return }
      await Self.endAll()
    }
  }

  @available(iOS 16.1, *)
  private static func upsert(title: String, body: String, progress: Int, targetAtMs: Int) async -> Bool {
    let state = LiveIslandAttributes.ContentState(
      title: title,
      body: body,
      progress: min(max(Double(progress) / 100.0, 0), 1),
      targetAtMs: targetAtMs
    )
    let content = ActivityContent(state: state, staleDate: nil)

    if let running = Activity<LiveIslandAttributes>.activities.first(where: {
      abs($0.content.state.targetAtMs - targetAtMs) < 60_000
    }) {
      await running.update(content)
      return true
    }

    do {
      _ = try Activity.request(attributes: LiveIslandAttributes(), content: content)
      return true
    } catch {
      return false
    }
  }

  @available(iOS 16.1, *)
  private static func endAll() async {
    let finalState = LiveIslandAttributes.ContentState(title: "", body: "", progress: 0, targetAtMs: 0)
    let content = ActivityContent(state: finalState, staleDate: nil)
    for activity in Activity<LiveIslandAttributes>.activities {
      await activity.end(content, dismissalPolicy: .immediate)
    }
  }
}
