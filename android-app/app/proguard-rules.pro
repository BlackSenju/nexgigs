# NexGigs TWA — ProGuard / R8 rules
#
# These classes are referenced from AndroidManifest.xml (not from code),
# so R8 cannot see the references and strips them by default.
# That caused "this app has a bug" crashes on startup.

# Keep all Android Browser Helper classes (the TWA runtime)
-keep class com.google.androidbrowserhelper.** { *; }
-keepclassmembers class com.google.androidbrowserhelper.** { *; }

# Keep Chrome Custom Tabs support
-keep class androidx.browser.customtabs.** { *; }
-keepclassmembers class androidx.browser.customtabs.** { *; }

# Keep any activity/service/receiver referenced from the manifest
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver

# Keep the app's own namespace
-keep class com.nexgigs.app.** { *; }
