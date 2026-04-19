import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { isOnboardingCompleted } from "../stores/userStore";

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const done = await isOnboardingCompleted();
      setRoute(done ? "(tabs)" : "onboarding");
    };
    init();
  }, []);

  // ✅ Only this screen shows nothing while loading
  // Stack is still mounted above — deep links still work
  if (!route) return <View style={{ flex: 1 }} />;

  return <Redirect href={route as any} />;
}
