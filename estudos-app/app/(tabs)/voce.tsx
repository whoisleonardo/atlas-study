import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { pickCsvFile, parseCsvToPreview, importRows } from '../../src/services/csv';
import { sync } from '../../src/services/sync';
import { useLanguage } from '../../src/hooks/useLanguage';
import { getUser, logout } from '../../src/hooks/useUser';
import type { AtlasUser } from '../../src/hooks/useUser';
import type { Lang } from '../../src/constants/strings';
import type { CsvPreviewRow } from '../../src/types';

export default function VoceScreen() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<AtlasUser | null>(null);
  const [preview, setPreview] = useState<CsvPreviewRow[] | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useFocusEffect(useCallback(() => {
    getUser().then(setUser);
  }, []));

  const handlePick = async () => {
    const uri = await pickCsvFile();
    if (!uri) return;
    setFileUri(uri);
    try {
      const rows = await parseCsvToPreview(uri);
      setPreview(rows);
    } catch (e: any) {
      Alert.alert(t.parseError, e.message ?? '');
    }
  };

  const handleImport = async () => {
    if (!preview || !fileUri) return;
    setImporting(true);
    try {
      const { itemsCreated, cursosCreated } = await importRows(preview, fileUri);
      Alert.alert('', t.importComplete(itemsCreated, cursosCreated));
      setPreview(null);
      setFileUri(null);
    } catch (e: any) {
      Alert.alert(t.importFailed, e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      await sync();
      Alert.alert('', t.syncComplete);
    } catch (e: any) {
      Alert.alert(t.syncFailed, e.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t.signOutConfirm, t.signOutMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.signOut,
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const itemCount = preview?.filter((r) => r.tipo !== 'curso').length ?? 0;
  const cursoCount = preview?.filter((r) => r.tipo === 'curso').length ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t.tabYou}</Text>
      </View>

      {user && (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.language}</Text>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.importCsv}</Text>
        <Text style={styles.helpText}>{t.csvHelp}</Text>
        <TouchableOpacity style={styles.pickBtn} onPress={handlePick}>
          <Text style={styles.pickBtnText}>{t.chooseCsv}</Text>
        </TouchableOpacity>

        {preview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t.rowsN(preview.length)}</Text>
            <Text style={styles.previewSub}>{t.previewCount(itemCount, cursoCount)}</Text>
            <View style={styles.previewList}>
              {preview.slice(0, 8).map((row, i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewTipo}>{row.tipo}</Text>
                  <Text style={styles.previewTitulo} numberOfLines={1}>{row.titulo}</Text>
                  <Text style={styles.previewTopico}>{row.topico}</Text>
                </View>
              ))}
              {preview.length > 8 && (
                <Text style={styles.previewMore}>{t.moreN(preview.length - 8)}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.cta} onPress={handleImport} disabled={importing}>
              <Text style={styles.ctaText}>{importing ? '…' : t.importN(preview.length)}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.outline, { marginTop: Spacing.sm }]} onPress={handleSyncNow}>
          <Text style={styles.outlineText}>Sync now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md },
  heading: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginHorizontal: Spacing.md, marginBottom: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.clay, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontFamily: Fonts.bold },
  profileName: { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.ink },
  profileEmail: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.inkMuted, marginTop: 2 },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  helpText: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.inkMuted, lineHeight: 18, marginBottom: Spacing.md },
  langRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radii.pill, borderWidth: 1.5, borderColor: Colors.cardBorder, alignItems: 'center', backgroundColor: Colors.card },
  langBtnActive: { backgroundColor: Colors.clay, borderColor: Colors.clay },
  langText: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.inkMuted },
  langTextActive: { color: '#fff' },
  pickBtn: { borderRadius: Radii.cta, borderWidth: 1.5, borderColor: Colors.clay, borderStyle: 'dashed', padding: Spacing.lg, alignItems: 'center' },
  pickBtnText: { color: Colors.clay, fontFamily: Fonts.semiBold, fontSize: 15 },
  previewCard: { marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md },
  previewTitle: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: 4 },
  previewSub: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.inkMuted, marginBottom: Spacing.md },
  previewList: { marginBottom: Spacing.md },
  previewRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  previewTipo: { fontSize: 11, color: Colors.clay, fontFamily: Fonts.semiBold, width: 54 },
  previewTitulo: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, color: Colors.ink },
  previewTopico: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.gray },
  previewMore: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.gray, textAlign: 'center', marginTop: Spacing.sm },
  cta: { backgroundColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 14 },
  outline: { borderWidth: 1.5, borderColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md, alignItems: 'center' },
  outlineText: { color: Colors.clay, fontFamily: Fonts.semiBold, fontSize: 14 },
  signOutBtn: { borderWidth: 1.5, borderColor: '#D94A2F', borderRadius: Radii.cta, padding: Spacing.md, alignItems: 'center' },
  signOutText: { color: '#D94A2F', fontFamily: Fonts.semiBold, fontSize: 15 },
});
