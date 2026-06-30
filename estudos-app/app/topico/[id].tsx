import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { getTopico, updateTopicoCor } from '../../src/services/topicoRepo';
import { getItemsByTopico, groupByPeriodo, updateItemStatus, upsertItem, insertItem, deleteItem } from '../../src/services/itemRepo';
import { getCursosByTopico, upsertCurso, insertCurso, deleteCurso } from '../../src/services/cursoRepo';
import { enqueuePendingOp } from '../../src/services/sync';
import { api } from '../../src/services/api';
import { weightedProgress, progressByPeriodo } from '../../src/logic/progresso';
import { ProgressRing } from '../../src/components/ProgressRing';
import { ItemRow } from '../../src/components/ItemRow';
import { SectionHeader } from '../../src/components/SectionHeader';
import { ColorPicker } from '../../src/components/ColorPicker';
import { useLanguage } from '../../src/hooks/useLanguage';
import type { Topico, Item, Curso, ItemStatus, ItemTipo, CursoStatus, Pagamento } from '../../src/types';

export default function TopicoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicoId = Number(id);
  const { t } = useLanguage();
  const router = useRouter();

  const [topico, setTopico] = useState<Topico | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [grupos, setGrupos] = useState<Record<string, Item[]>>({});
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemTipo, setItemTipo] = useState<ItemTipo>('META');
  const [itemTitulo, setItemTitulo] = useState('');
  const [itemPeriodo, setItemPeriodo] = useState('');
  const [itemDue, setItemDue] = useState('');
  const [itemPeso, setItemPeso] = useState('1');

  const [showCursoModal, setShowCursoModal] = useState(false);
  const [cursoNome, setCursoNome] = useState('');
  const [cursoPlatform, setCursoPlatform] = useState('');
  const [cursoStatus, setCursoStatus] = useState<CursoStatus>('PLANEJADO');
  const [cursoPagamento, setCursoPagamento] = useState<Pagamento>('UNICO');
  const [cursoValor, setCursoValor] = useState('0');
  const [cursoMoeda, setCursoMoeda] = useState('BRL');
  const [cursoMeses, setCursoMeses] = useState('0');

  const load = useCallback(async () => {
    const [tp, allItems, grps, cs] = await Promise.all([
      getTopico(topicoId),
      getItemsByTopico(topicoId),
      groupByPeriodo(topicoId),
      getCursosByTopico(topicoId),
    ]);
    setTopico(tp);
    setItems(allItems);
    setGrupos(grps);
    setCursos(cs);
  }, [topicoId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleStatusChange = async (itemId: number, next: ItemStatus) => {
    await updateItemStatus(itemId, next);
    await enqueuePendingOp('PATCH', `/api/itens/${itemId}/status`, { status: next });
    await load();
  };

  const handleCorChange = async (cor: string) => {
    if (!topico) return;
    await updateTopicoCor(topicoId, cor);
    await enqueuePendingOp('PATCH', `/api/topicos/${topicoId}`, { cor });
    setTopico({ ...topico, cor });
  };

  const confirmDeleteItem = (item: Item) => {
    Alert.alert(item.titulo, 'Delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          try { await enqueuePendingOp('DELETE', `/api/itens/${item.id}`, {}); } catch {}
          await load();
        },
      },
    ]);
  };

  const confirmDeleteCurso = (curso: Curso) => {
    Alert.alert(curso.nome, 'Delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteCurso(curso.id);
          try { await enqueuePendingOp('DELETE', `/api/cursos/${curso.id}`, {}); } catch {}
          await load();
        },
      },
    ]);
  };

  const resetItemForm = () => {
    setItemTitulo(''); setItemPeriodo(''); setItemDue(''); setItemPeso('1'); setItemTipo('META');
  };

  const handleAddItem = async () => {
    if (!itemTitulo.trim()) { Alert.alert('', t.title + ' obrigatório'); return; }
    const data: Omit<Item, 'id' | 'topico_id' | 'synced_at'> = {
      tipo: itemTipo,
      titulo: itemTitulo.trim(),
      status: 'PENDENTE',
      peso: parseInt(itemPeso) || 1,
      periodo: itemPeriodo.trim() || undefined,
      data_prevista: itemDue.trim() || undefined,
    };
    try {
      const result = await api.addItem(topicoId, data);
      await upsertItem({ id: result.id, topico_id: topicoId, ...data, synced_at: new Date().toISOString() });
    } catch {
      await insertItem(topicoId, data);
      await enqueuePendingOp('POST', `/api/topicos/${topicoId}/itens`, data);
    }
    setShowItemModal(false);
    resetItemForm();
    await load();
  };

  const resetCursoForm = () => {
    setCursoNome(''); setCursoPlatform(''); setCursoStatus('PLANEJADO');
    setCursoPagamento('UNICO'); setCursoValor('0'); setCursoMoeda('BRL'); setCursoMeses('0');
  };

  const handleAddCurso = async () => {
    if (!cursoNome.trim()) { Alert.alert('', t.title + ' obrigatório'); return; }
    const data: Omit<Curso, 'id' | 'topico_id' | 'synced_at'> = {
      nome: cursoNome.trim(),
      plataforma: cursoPlatform.trim() || undefined,
      status: cursoStatus,
      pagamento: cursoPagamento,
      valor: parseFloat(cursoValor.replace(',', '.')) || 0,
      moeda: cursoMoeda.toUpperCase(),
      progresso: 0,
      meses_ativos: parseInt(cursoMeses) || 0,
    };
    try {
      const result = await api.addCurso(topicoId, data);
      await upsertCurso({ id: result.id, topico_id: topicoId, ...data, synced_at: new Date().toISOString() });
    } catch {
      await insertCurso(topicoId, data);
      await enqueuePendingOp('POST', `/api/topicos/${topicoId}/cursos`, data);
    }
    setShowCursoModal(false);
    resetCursoForm();
    await load();
  };

  if (!topico) return null;

  const pct = weightedProgress(items);
  const porPeriodo = progressByPeriodo(items);
  const periodos = Object.keys(grupos);

  const TIPOS: ItemTipo[] = ['META', 'TEORIA', 'PRATICA'];
  const TIPO_LABELS: Record<ItemTipo, string> = { META: t.goal, TEORIA: t.theory, PRATICA: t.practice };
  const CURSO_STATUSES: CursoStatus[] = ['PLANEJADO', 'FAZENDO', 'CONCLUIDO', 'PAUSADO'];
  const STATUS_LABELS: Record<CursoStatus, string> = { PLANEJADO: t.planned, FAZENDO: t.active, CONCLUIDO: t.owned, PAUSADO: t.paused };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={styles.ringWrap}>
            <ProgressRing size={80} percentage={pct} color={topico.cor} strokeWidth={5} />
            <Text style={styles.pct}>{Math.round(pct)}%</Text>
          </View>
          <Text style={styles.nome}>{topico.nome}</Text>
          {topico.descricao && <Text style={styles.desc}>{topico.descricao}</Text>}
          <Text style={styles.stats}>{items.filter(i => i.status === 'CONCLUIDO').length} of {items.length} items</Text>
        </View>

        <ColorPicker selected={topico.cor} onChange={handleCorChange} />

        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowItemModal(true)}>
            <Text style={styles.addBtnText}>+ {t.addItem}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.addBtnOutline]} onPress={() => setShowCursoModal(true)}>
            <Text style={[styles.addBtnText, { color: Colors.clay }]}>+ {t.addCourse}</Text>
          </TouchableOpacity>
        </View>

        {periodos.length === 0 && (
          <Text style={styles.empty}>{t.noItems}</Text>
        )}

        {periodos.map((periodo) => (
          <View key={periodo} style={styles.group}>
            <SectionHeader title={periodo || 'Items'} progress={porPeriodo[periodo]} />
            <View style={styles.card}>
              {grupos[periodo].map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <View style={styles.sep} />}
                  <ItemRow item={item} onStatusChange={handleStatusChange} onPress={() => router.push(`/item/${item.id}`)} onLongPress={() => confirmDeleteItem(item)} />
                </View>
              ))}
            </View>
          </View>
        ))}

        {cursos.length > 0 && (
          <View style={styles.group}>
            <SectionHeader title={t.tabCourses} />
            <View style={styles.card}>
              {cursos.map((curso, idx) => (
                <View key={curso.id}>
                  {idx > 0 && <View style={styles.sep} />}
                  <TouchableOpacity
                    style={styles.cursoRow}
                    onLongPress={() => confirmDeleteCurso(curso)}
                    delayLongPress={400}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cursoNome}>{curso.nome}</Text>
                      {curso.plataforma && <Text style={styles.cursoPlatform}>{curso.plataforma}</Text>}
                    </View>
                    <Text style={styles.cursoValor}>{curso.moeda} {curso.valor.toFixed(2)}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showItemModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t.addItem}</Text>

            <Text style={styles.fieldLabel}>{t.type}</Text>
            <View style={styles.segRow}>
              {TIPOS.map((tp) => (
                <TouchableOpacity key={tp} style={[styles.seg, itemTipo === tp && styles.segActive]} onPress={() => setItemTipo(tp)}>
                  <Text style={[styles.segText, itemTipo === tp && styles.segTextActive]}>{TIPO_LABELS[tp]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t.title}</Text>
            <TextInput style={styles.input} value={itemTitulo} onChangeText={setItemTitulo} placeholder={t.title} placeholderTextColor={Colors.gray} autoFocus />

            <Text style={styles.fieldLabel}>{t.period}</Text>
            <TextInput style={styles.input} value={itemPeriodo} onChangeText={setItemPeriodo} placeholder={t.period} placeholderTextColor={Colors.gray} />

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t.dueDate}</Text>
                <TextInput style={styles.input} value={itemDue} onChangeText={setItemDue} placeholder="2026-12-31" placeholderTextColor={Colors.gray} />
              </View>
              <View style={{ width: 80 }}>
                <Text style={styles.fieldLabel}>{t.weight}</Text>
                <TextInput style={styles.input} value={itemPeso} onChangeText={setItemPeso} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowItemModal(false); resetItemForm(); }}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddItem}>
                <Text style={styles.confirmText}>{t.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showCursoModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t.addCourse}</Text>

              <Text style={styles.fieldLabel}>{t.title}</Text>
              <TextInput style={styles.input} value={cursoNome} onChangeText={setCursoNome} placeholder={t.title} placeholderTextColor={Colors.gray} autoFocus />

              <Text style={styles.fieldLabel}>{t.platform}</Text>
              <TextInput style={styles.input} value={cursoPlatform} onChangeText={setCursoPlatform} placeholder="Udemy, Coursera…" placeholderTextColor={Colors.gray} />

              <Text style={styles.fieldLabel}>{t.status}</Text>
              <View style={styles.segRow}>
                {CURSO_STATUSES.map((s) => (
                  <TouchableOpacity key={s} style={[styles.seg, cursoStatus === s && styles.segActive]} onPress={() => setCursoStatus(s)}>
                    <Text style={[styles.segText, cursoStatus === s && styles.segTextActive]}>{STATUS_LABELS[s]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>{t.payment}</Text>
              <View style={styles.segRow}>
                {(['UNICO', 'ASSINATURA'] as Pagamento[]).map((p) => (
                  <TouchableOpacity key={p} style={[styles.seg, { flex: 1 }, cursoPagamento === p && styles.segActive]} onPress={() => setCursoPagamento(p)}>
                    <Text style={[styles.segText, cursoPagamento === p && styles.segTextActive]}>{p === 'UNICO' ? t.oneTime : t.subscription}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t.value}</Text>
                  <TextInput style={styles.input} value={cursoValor} onChangeText={setCursoValor} keyboardType="decimal-pad" />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={styles.fieldLabel}>{t.currency}</Text>
                  <TextInput style={styles.input} value={cursoMoeda} onChangeText={(v) => setCursoMoeda(v.toUpperCase())} maxLength={3} autoCapitalize="characters" />
                </View>
              </View>

              {cursoPagamento === 'ASSINATURA' && (
                <View style={{ width: '50%' }}>
                  <Text style={styles.fieldLabel}>{t.activeMonths}</Text>
                  <TextInput style={styles.input} value={cursoMeses} onChangeText={setCursoMeses} keyboardType="number-pad" />
                </View>
              )}

              <View style={[styles.modalBtns, { marginBottom: 8 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCursoModal(false); resetCursoForm(); }}>
                  <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleAddCurso}>
                  <Text style={styles.confirmText}>{t.add}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  pct: { position: 'absolute', fontSize: 20, color: Colors.ink, fontFamily: Fonts.semiBold },
  nome: { fontSize: 24, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: 4 },
  desc: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.inkMuted, textAlign: 'center', paddingHorizontal: Spacing.xl, marginBottom: 4 },
  stats: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.gray },
  addRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  addBtn: { flex: 1, backgroundColor: Colors.clay, borderRadius: Radii.cta, paddingVertical: 10, alignItems: 'center' },
  addBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.clay },
  addBtnText: { color: '#fff', fontFamily: Fonts.semiBold, fontSize: 13 },
  empty: { textAlign: 'center', color: Colors.gray, marginTop: Spacing.xl, fontSize: 14, fontFamily: Fonts.regular },
  group: { marginTop: Spacing.md },
  card: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  sep: { height: 1, backgroundColor: Colors.separator, marginHorizontal: Spacing.md },
  cursoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  cursoNome: { fontSize: 15, color: Colors.ink, fontFamily: Fonts.semiBold },
  cursoPlatform: { fontSize: 12, color: Colors.inkMuted, marginTop: 2, fontFamily: Fonts.regular },
  cursoValor: { fontSize: 14, color: Colors.inkMuted, fontFamily: Fonts.regular },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40, maxHeight: '85%' },
  sheetTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radii.cta, padding: Spacing.md, fontSize: 15, fontFamily: Fonts.regular, color: Colors.ink, backgroundColor: Colors.bone, marginBottom: Spacing.sm },
  segRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  seg: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radii.cta, backgroundColor: Colors.bone, borderWidth: 1, borderColor: Colors.cardBorder },
  segActive: { backgroundColor: Colors.clay, borderColor: Colors.clay },
  segText: { fontSize: 11, color: Colors.inkMuted, fontFamily: Fonts.semiBold },
  segTextActive: { color: '#fff' },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radii.cta, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  cancelText: { color: Colors.inkMuted, fontFamily: Fonts.semiBold },
  confirmBtn: { flex: 1, padding: Spacing.md, borderRadius: Radii.cta, alignItems: 'center', backgroundColor: Colors.clay },
  confirmText: { color: '#fff', fontFamily: Fonts.semiBold },
});
