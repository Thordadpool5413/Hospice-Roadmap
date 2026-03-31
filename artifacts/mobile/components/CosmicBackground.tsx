import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface StarDot { top: string; left: string; size: number; opacity: number }

const N_STARS = 24;

function buildStars(seed: number): StarDot[] {
  let r = seed >>> 0;
  const rand = () => {
    r = Math.imul(r ^ (r >>> 13), 0x456789ab) >>> 0;
    r = Math.imul(r ^ (r >>> 17), 0x89abcdef) >>> 0;
    return (r >>> 0) / 0xffffffff;
  };
  return Array.from({ length: N_STARS }, () => ({
    top:  `${(rand() * 88).toFixed(1)}%`,
    left: `${(rand() * 94).toFixed(1)}%`,
    size:    rand() > 0.82 ? 2.2 : rand() > 0.60 ? 1.6 : 1.1,
    opacity: 0.20 + rand() * 0.50,
  }));
}

const STARS = buildStars(0xc0ffee);

export function CosmicBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base gradient — deep navy */}
      <LinearGradient
        colors={["#030B1C", "#091734", "#0C1E44"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Blue nebula — upper left */}
      <View style={s.nebulaLeft} />

      {/* Purple-blue nebula — upper right */}
      <View style={s.nebulaRight} />

      {/* Stars */}
      {STARS.map((st, i) => (
        <View
          key={i}
          style={[
            s.star,
            {
              top:          st.top as any,
              left:         st.left as any,
              width:        st.size,
              height:       st.size,
              borderRadius: st.size / 2,
              opacity:      st.opacity,
            },
          ]}
        />
      ))}

      {/* Bottom fade */}
      <LinearGradient
        colors={["transparent", "rgba(3,11,28,0.60)"]}
        style={s.bottomFade}
      />
    </View>
  );
}

const s = StyleSheet.create({
  nebulaLeft: {
    position: "absolute",
    top: -90, left: -110,
    width: 340, height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(30, 80, 210, 0.09)",
  },
  nebulaRight: {
    position: "absolute",
    top: -50, right: -70,
    width: 240, height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(70, 40, 180, 0.07)",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 180,
  },
});
