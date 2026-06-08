import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

interface Props {
  onUnlock: () => Promise<boolean>;
}

export function LockScreen({ onUnlock }: Props) {
  const insets   = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [failed,  setFailed]  = useState(false);
  // Prevent double-invocation of the initial auto-prompt.
  const autoPrompted = useRef(false);

  const handleUnlock = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const success = await onUnlock();
      if (!success) {
        setFailed(true);
        setTimeout(() => setFailed(false), 2500);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, onUnlock]);

  // Auto-invoke biometrics when the lock screen mounts (i.e., immediately
  // after timeout is exceeded on resume).  A short delay lets React finish
  // painting the lock screen before the system dialog appears.
  useEffect(() => {
    if (autoPrompted.current) return;
    autoPrompted.current = true;
    const timer = setTimeout(() => {
      handleUnlock();
    }, 350);
    return () => clearTimeout(timer);
    // handleUnlock is stable (useCallback with stable deps); running this
    // effect only on mount is intentional — re-runs would re-prompt on
    // every render, which we do not want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <View style={ls.root}>
        <LinearGradient
          colors={["#0B1730", "#081630", "#091734"]}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            ls.content,
            { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 },
          ]}
        >
          {/* ── Logo ── */}
          <View style={ls.logoSection}>
            <Image
              source={require("@/assets/images/ragna-lockscreen.png")}
              style={ls.logo}
              resizeMode="contain"
            />
            <Text style={ls.appName}>Hospice Roadmap</Text>
            <Text style={ls.tagline}>Your data is protected</Text>
          </View>

          {/* ── Lock icon ── */}
          <View style={ls.lockSection}>
            <View style={ls.lockIconWrap}>
              <Feather name="lock" size={34} color={Colors.primary} />
            </View>
            <Text style={ls.lockedLabel}>App Locked</Text>
            {failed && (
              <Text style={ls.errorText}>Authentication failed — try again</Text>
            )}
          </View>

          {/* ── Unlock button ── */}
          <View style={ls.bottomSection}>
            <Pressable
              onPress={handleUnlock}
              disabled={loading}
              style={({ pressed }) => [
                ls.unlockBtn,
                pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                loading && { opacity: 0.6 },
              ]}
            >
              <LinearGradient
                colors={["rgba(38, 78, 175, 0.92)", "rgba(28, 58, 148, 0.96)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <ActivityIndicator color="#EEF4FF" size="small" />
              ) : (
                <>
                  <Feather name="unlock" size={19} color="#EEF4FF" />
                  <Text style={ls.unlockBtnText}>Unlock</Text>
                </>
              )}
            </Pressable>

            <Text style={ls.hintText}>
              Face ID · Touch ID · Device passcode
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoSection: {
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A5080",
  },

  lockSection: {
    alignItems: "center",
    gap: 14,
  },
  lockIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: Colors.primary + "14",
    borderWidth: 1,
    borderColor: Colors.primary + "28",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedLabel: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#7A92B8",
    letterSpacing: -0.2,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
    textAlign: "center",
  },

  bottomSection: {
    alignSelf: "stretch",
    gap: 14,
    alignItems: "center",
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 18,
    paddingVertical: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(80, 130, 255, 0.32)",
    shadowColor: "#2060C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  unlockBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#EEF4FF",
    letterSpacing: -0.3,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2C3C5A",
    textAlign: "center",
  },
});

