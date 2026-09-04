package app.schulflow.liveisland

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native Android side of Schulflow's live lesson notification.
 *
 * Calls to `show` update one ongoing progress notification. Android 15/16 can
 * promote eligible ongoing notifications to a status-bar live update; HyperOS
 * may present the same notification as a focus notification.
 */
class SchulflowLiveIslandModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    override fun definition() = ModuleDefinition {
        Name("SchulflowLiveIsland")

        Function("isSupported") { true }

        AsyncFunction("show") { title: String, body: String, progress: Int, targetAt: Long ->
            showIsland(context, title, body, progress.coerceIn(0, 100), targetAt)
            true
        }

        AsyncFunction("hide") {
            notificationManager(context).cancel(NOTIFICATION_ID)
        }
    }

    private fun notificationManager(context: Context): NotificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Nächste Stunde · Live",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Dauerhafte Fortschritts-Notification der Live-Island"
            setShowBadge(false)
            lightColor = BRAND_AMBER
            enableLights(true)
        }
        notificationManager(context).createNotificationChannel(channel)
    }

    @Suppress("DEPRECATION")
    private fun notificationBuilder(context: Context): Notification.Builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            Notification.Builder(context)
        }

    private fun showIsland(
        context: Context,
        title: String,
        body: String,
        progress: Int,
        targetAt: Long
    ) {
        ensureChannel(context)

        // Tapping the notification opens the timetable via the app's URL scheme.
        val open = Intent(Intent.ACTION_VIEW, Uri.parse("schulflow://timetable"))
            .setPackage(context.packageName)
        val pending = PendingIntent.getActivity(
            context,
            REQUEST_CODE,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = notificationBuilder(context)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(pending)
            .setAutoCancel(false)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setProgress(100, progress, false)
            .setColor(BRAND_AMBER)
            .setWhen(targetAt)
            .setOnlyAlertOnce(true)

        requestLiveUpdatePromotion(builder)
        notificationManager(context).notify(NOTIFICATION_ID, builder.build())
    }

    /**
     * Android 16 exposes `setRequestPromotedOngoing`; the fallback name keeps
     * compatibility with earlier previews and OEM implementations. Reflection
     * lets the module still compile against older Android SDKs.
     */
    private fun requestLiveUpdatePromotion(builder: Notification.Builder) {
        for (methodName in listOf("setRequestPromotedOngoing", "setPromotedOngoing")) {
            try {
                Notification.Builder::class.java
                    .getMethod(methodName, java.lang.Boolean.TYPE)
                    .invoke(builder, true)
                return
            } catch (_: ReflectiveOperationException) {
                // Try the next known API name, then rely on Android's heuristic.
            }
        }
    }

    companion object {
        private const val CHANNEL_ID = "schulflow-live-island"
        private const val NOTIFICATION_ID = 4210
        private const val REQUEST_CODE = 4211
        private val BRAND_AMBER = 0xFFFF8C38.toInt()
    }
}
