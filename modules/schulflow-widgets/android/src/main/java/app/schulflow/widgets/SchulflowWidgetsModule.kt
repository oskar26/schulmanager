package app.schulflow.widgets

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Stores the latest widget snapshot for future Android widget receivers. */
class SchulflowWidgetsModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    override fun definition() = ModuleDefinition {
        Name("SchulflowWidgets")

        Function("isSupported") { true }

        AsyncFunction("writeSharedData") { json: String ->
            context
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_SNAPSHOT, json)
                .apply()

            // Wake a receiver as soon as a native Glance widget is installed.
            val refresh = Intent(ACTION_WIDGET_REFRESH).setPackage(context.packageName)
            context.sendBroadcast(refresh)
            true
        }
    }

    companion object {
        private const val PREFS_NAME = "schulflow_widget_data"
        private const val KEY_SNAPSHOT = "snapshot"
        private const val ACTION_WIDGET_REFRESH = "app.schulflow.client.widget.REFRESH"
    }
}
