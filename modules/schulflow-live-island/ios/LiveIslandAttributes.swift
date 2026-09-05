import ActivityKit
import SwiftUI
import WidgetKit

/// Shared definition for the app target and the separate LiveIsland WidgetKit
/// target. Copy this file into the extension when `expo-apple-targets` creates
/// the target; the app module only needs the ActivityAttributes part.
public struct LiveIslandAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var title: String
    public var body: String
    /// 0…1 — Fortschritt der laufenden Stunde bzw. Annäherung.
    public var progress: Double
    /// Unix-ms des relevanten Zeitpunkts (Ende/Start).
    public var targetAtMs: Int

    public init(title: String, body: String, progress: Double, targetAtMs: Int) {
      self.title = title
      self.body = body
      self.progress = progress
      self.targetAtMs = targetAtMs
    }
  }

  public init() {}
}

// MARK: - Extension-Teil (Target „LiveIsland")

@available(iOS 16.1, *)
public struct LiveIslandWidget: Widget {
  public init() {}

  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveIslandAttributes.self) { context in
      LiveActivityContent(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 6) {
            Image(systemName: "book")
              .font(.system(size: 12, weight: .bold))
            Text(context.state.title)
              .font(.footnote.weight(.heavy))
              .lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.state.body)
            .font(.footnote.weight(.semibold))
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.center) {
          ProgressView(value: context.state.progress)
            .tint(.white)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 4) {
            Text(context.state.title).font(.headline)
            Text(context.state.body).font(.caption).foregroundStyle(.secondary)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      } compactLeading: {
        Image(systemName: "book")
      } compactTrailing: {
        Text(context.state.body).lineLimit(1)
      } minimal: {
        Image(systemName: "book")
      }
    }
  }
}

@available(iOS 16.1, *)
private struct LiveActivityContent: View {
  let context: ActivityViewContext<LiveIslandAttributes>

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(context.state.title).font(.headline)
      Text(context.state.body).font(.caption).foregroundStyle(.secondary)
    }
    .activityBackgroundTint(.accentColor)
    .activitySystemActionForegroundColor(.white)
  }
}
