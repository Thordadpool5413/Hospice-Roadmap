import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StarDot { top: string; left: string; size: number; opacity: number }

function buildStars(seed: number, n: number): StarDot[] {
  let r = seed >>> 0;
  const rand = () => {
    r = Math.imul(r ^ (r >>> 13), 0x456789ab) >>> 0;
    r = Math.imul(r ^ (r >>> 17), 0x89abcdef) >>> 0;
    return (r >>> 0) / 0xffffffff;
  };
  return Array.from({ length: n }, () => ({
    top:  `${(rand() * 90).toFixed(1)}%`,
    left: `${(rand() * 96).toFixed(1)}%`,
    size:    rand() > 0.88 ? 2.8 : rand() > 0.70 ? 1.8 : 1.1,
    opacity: 0.15 + rand() * 0.55,
  }));
}

const STARS = buildStars(0xc0ffee, 20);

export function CosmicBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── 1. Deep void base gradient ── */}
      <LinearGradient
        colors={["#07111E", "#0C1A35", "#12264F", "#091625"]}
        locations={[0, 0.28, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── 2. Large blue-indigo nebula — upper left ── */}
      <View style={s.nebulaLeft} />

      {/* ── 3. Purple-blue nebula — upper right ── */}
      <View style={s.nebulaRight} />

      {/* ── 4. Subtle warm glow — center ── */}
      <View style={s.warmCenter} />

      {/* ── 5. Soft teal accent — lower left ── */}
      <View style={s.tealLow} />

      {/* ── 6. Star field ── */}
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

      {/* ── 7. Bottom fade for legibility ── */}
      <LinearGradient
        colors={["transparent", "rgba(7,17,30,0.70)"]}
        style={s.bottomFade}
      />

      {/* ── 8. Top vignette ── */}
      <LinearGradient
        colors={["rgba(7,17,30,0.24)", "transparent"]}
        style={s.topVignette}
      />
    </View>
  );
}

const s = StyleSheet.create({
  nebulaLeft: {
    position: "absolute",
    top: -110, left: -130,
    width: 360, height: 360,
    borderRadius: 200,
    backgroundColor: "rgba(42, 86, 236, 0.08)",
  },
  nebulaRight: {
    position: "absolute",
    top: -60, right: -90,
    width: 280, height: 280,
    borderRadius: 150,
    backgroundColor: "rgba(92, 56, 214, 0.06)",
  },
  warmCenter: {
    position: "absolute",
    top: "30%", left: "20%",
    width: 240, height: 180,
    borderRadius: 130,
    backgroundColor: "rgba(100, 118, 255, 0.04)",
  },
  tealLow: {
    position: "absolute",
    bottom: 80, left: -60,
    width: 200, height: 200,
    borderRadius: 110,
    backgroundColor: "rgba(26, 136, 190, 0.04)",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 220,
  },
  topVignette: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 100,
  },
});
