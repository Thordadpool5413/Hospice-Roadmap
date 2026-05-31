import { useSignIn, useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);

  if (isSignedIn) {
    router.replace("/");
    return null;
  }

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/" : (url as any));
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setNeedsMfa(true);
    }
  };

  const handleVerifyMfa = async () => {
    await signIn.mfa.verifyEmailCode({ code: mfaCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/" : (url as any));
        },
      });
    }
  };

  const isLoading = fetchStatus === "fetching";

  if (needsMfa) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.logoRow}>
          <Image source={require("@/assets/images/app-icon.png")} style={styles.logo} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>Enter the verification code we sent to your email.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={mfaCode}
            onChangeText={setMfaCode}
            placeholder="000000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            autoFocus
          />
          {errors.fields.code && (
            <Text style={styles.errorText}>{errors.fields.code.message}</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, isLoading && styles.btnDisabled, pressed && { opacity: 0.85 }]}
          onPress={handleVerifyMfa}
          disabled={isLoading || !mfaCode}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Verify</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => signIn.mfa.sendEmailCode()}
        >
          <Text style={styles.secondaryBtnText}>Resend code</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => { signIn.reset(); setNeedsMfa(false); }}>
          <Text style={styles.secondaryBtnText}>Start over</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <Image source={require("@/assets/images/app-icon.png")} style={styles.logo} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your Hospice Roadmap account.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {errors.fields.identifier && (
            <Text style={styles.errorText}>{errors.fields.identifier.message}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
          {errors.fields.password && (
            <Text style={styles.errorText}>{errors.fields.password.message}</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            (!email || !password || isLoading) && styles.btnDisabled,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSignIn}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.forgotBtn}
          onPress={() => router.push("/(auth)/forgot-password" as any)}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={styles.link}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 26,
    gap: 18,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  title: {
    fontSize: 25,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    opacity: 0.7,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
    letterSpacing: -0.05,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.42,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  link: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
