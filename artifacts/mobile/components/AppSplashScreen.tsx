import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@clerk/expo";
import React, { useEffect, useRef } from "react";

type AppSplashScreenProps = {
  fontsReady: boolean;
};

/** Hides the native splash once fonts and Clerk are ready; video intros run on index. */
export function AppSplashScreen({ fontsReady }: AppSplashScreenProps) {
  const { isLoaded } = useAuth();
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!fontsReady || !isLoaded || hiddenRef.current) return;
    hiddenRef.current = true;
    void SplashScreen.hideAsync();
  }, [fontsReady, isLoaded]);

  return null;
}