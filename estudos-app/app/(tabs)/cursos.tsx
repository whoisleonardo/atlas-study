import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { getAllCursos, insertCurso, upsertCurso, deleteCurso } from '../../src/services/cursoRepo';
import { getAllTopicos } from '../../src/services/topicoRepo';
import { enqueuePendingOp, sync } from '../../src/services/sync';
import { api } from '../../src/services/api';
import { investimentoPorMoeda, mensalAtivoPorMoeda } from '../../src/logic/progresso';
import { useLanguage } from '../../src/hooks/useLanguage';
import type { Curso, CursoStatus, Pagamento, TopicoResumo } from '../../src/types';

export default function CursosScreen() {
  const { t } = useLanguage();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [topicos, setTopicos] = useState<TopicoResumo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedTopico, setSelectedTopico] = useState<number | null>(null);
  const [cursoNome, setCursoNome] = useState('');
  const [cursoPlatform, setCursoPlatform] = useState('');
  const [cursoStatus, setCursoStatus] = useState<CursoStatus>('PLANEJADO');
  const [cursoPagamento, setCursoPagamento] = useState<Pagamento>('UNICO');
  const [cursoValor, setCursoValor] = useState('0');
  const [cursoMoeda, setCursoMoeda] = useState('BRL');
  const [cursoMeses, setCursoMeses] = useState('0');

  const load = useCallback(async () => {
    const [all, ts] = await Promise.all([getAllCursos(), getAllTopicos()]);
    setCursos([...all].sort((a, b) => {
      if (a.status === 'FAZENDO' && b.status !== 'FAZENDO') return -1;
      if (b.status === 'FAZENDO' && a.status !== 'FAZENDO') return 1;
      return 0;
    }));
    setTopicos(ts);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await sync(); } catch {}
    await load();
    setRefreshing(false);
  };

  const confirmDelete = (curso: Curso) => {
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

  const resetForm = () => {
    setSelectedTopico(null); setCursoNome(''); setCursoPlatform('');
    setCursoStatus('PLANEJADO'); setCursoPagamento('UNICO');
    setCursoValor('0'); setCursoMoeda('BRL'); setCursoMeses('0');
  };

  const handleAdd = async () => {
    if (!cursoNome.trim()) { Alert.alert('', t.title + ' obrigatório'); return; }
    if (!selectedTopico) { Alert.alert('', t.pickTopic); return; }
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
      const result = await api.addCurso(selectedTopico, data);
      await upsertCurso({ id: result.id, topico_id: selectedTopico, ...data, synced_at: new Date().toISOString() });
    } catch {
      await insertCurso(selectedTopico, data);
      await enqueuePendingOp('POST', `/api/topicos/${selectedTopico}/cursos`, data);
    }
    setShowModal(false);
    resetForm();
    await load();
  };

  const investido = investimentoPorMoeda(cursos);
  const mensal = mensalAtivoPorMoeda(cursos);
  const moedas = Array.from(new Set([...Object.keys(investido), ...Object.keys(mensal)]));

  const STATUS_LABEL: Record<string, string> = {
    FAZENDO: t.active, PAUSADO: t.paused, CONCLUIDO: t.owned, PLANEJADO: t.planned,
  };
  const STATUS_COLOR: Record<string, string> = {
    FAZENDO: Colors.clay, PAUSADO: Colors.gray, CONCLUIDO: Colors.gray, PLANEJADO: Colors.gray,
  };
  const CURSO_STATUSES: CursoStatus[] = ['PLANEJADO', 'FAZENDO', 'CONCLUIDO', 'PAUSADO'];
  const STATUS_LABELS: Record<CursoStatus, string> = {
    PLANEJADO: t.planned, FAZENDO: t.active, CONCLUIDO: t.owned, PAUSADO: t.paused,
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.clay} />}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>{t.tabCourses}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {moedas.map((moeda) => (
          <View key={moeda} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{moeda} · {t.totalInvested}</Text>
            <Text style={styles.summaryValue}>{(investido[moeda] ?? 0).toFixed(2)}</Text>
            {mensal[moeda] != null && (
              <>
                <Text style={styles.summaryLabel}>{t.monthlyActive}</Text>
                <Text style={styles.summaryValue}>{mensal[moeda].toFixed(2)}</Text>
              </>
            )}
          </View>
        ))}

        {cursos.length === 0 && <Text style={styles.empty}>{t.noCourses}</Text>}

        {cursos.length > 0 && <View style={styles.list}>
          {cursos.map((curso, idx) => (
            <View key={curso.id} style={[styles.row, curso.status === 'PAUSADO' && styles.paused]}>
              {idx > 0 && <View style={styles.sep} />}
              <TouchableOpacity
                style={styles.rowInner}
                onLongPress={() => confirmDelete(curso)}
                delayLongPress={400}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{curso.nome}</Text>
                  {curso.plataforma && <Text style={styles.platform}>{curso.plataforma}</Text>}
                </View>
                <View>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLOR[curso.status] + '22' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[curso.status] }]}>
                      {STATUS_LABEL[curso.status]}
                    </Text>
                  </View>
                  <Text style={styles.valor}>{curso.moeda} {curso.valor.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t.addCourse}</Text>

              <Text style={styles.fieldLabel}>{t.pickTopic}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {topicos.map((tp) => (
                    <TouchableOpacity
                      key={tp.id}
                      style={[styles.topicChip, selectedTopico === tp.id && { backgroundColor: tp.cor, borderColor: tp.cor }]}
                      onPress={() => setSelectedTopico(tp.id)}
                    >
                      <Text style={[styles.topicChipText, selectedTopico === tp.id && { color: '#fff' }]}>{tp.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>{t.title}</Text>
              <TextInput style={styles.input} value={cursoNome} onChangeText={setCursoNome} placeholder={t.title} placeholderTextColor={Colors.gray} />

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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); resetForm(); }}>
                  <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md },
  heading: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.clay, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  empty: { textAlign: 'center', color: Colors.gray, marginTop: Spacing.xl, fontSize: 14, fontFamily: Fonts.regular },
  summaryCard: { margin: Spacing.md, backgroundColor: Colors.ink, borderRadius: Radii.card, padding: Spacing.lg },
  summaryLabel: { fontSize: 12, color: '#9A9086', fontFamily: Fonts.semiBold, marginTop: Spacing.sm },
  summaryValue: { fontSize: 32, color: '#fff', marginTop: 4, fontFamily: Fonts.bold },
  list: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden', marginBottom: 100 },
  row: {},
  paused: { opacity: 0.78 },
  rowInner: { flexDirection: 'row', padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  sep: { height: 1, backgroundColor: Colors.separator, marginHorizontal: Spacing.md },
  nome: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.ink },
  platform: { fontSize: 12, color: Colors.inkMuted, marginTop: 2, fontFamily: Fonts.regular },
  badge: { borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-end', marginBottom: 4 },
  badgeText: { fontSize: 11, fontFamily: Fonts.semiBold },
  valor: { fontSize: 12, color: Colors.gray, textAlign: 'right', fontFamily: Fonts.regular },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40, maxHeight: '85%' },
  sheetTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: Radii.cta, padding: Spacing.md, fontSize: 15, fontFamily: Fonts.regular, color: Colors.ink, backgroundColor: Colors.bone, marginBottom: Spacing.sm },
  topicChip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radii.pill, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.bone },
  topicChipText: { fontSize: 13, color: Colors.inkMuted, fontFamily: Fonts.semiBold },
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
