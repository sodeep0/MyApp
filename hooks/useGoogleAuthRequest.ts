// path = hooks/useGoogleAuthRequest.ts
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useCallback, useEffect, useState } from "react";

export function extractGoogleIdToken(response: any): string | null {
  if (response?.type !== "success") return null;
  return (
    response.params?.id_token ??
    response.authentication?.idToken ??
    response.data?.idToken ??
    null
  );
}

export function useGoogleAuthRequest() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
    if (!webClientId) return;

    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
  }, [webClientId]);

  const promptGoogleAuth = useCallback(async () => {
    if (!webClientId) return;

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      if (__DEV__) {
        console.log("Play services OK");
      }

      const signInResponse = await GoogleSignin.signIn();
      if (__DEV__) {
        console.log("Sign in response type:", signInResponse.type);
      }

      if (signInResponse.type === "success") {
        const idToken = signInResponse.data.idToken;
        if (!idToken) {
          if (__DEV__) {
            console.log("No idToken in sign-in response");
          }
          setResponse({ type: "error", error: new Error("No idToken returned") });
          return;
        }
        setResponse({
          type: "success",
          params: { id_token: idToken },
          authentication: { idToken },
          data: signInResponse.data,
        });
        return;
      }

      setResponse({ type: signInResponse.type });
    } catch (error: any) {
      if (__DEV__) {
        console.log("Google auth error:", error?.code, error?.message);
      }
      setResponse({ type: "error", error });
    }
  }, [webClientId]);

  return {
    response,
    hasGoogleConfig: Boolean(webClientId),
    promptGoogleAuth,
  };
}
