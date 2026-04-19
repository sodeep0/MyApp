// app/oauthredirect.tsx
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// ✅ Must be at module level
WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectScreen() {
  useEffect(() => {
    console.log("🟡 OAuthRedirect screen mounted — session should complete");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
