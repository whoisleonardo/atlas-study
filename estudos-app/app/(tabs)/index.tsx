import { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { getAllTopicos, insertTopico, upsertTopico, deleteTopico } from '../../src/services/topicoRepo';
import { getItemsByTopico } from '../../src/services/itemRepo';
import { enqueuePendingOp, sync } from '../../src/services/sync';
import { api } from '../../src/services/api';
import { TopicCard } from '../../src/components/TopicCard';
import { AtlasLogo } from '../../src/components/AtlasLogo';
import type { TopicoResumo, Item } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const [topicos, setTopicos] = useState<TopicoResumo[]>([]);
  const [nextItems, setNextItems] = useState<Record<number, Item>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newNome, setNewNome] = useState('');

  const load = useCallback(async () => {
    const data = await getAllTopicos();
    setTopicos(data);
    const nexts: Record<number, Item> = {};
    for (const t of data) {
      const items = await getItemsByTopico(t.id);
      const next = items.find((i) => i.status === 'PENDENTE' || i.status === 'FAZENDO');
      if (next) nexts[t.id] = next;
    }
    setNextItems(nexts);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await sync(); } catch {}
    await load();
    setRefreshing(false);
  };

  const createTopico = async () => {
    if (!newNome.trim()) return;
    const nome = newNome.trim();
    const cor = '#A85C42';
    try {
      const id = await api.createTopico({ nome, cor });
      await upsertTopico({ id, nome, cor, synced_at: new Date().toISOString() });
    } catch {
      await insertTopico(nome, undefined, cor);
      try { await enqueuePendingOp('POST', '/api/topicos', { nome, cor }); } catch {}
    }
    setNewNome('');
    setShowModal(false);
    await load();
  };

  const confirmDelete = (topico: TopicoResumo) => {
    Alert.alert(
      topico.nome,
      'Delete this topic and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTopico(topico.id);
            if (topico.synced_at) {
              try { await enqueuePendingOp('DELETE', `/api/topicos/${topico.id}`, {}); } catch {}
            }
            await load();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AtlasLogo size={26} />
          <Text style={styles.heading}>Topics</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={topicos}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <TopicCard
            topico={item}
            nextItem={nextItems[item.id]}
            onPress={() => router.push(`/topico/${item.id}`)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.clay} />}
        contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No topics yet. Tap + to add one.</Text>
        }
      />

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Topic</Text>
            <TextInput
              style={styles.input}
              value={newNome}
              onChangeText={setNewNome}
              placeholder="Topic name"
              placeholderTextColor={Colors.gray}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createTopico} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  heading: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.clay, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  empty: { textAlign: 'center', color: Colors.gray, marginTop: 80, fontSize: 15, fontFamily: Fonts.regular },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  input: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radii.cta, padding: Spacing.md, fontSize: 16, fontFamily: Fonts.regular, color: Colors.ink, backgroundColor: Colors.bone },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radii.cta, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  cancelText: { color: Colors.inkMuted, fontFamily: Fonts.semiBold },
  confirmBtn: { flex: 1, padding: Spacing.md, borderRadius: Radii.cta, alignItems: 'center', backgroundColor: Colors.clay },
  confirmText: { color: '#fff', fontFamily: Fonts.semiBold },
});
