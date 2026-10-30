# React Native / WebView ProGuard Rules
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor bridge
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep application classes
-keep class com.jdc.sapujagat.patrol.** { *; }

# General Android rules
-dontwarn com.google.**
-dontwarn androidx.**
-keepattributes *Annotation*
-keepattributes JavascriptInterface
