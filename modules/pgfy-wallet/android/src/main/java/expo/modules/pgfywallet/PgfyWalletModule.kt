package expo.modules.pgfywallet

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

private class ImageFileNotFoundException(path: String) :
  CodedException("ERR_IMAGE_NOT_FOUND", "No image file at $path", null)

class PgfyWalletModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PgfyWallet")

    // Hands an image straight to the app that imports pass photos into Google Wallet, skipping
    // the system chooser. The importer is NOT in the Wallet app package
    // (com.google.android.apps.walletnfcrel) — it's a Google Play Services activity
    // (com.google.android.gms .../pay/...). So rather than trusting a hardcoded component, we
    // scope an ACTION_SEND(image) intent to `targetPackage` and let PackageManager tell us which
    // concrete activity handles it, preferring the Pay one over other SEND handlers (e.g. Nearby
    // Share) that also live in GMS. Resolves `false` (not a throw) when nothing matches, so JS
    // can send the tenant to the store instead.
    AsyncFunction("shareImageToPackage") { filePath: String, targetPackage: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

      // `captureRef` hands back either a plain path or a `file://` URI — normalise to a path.
      val normalizedPath =
        if (filePath.startsWith("file://")) Uri.parse(filePath).path ?: filePath else filePath
      val file = File(normalizedPath)
      if (!file.exists()) throw ImageFileNotFoundException(normalizedPath)

      val authority = "${context.packageName}.walletprovider"
      val contentUri = FileProvider.getUriForFile(context, authority, file)

      val intent = Intent(Intent.ACTION_SEND).apply {
        type = "image/*"
        putExtra(Intent.EXTRA_STREAM, contentUri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        setPackage(targetPackage)
      }

      // queryIntentActivities only sees `targetPackage` because it's declared in the app's
      // `<queries>`. Pick the Pay/Wallet activity; fall back to the first SEND handler.
      val matches = context.packageManager.queryIntentActivities(intent, 0)
      val chosen = matches.firstOrNull { it.activityInfo.name.contains(".pay.", ignoreCase = true) }
        ?: matches.firstOrNull { it.activityInfo.name.contains("wallet", ignoreCase = true) }
        ?: matches.firstOrNull()

      if (chosen == null) {
        false
      } else {
        // Pin the exact component so the OS launches Wallet's importer directly (no chooser).
        intent.component = ComponentName(chosen.activityInfo.packageName, chosen.activityInfo.name)
        context.startActivity(intent)
        true
      }
    }
  }
}
