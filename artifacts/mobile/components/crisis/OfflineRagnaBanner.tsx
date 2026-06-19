import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { OFFLINE_RAGNA_SCRIPTS } from "@/constants/offlineRagnaResponses";
import {
  formatOfflineScriptAsMessage,
  getOfflineResponse,
} from "@/services/offlineRagnaFallback";

interface Props {
  scenarioId?: string;
  onUseOffline?: (message: string) => void;
}

export function OfflineRagnaBanner({ scenarioId, onUseOffline }: Props) {
  const script = scenarioId ? getOfflineResponse(scenarioId) : undefined;

  const showTopScripts = () => {
    const first = OFFLINE_RAGNA_SCRIPTS[0];
    const msg = formatOfflineScriptAsMessage(first);
    if (onUseOffline) {
      onUseOffline(msg);
    } else {
      router.push({
        pathname: "/(tabs)/help",
        params: { initialMessage: first.title, offlineScenarioId: first.scenarioId },
      } as any);
    }
  };

  return (
    <View style={styles.wrap}>
      <Feather name="wifi-off" size={16} color={Colors.amber} />
      <View style={styles.text}>
        <Text style={styles.title}>Ragna is offline</Text>
        <Text style={styles.body}>
          {script
            ? `Cached guidance for "${script.title}" is available.`
            : "Cached answers for urgent situations are still here."}
        </Text>
      </View>
      <Pressable onPress={showTopScripts} style={styles.btn}>
        <Text style={styles.btnText}>View</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(200, 150, 50, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber + "35",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.amber },
  body: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9AB0D8", lineHeight: 15 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.amber + "22",
  },
  btnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.amber },
});