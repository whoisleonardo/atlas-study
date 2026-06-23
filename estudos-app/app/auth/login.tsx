import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radii, Spacing, Fonts } from '../../src/constants/design';
import { useLanguage } from '../../src/hooks/useLanguage';
import { validateLogin, isOnboarded, getUser, setSession } from '../../src/hooks/useUser';
import { AtlasLogo } from '../../src/components/AtlasLogo';
import type { Lang } from '../../src/constants/strings';

export default function LoginScreen() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUser().then((u) => { if (u) setEmail(u.email); });
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('', t.emailRequired); return; }
    if (!password) { Alert.alert('', t.passwordRequired); return; }
    setLoading(true);
    const user = await validateLogin(email.trim(), password);
    if (!user) { setLoading(false); Alert.alert('', t.wrongCredentials); return; }
    await setSession(remember);
    setLoading(false);
    const onboarded = await isOnboarded();
    router.replace(onboarded ? '/(tabs)' : '/onboarding');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.card}>
          <View style={styles.logoWrap}><AtlasLogo size={56} /></View>
          <Text style={styles.wordmark}>Atlas</Text>
          <Text style={styles.tagline}>{t.welcomeAtlas}</Text>

          <View style={styles.langRow}>
            {(['pt', 'en'] as Lang[]).map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}
              >
                <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                  {l === 'pt' ? 'Português' : 'English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t.emailLabel}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Text style={styles.label}>{t.passwordLabel}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.gray}
              secureTextEntry
            />
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember(!remember)} activeOpacity={0.7}>
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>{t.rememberMe}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cta} onPress={handleLogin} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? '...' : t.signIn}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/register')} style={styles.link}>
            <Text style={styles.linkText}>{t.noAccount} <Text style={styles.linkAccent}>{t.register}</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: 60 },
  card: { width: '100%', maxWidth: 420 },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.sm },
  wordmark: { fontSize: 48, fontFamily: Fonts.bold, color: Colors.clay, textAlign: 'center', letterSpacing: -1, marginBottom: Spacing.xs },
  tagline: { fontSize: 16, fontFamily: Fonts.regular, color: Colors.inkMuted, textAlign: 'center', marginBottom: Spacing.lg },
  langRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.lg },
  langBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.pill, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.card },
  langBtnActive: { backgroundColor: Colors.clay, borderColor: Colors.clay },
  langText: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.inkMuted },
  langTextActive: { color: '#fff' },
  form: { gap: Spacing.sm },
  label: { fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  checkboxOn: { backgroundColor: Colors.clay, borderColor: Colors.clay },
  checkboxMark: { color: '#fff', fontSize: 13, fontFamily: Fonts.bold },
  rememberText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.inkMuted },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radii.cta, padding: Spacing.md, fontSize: 16, fontFamily: Fonts.regular, color: Colors.ink, marginBottom: Spacing.sm },
  cta: { backgroundColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.sm },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },
  link: { marginTop: Spacing.lg, alignItems: 'center' },
  linkText: { fontFamily: Fonts.regular, color: Colors.inkMuted, fontSize: 14 },
  linkAccent: { color: Colors.clay, fontFamily: Fonts.semiBold },
});
