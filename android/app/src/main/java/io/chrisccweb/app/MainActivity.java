package io.chrisccweb.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    SplashScreen.installSplashScreen(this);
    super.onCreate(savedInstanceState);
    createNotificationChannels();
  }

  private void createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager == null) return;

    NotificationChannel messages = new NotificationChannel(
      "ccweb_messages",
      "Messages",
      NotificationManager.IMPORTANCE_HIGH
    );
    messages.setDescription("Direct messages and chat");
    messages.enableVibration(true);

    NotificationChannel social = new NotificationChannel(
      "ccweb_social",
      "Social",
      NotificationManager.IMPORTANCE_DEFAULT
    );
    social.setDescription("Mentions, follows, reactions, and comments");

    NotificationChannel ai = new NotificationChannel(
      "ccweb_ai",
      "AI & Learning",
      NotificationManager.IMPORTANCE_DEFAULT
    );
    ai.setDescription("AI tutor alerts and learning milestones");

    NotificationChannel general = new NotificationChannel(
      "ccweb_alerts",
      "CCWEB Alerts",
      NotificationManager.IMPORTANCE_HIGH
    );
    general.setDescription("General CCWEB notifications");
    general.enableVibration(true);

    manager.createNotificationChannel(messages);
    manager.createNotificationChannel(social);
    manager.createNotificationChannel(ai);
    manager.createNotificationChannel(general);
  }
}
