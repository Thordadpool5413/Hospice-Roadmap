import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@clerk/expo";
import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const BRANDED_SPLASH_MS = 1200;

type AppSplashScreenProps = {
  fontsReady: boolean;
};

/**
 * Keeps the native splash visible until fonts and Clerk are ready, then shows
 * the branded artwork briefly so TestFlight users see the new splash screen.
 */
export function AppSplashScreen({ fontsReady }: AppSplashScreenProps) {
  const { isLoaded } = useAuth();
  const startedRef = useRef(false);
  const [showBrandedSplash, setShowBrandedSplash] = useState(false);

  useEffect(() => {
    if (!fontsReady || !isLoaded || startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      await SplashScreen.hideAsync();
      setShowBrandedSplash(true);
      setTimeout(() => setShowBrandedSplash(false), BRANDED_SPLASH_MS);
    })();
  }, [fontsReady, isLoaded]);

  if (!showBrandedSplash) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Image
        source={require("@/assets/images/splash.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "#1A1840",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});