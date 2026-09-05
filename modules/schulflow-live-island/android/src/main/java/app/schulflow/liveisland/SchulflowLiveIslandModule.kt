package app.schulflow.liveisland

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.app.PendingIntent
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native Android channel for the Live-Info stream.
 *
 * This intentionally uses the platform Notification.Builder instead of a
 * second notification library. It keeps the module small, needs no VIBRATE
 * permission, and lets Android/HyperOS decide whether an ongoing notification
 * becomes a promoted live update or a focus notification.
 */
class SchulflowLiveIslandModule : Module() {
  companion object {
    private const val CHANNEL_ID = "schulflow.live-island"
    private const val NOTIFICATION_ID = 4712
  }

  override fun definition() = ModuleDefinition {
    Name("SchulflowLiveIsland")

    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    }

    AsyncFunction("show") { title: String, body: String, progress: Int, targetAt: Long ->
      showNotification(title, body, progress.coerceIn(0, 100), targetAt)
      true
    }

    AsyncFunction("hide") {
      notificationManager()?.cancel(NOTIFICATION_ID)
    }
  }

  private fun notificationManager(): NotificationManager? =
    appContext.reactContext?.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

  private fun showNotification(title: String, body: String, progress: Int, targetAt: Long) {
    val context = appContext.reactContext ?: return
    val manager = notificationManager() ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Nächste Stunde · Live", NotificationManager.IMPORTANCE_LOW).apply {
          description = "Laufender Countdown zur aktuellen oder nächsten Stunde."
          setShowBadge(false)
        },
      )
    }

    val open = Intent(Intent.ACTION_VIEW, Uri.parse("schulflow://timetable")).setPackage(context.packageName)
    val pending = PendingIntent.getActivity(
      context,
      4713,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }

    builder
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setContentIntent(pending)
      .setStyle(Notification.BigTextStyle().bigText(body))
      .setProgress(100, progress, false)
      .setOngoing(true)
      .setAutoCancel(false)
      .setCategory(Notification.CATEGORY_PROGRESS)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setColor(0xFFFF8C38.toInt())
      .setShowWhen(false)
      .setOnlyAlertOnce(true)

    // Promoted ongoing notifications are optional and API-gated. Reflection
    // keeps the module installable on older compile/runtime combinations.
    if (Build.VERSION.SDK_INT >= 35) {
      runCatching {
        builder.javaClass.getMethod("setRequestPromotedOngoing", Boolean::class.javaPrimitiveType!!).invoke(builder, true)
      }
    }

    // Store the target as the notification timestamp for OEMs that expose it;
    // no ticker is emitted, updates are only sent when the JS signature changes.
    if (targetAt > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      builder.setWhen(targetAt)
    }
    manager.notify(NOTIFICATION_ID, builder.build())
  }
}
