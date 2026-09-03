package app.schulflow.liveisland

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Die native Seite der Schulflow-Live-Island (Android).
 *
 * Postet eine *dauerhafte* Fortschritts-Notification mit derselben ID im
 * Insel-Takt (Updates via `show`):
 *
 * · `setOngoing(true)` + `FLAG_ONGOING_EVENT` + `CATEGORY_PROGRESS`
 *   → wird auf Android 15/16 als **Live-Update** behandelt (Statusbar-Chip,
 *   prominent im Shade, Fortschritt sichtbar).
 * · Auf Xiaomi HyperOS stuft das System genau diese Notification-Klasse
 *   automatisch zur **Fokus-Notification** hoch („HyperIsland" um die
 *   Punch-Hole-Kamera) — ohne Xiaomi-interne SDKs.
 * · Ab API 35 (Android 15) wird per Reflexion `setPromotedOngoing(true)`
 *   gesetzt, wo verfügbar — sicher in try/catch, da Version-gebunden.
 *
 * Läuft nur in einem Dev-Build (`npx expo prebuild && npx expo run:android`).
 * In Expo Go ist das Modul nicht verlinkt — die JS-Seite (`bridge.native.ts`)
 * erkennt das und fällt auf eine stille `expo-notifications`-Notification zurück.
 */
class SchulflowLiveIslandModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("SchulflowLiveIsland")

        Function("isSupported") { true }

        AsyncFunction("show") { title: String, body: String, progress: Int, targetAt: Long ->
            showIsland(reactContext, title, body, progress.coerceIn(0, 100))
            true
        }

        AsyncFunction("hide") {
            val manager = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(NOTIFICATION_ID)
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Nächste Stunde · Live",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Dauerhafte Fortschritts-Notification der Live-Island"
                setShowBadge(false)
                setLightColor(0xFF6C5CE7.toInt(), true)
            }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun showIsland(context: Context, title: String, body: String, progress: Int) {
        ensureChannel(context)

        // Tap auf die Insel öffnet den Stundenplan (Deep Link aus app.json: scheme `schulflow`)
        val open = Intent(Intent.ACTION_VIEW, Uri.parse("schulflow://timetable")).setPackage(context.packageName)
        val pending = PendingIntent.getActivity(
            context,
            REQUEST_CODE,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = Notification.Builder(context, CHANNEL_ID)
            // Launcher-Icon der App als Small-Icon — kein eigener Asset-Abhängigkeit
            .setSmallIcon(context.applicationContext.applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pending)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setProgress(100, progress, false)
            .setContentIntent(pending)

        builder.flags = builder.flags or Notification.FLAG_ONGOING_EVENT

        // Android 15+: Live-Update-Promotion, wo das System sie bietet.
        try {
            val method = Notification.Builder::class.java.getMethod("setPromotedOngoing", Boolean::class.javaPrimitiveType)
            method.invoke(builder, true)
        } catch (_: Throwable) {
            // Version ohne API — die Standard-Live-Update-Heuristik greift trotzdem.
        }

        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(NOTIFICATION_ID, builder.build())
    }

    companion object {
        const val CHANNEL_ID = "schulflow-live-island"
        const val NOTIFICATION_ID = 4210
        const val REQUEST_CODE = 4211
    }
}
