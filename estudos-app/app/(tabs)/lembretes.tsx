import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { getAllTopicos } from '../../src/services/topicoRepo';
import { scheduleLembrete, cancelLembrete } from '../../src/services/notifications';
import { getDb } from '../../src/services/db';
import { useLanguage } from '../../src/hooks/useLanguage';
import type { TopicoResumo, Lembrete, Frequencia } from '../../src/types';

const DIAS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export default function LembretesScreen() {
  const { t } = useLanguage();
  const FREQ_LABEL: Record<Frequencia, string> = { DIARIO: t.daily, SEMANAL: t.weekly, CUSTOM: t.custom };
  const [topicos, setTopicos] = useState<TopicoResumo[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [selectedTopico, setSelectedTopico] = useState<number | undefined>();
  const [frequencia, setFrequencia] = useState<Frequencia>('SEMANAL');
  const [diasSel, setDiasSel] = useState<Set<string>>(new Set(['MON','WED','FRI']));
  const [hora, setHora] = useState('19:30');

  const load = useCallback(async () => {
    const db = getDb();
    const [ts, ls] = await Promise.all([
      getAllTopicos(),
      db.getAllAsync<Lembrete>('SELECT * FROM lembretes ORDER BY id DESC'),
    ]);
    setTopicos(ts);
    setLembretes(ls);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleDia = (dia: string) => {
    const next = new Set(diasSel);
    next.has(dia) ? next.delete(dia) : next.add(dia);
    setDiasSel(next);
  };

  const schedule = async () => {
    const db = getDb();
    const result = await db.runAsync(
      'INSERT INTO lembretes (topico_id, frequencia, dias, hora, ativo) VALUES (?, ?, ?, ?, 1)',
      [selectedTopico ?? null, frequencia, JSON.stringify(Array.from(diasSel)), hora]
    );
    const inserted: Lembrete = {
      id: result.lastInsertRowId,
      topico_id: selectedTopico,
      frequencia,
      dias: JSON.stringify(Array.from(diasSel)),
      hora,
      ativo: 1,
    };
    const ids = await scheduleLembrete(inserted);
    await db.runAsync('UPDATE lembretes SET expo_notification_ids = ? WHERE id = ?', [JSON.stringify(ids), inserted.id]);
    Alert.alert(t.reminderScheduled, t.reminderNextAt(hora));
    await load();
  };

  const toggleActive = async (l: Lembrete) => {
    const db = getDb();
    const next = l.ativo ? 0 : 1;
    if (!next) {
      await cancelLembrete(l);
    } else {
      const ids = await scheduleLembrete(l);
      await db.runAsync('UPDATE lembretes SET expo_notification_ids = ? WHERE id = ?', [JSON.stringify(ids), l.id]);
    }
    await db.runAsync('UPDATE lembretes SET ativo = ? WHERE id = ?', [next, l.id]);
    await load();
  };

  const adjustHour = (delta: number) => {
    const [h, m] = hora.split(':').map(Number);
    const newH = (h + delta + 24) % 24;
    setHora(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const adjustMin = (delta: number) => {
    const [h, m] = hora.split(':').map(Number);
    const newM = (m + delta + 60) % 60;
    setHora(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t.tabReminders}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t.topicOptional}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {topicos.map((tp) => (
            <TouchableOpacity
              key={tp.id}
              style={[styles.pill, selectedTopico === tp.id && { backgroundColor: tp.cor }]}
              onPress={() => setSelectedTopico(selectedTopico === tp.id ? undefined : tp.id)}
            >
              <Text style={[styles.pillText, selectedTopico === tp.id && { color: '#fff' }]}>{tp.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t.frequency}</Text>
        <View style={styles.segmented}>
          {(['DIARIO','SEMANAL'] as Frequencia[]).map((f) => (
            <TouchableOpacity key={f} style={[styles.seg, frequencia === f && styles.segActive]} onPress={() => setFrequencia(f)}>
              <Text style={[styles.segText, frequencia === f && styles.segTextActive]}>{FREQ_LABEL[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequencia === 'SEMANAL' && (
          <>
            <Text style={styles.label}>{t.days}</Text>
            <View style={styles.diasRow}>
              {DIAS.map((d, i) => (
                <TouchableOpacity key={d} style={[styles.dayBtn, diasSel.has(d) && styles.dayBtnActive]} onPress={() => toggleDia(d)}>
                  <Text style={[styles.dayBtnText, diasSel.has(d) && styles.dayBtnTextActive]}>{t.weekdayInitials[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>{t.time}</Text>
        <View style={styles.timePicker}>
          <View style={styles.timeCol}>
            <TouchableOpacity onPress={() => adjustHour(1)}><Text style={styles.timeArrow}>▲</Text></TouchableOpacity>
            <Text style={[styles.timeNum, { fontFamily: 'Newsreader_400Regular' }]}>{hora.split(':')[0]}</Text>
            <TouchableOpacity onPress={() => adjustHour(-1)}><Text style={styles.timeArrow}>▼</Text></TouchableOpacity>
          </View>
          <Text style={styles.timeSep}>:</Text>
          <View style={styles.timeCol}>
            <TouchableOpacity onPress={() => adjustMin(5)}><Text style={styles.timeArrow}>▲</Text></TouchableOpacity>
            <Text style={[styles.timeNum, { fontFamily: 'Newsreader_400Regular' }]}>{hora.split(':')[1]}</Text>
            <TouchableOpacity onPress={() => adjustMin(-5)}><Text style={styles.timeArrow}>▼</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.cta} onPress={schedule}>
          <Text style={styles.ctaText}>{t.scheduleReminder}</Text>
        </TouchableOpacity>
      </View>

      {lembretes.length > 0 && (
        <View style={[styles.card, { marginTop: Spacing.md }]}>
          <Text style={styles.label}>{t.activeReminders}</Text>
          {lembretes.map((l, idx) => (
            <View key={l.id}>
              {idx > 0 && <View style={styles.sep} />}
              <View style={styles.lembRow}>
                <View>
                  <Text style={styles.lembHora}>{l.hora}</Text>
                  <Text style={styles.lembFreq}>{FREQ_LABEL[l.frequencia]}</Text>
                </View>
                <Switch value={!!l.ativo} onValueChange={() => toggleActive(l)} trackColor={{ true: Colors.clay }} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md },
  heading: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink },
  card: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md },
  label: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.inkMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  pill: { borderRadius: Radii.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.bone, borderWidth: 1, borderColor: Colors.cardBorder, marginRight: Spacing.sm },
  pillText: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.ink },
  segmented: { flexDirection: 'row', backgroundColor: Colors.bone, borderRadius: Radii.cta, marginBottom: Spacing.md, overflow: 'hidden' },
  seg: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radii.cta },
  segActive: { backgroundColor: Colors.clay },
  segText: { fontSize: 11, color: Colors.inkMuted, fontFamily: Fonts.semiBold },
  segTextActive: { color: '#fff' },
  diasRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  dayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bone, borderWidth: 1, borderColor: Colors.cardBorder },
  dayBtnActive: { backgroundColor: Colors.clay, borderColor: Colors.clay },
  dayBtnText: { fontSize: 12, color: Colors.inkMuted, fontFamily: Fonts.semiBold },
  dayBtnTextActive: { color: '#fff' },
  timePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, gap: 4 },
  timeCol: { alignItems: 'center', gap: 4 },
  timeArrow: { fontSize: 20, color: Colors.clay },
  timeNum: { fontSize: 48, color: Colors.ink, fontFamily: Fonts.bold },
  timeSep: { fontSize: 40, color: Colors.ink, marginBottom: 4 },
  cta: { backgroundColor: Colors.clay, borderRadius: Radii.cta, padding: Spacing.md, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 15 },
  sep: { height: 1, backgroundColor: Colors.separator },
  lembRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  lembHora: { fontSize: 18, fontFamily: Fonts.semiBold, color: Colors.ink },
  lembFreq: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.inkMuted },
});
