import ActivityKit
import SwiftUI
import WidgetKit

/// Referenz-Definition der Live-Activity (iOS 16.1+).
///
/// WICHTIG: Diese Datei muss in die WidgetKit-Extension „LiveIsland"
/// (eigenes Target via `expo-apple-targets`, siehe `widgets/spec.md`)
/// übernommen werden — die View und der Timeline-Provider gehören
/// zwingend in die Extension, das Attribut in beide Targets (App +
/// Extension). Im App-Target reicht die `LiveIslandAttributes`-Struktur.
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
}

// MARK: - Extension-Teil (Target „LiveIsland")

@available(iOS 16.1, *)
public struct LiveIslandProvider: TimelineProvider {
  public func placeholder(in context: Context) -> LiveIslandAttributes.ContentState {
    LiveIslandAttributes.ContentState(title: "Mathematik", body: "noch 23 min · R. 208", progress: 0.4, targetAtMs: 0)
  }

  public func snapshot(for configuration: ActivityConfiguration, in context: Context) -> LiveIslandAttributes.ContentState {
    configuration.contentState
  }

  public func timeline(for configuration: ActivityConfiguration, in context: Context) -> Timeline<LiveIslandAttributes.ContentState> {
    // Das App-Update-Intervall übernimmt die App selbst; der Timeline-Eintrag
    // reicht für die Darstellung bis zum nächsten `Activity.update`.
    Timeline(entries: [configuration.contentState], policy: .after(Date().addingTimeInterval(30)))
  }
}

@available(iOS 16.1, *)
public struct LiveIslandWidget: Widget {
  public var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveIslandAttributes.self) { context in
      LiveActivityContent(state: context)
    } dynamicIsland: { context in
      DynamicIsland {
        // Leading: Fach-Emoji (aus dem Widget-JSON), Trailing: Restzeit
        DynamicIslandLeadingWidget {
          HStack(spacing: 6) {
            Image(systemName: "book")
              .font(.system(size: 12, weight: .bold))
            Text(context.state.title)
              .font(.footnote.weight(.heavy))
              .lineLimit(1)
          }
        }
        DynamicIslandTrailingWidget {
          Text(context.state.body)
            .font(.footnote.weight(.semibold))
            .lineLimit(1)
        }
        // Mitte: Fortschritt
        DynamicIslandMiddleContent {
          ProgressView(value: context.state.progress)
            .tint(.white)
        }
        // Aufgeklappt: alles
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 4) {
            Text(context.state.title)
              .font(.headline)
            Text(context.state.body)
              .font(.caption)
              .foregroundStyle(.secondary)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      }
    }
  }
}

@available(iOS 16.1, *)
private struct LiveActivityContent: View {
  let state: LiveIslandAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(state.title)
        .font(.headline)
      Text(state.body)
        .font(.caption)
        .foregroundStyle(.secondary)
    }
    .activityBackground(.filled.accent)
    .activitySystemActionBehavior(.default)
  }
}
