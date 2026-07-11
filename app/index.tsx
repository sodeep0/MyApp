import { LoadingState } from "@/components/LoadingState";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { isOnboardingCompleted } from "@/stores/userStore";

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const done = await isOnboardingCompleted();
      setRoute(done ? "(tabs)" : "onboarding");
    };
    init();
  }, []);

  if (!route) {
    return (
      <LoadingState
        fullScreen
        title="Starting Kaarma"
        message="Checking your onboarding status."
      />
    );
  }

  return <Redirect href={route as any} />;
}
