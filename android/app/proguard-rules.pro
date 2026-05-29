# CCWEB Android ProGuard / R8 rules
# minifyEnabled is false for release until WebView asset mapping is validated.
# When enabling R8, keep Capacitor bridge + plugin classes:

-keep class com.getcapacitor.** { *; }
-keep class io.chrisccweb.app.** { *; }
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Firebase / FCM (when google-services.json present)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# AndroidX
-keep class androidx.core.** { *; }
-dontwarn androidx.**

# Preserve WebView JavaScript bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Crash stack traces in release builds
-renamesourcefileattribute SourceFile
