import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { useLanguage } from '../../src/hooks/useLanguage';
import { getItem, updateItemDescricao } from '../../src/services/itemRepo';
import { enqueuePendingOp } from '../../src/services/sync';

export default function ItemNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const { t } = useLanguage();
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    getItem(itemId).then((item) => {
      if (item) {
        setTitulo(item.titulo);
        setDescricao(item.descricao ?? '');
        if (!item.descricao) inputRef.current?.focus();
      }
    });
  }, [itemId]);

  const handleSave = async () => {
    const text = descricao.trim();
    await updateItemDescricao(itemId, text);
    try { await enqueuePendingOp('PATCH', `/api/itens/${itemId}`, { descricao: text }); } catch {}
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.label}>{t.notes}</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={descricao}
          onChangeText={setDescricao}
          placeholder={t.notesPlaceholder}
          placeholderTextColor={Colors.gray}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleSave}>
          <Text style={styles.ctaText}>{t.save}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.lg, flexGrow: 1 },
  title: { fontSize: 22, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  label: { fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  input: {
    flex: 1,
    minHeight: 240,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radii.cta,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.ink,
    lineHeight: 24,
  },
  footer: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  cta: { backgroundColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md + 2, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },
});
