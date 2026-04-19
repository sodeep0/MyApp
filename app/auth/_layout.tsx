// app/auth/_layout.tsx
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

console.log("5️⃣ Root layout loaded");
WebBrowser.maybeCompleteAuthSession();
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
