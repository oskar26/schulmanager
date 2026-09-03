package app.schulflow.widgets

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Gemeinsamer Datenspeicher für die Home-Screen-Widgets (Android).
 *
 * Die App schreibt das Widget-JSON (Schema: `widgets/spec.md`,
 * `src/features/widgets/snapshot.ts`) nach jedem Sync hier ab; das
 * Glance-Widget (siehe Referenz-Implementierung in `widgets/spec.md`)
 * liest es und aktualisiert sich über den REFRESH-Broadcast.
 */
class SchulflowWidgetsModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("SchulflowWidgets")

        Function("isSupported") { true }

        AsyncFunction("writeSharedData") { json: String ->
            val context = reactContext
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_SNAPSHOT, json).apply()

            // Widget sofort wecken, statt auf den nächsten Auto-Update-Takt zu warten.
            val refresh = Intent(ACTION_WIDGET_REFRESH).setPackage(context.packageName)
            context.sendBroadcast(refresh)
            true
        }
    }

    companion object {
        const val PREFS_NAME = "schulflow_widget_data"
        const val KEY_SNAPSHOT = "snapshot"
        const val ACTION_WIDGET_REFRESH = "app.schulflow.client.widget.REFRESH"
    }
}
