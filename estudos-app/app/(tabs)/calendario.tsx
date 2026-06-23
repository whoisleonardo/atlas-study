import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radii, Fonts } from '../../src/constants/design';
import { getAllItemsWithDates, getItemsByDate, getItemsByTopico, updateItemDate } from '../../src/services/itemRepo';
import { getAllTopicos } from '../../src/services/topicoRepo';
import { enqueuePendingOp } from '../../src/services/sync';
import { useLanguage } from '../../src/hooks/useLanguage';
import type { Item, TopicoResumo } from '../../src/types';

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function CalendarScreen() {
  const { t } = useLanguage();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dotMap, setDotMap] = useState<Record<string, string>>({});
  const [topicos, setTopicos] = useState<TopicoResumo[]>([]);
  const [dayItems, setDayItems] = useState<Item[]>([]);

  const [showAssign, setShowAssign] = useState(false);
  const [assignTopico, setAssignTopico] = useState<TopicoResumo | null>(null);
  const [topicItems, setTopicItems] = useState<Item[]>([]);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const [allItems, ts] = await Promise.all([getAllItemsWithDates(), getAllTopicos()]);
    setTopicos(ts);
    const map: Record<string, string> = {};
    for (const item of allItems) {
      if (!item.data_prevista) continue;
      const tp = ts.find((t) => t.id === item.topico_id);
      map[item.data_prevista] = tp?.cor ?? Colors.clay;
    }
    setDotMap(map);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const selectDay = async (dateStr: string) => {
    setSelectedDate(dateStr);
    const items = await getItemsByDate(dateStr);
    setDayItems(items);
  };

  const openAssign = () => {
    setAssignTopico(null);
    setTopicItems([]);
    setShowAssign(true);
  };

  const pickTopic = async (tp: TopicoResumo) => {
    setAssignTopico(tp);
    const items = await getItemsByTopico(tp.id);
    setTopicItems(items.filter((i) => i.status !== 'CONCLUIDO'));
  };

  const assignItem = async (item: Item) => {
    if (!selectedDate) return;
    try {
      await updateItemDate(item.id, selectedDate);
    } catch (e: any) {
      Alert.alert('', e.message ?? 'Error saving');
      return;
    }
    try { await enqueuePendingOp('PATCH', `/api/itens/${item.id}`, { data_prevista: selectedDate }); } catch {}
    setShowAssign(false);
    setAssignTopico(null);
    setTopicItems([]);
    const date = selectedDate;
    await load();
    await selectDay(date);
  };

  const days = getDaysInMonth(year, month);
  const firstDow = days[0].getDay();
  const monthLabel = `${t.months[month]} ${year}`;
  const todayStr = toISO(now);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>{t.tabCalendar}</Text>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevMonth}><Text style={styles.nav}>‹</Text></TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth}><Text style={styles.nav}>›</Text></TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {t.weekdaysShort.map((d) => <Text key={d} style={styles.dow}>{d}</Text>)}
          {Array(firstDow).fill(null).map((_, i) => <View key={`e${i}`} style={styles.cell} />)}
          {days.map((d) => {
            const str = toISO(d);
            const isToday = str === todayStr;
            const isSelected = str === selectedDate;
            const dotColor = dotMap[str];
            return (
              <TouchableOpacity key={str} style={styles.cell} onPress={() => selectDay(str)}>
                <View style={[
                  styles.dayCircle,
                  isToday && styles.today,
                  isSelected && !isToday && styles.selected,
                ]}>
                  <Text style={[styles.dayText, isToday && styles.todayText]}>{d.getDate()}</Text>
                </View>
                {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{selectedDate}</Text>
              <TouchableOpacity style={styles.assignBtn} onPress={openAssign}>
                <Text style={styles.assignBtnText}>+ {t.assignItem}</Text>
              </TouchableOpacity>
            </View>
            {dayItems.length === 0
              ? <Text style={styles.empty}>{t.noItemsDue}</Text>
              : dayItems.map((item) => (
                  <View key={item.id} style={styles.panelRow}>
                    <Text style={styles.panelItem}>{item.titulo}</Text>
                    <Text style={styles.panelStatus}>{item.status}</Text>
                  </View>
                ))
            }
          </View>
        )}

        <View style={styles.legend}>
          {topicos.map((tp) => (
            <View key={tp.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: tp.cor }]} />
              <Text style={styles.legendLabel}>{tp.nome}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAssign} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!assignTopico ? (
                <>
                  <Text style={styles.sheetTitle}>{t.pickTopic}</Text>
                  {topicos.map((tp) => (
                    <TouchableOpacity key={tp.id} style={styles.pickerRow} onPress={() => pickTopic(tp)}>
                      <View style={[styles.pickerDot, { backgroundColor: tp.cor }]} />
                      <Text style={styles.pickerLabel}>{tp.nome}</Text>
                      <Text style={styles.pickerChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => { setAssignTopico(null); setTopicItems([]); }} style={styles.backRow}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backLabel}>{assignTopico.nome}</Text>
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>{t.pickItem}</Text>
                  {topicItems.length === 0 && (
                    <Text style={styles.empty}>{t.noItems}</Text>
                  )}
                  {topicItems.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.pickerRow} onPress={() => assignItem(item)}>
                      <Text style={styles.pickerLabel}>{item.titulo}</Text>
                      {item.periodo && <Text style={styles.pickerSub}>{item.periodo}</Text>}
                    </TouchableOpacity>
                  ))}
                </>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAssign(false); setAssignTopico(null); }}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bone },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  heading: { fontSize: 28, fontFamily: Fonts.bold, color: Colors.ink },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  nav: { fontSize: 28, color: Colors.clay, paddingHorizontal: Spacing.md },
  monthLabel: { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm },
  dow: { width: '14.28%', textAlign: 'center', fontSize: 11, color: Colors.gray, fontFamily: Fonts.semiBold, paddingVertical: 4 },
  cell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: Colors.clay },
  selected: { backgroundColor: Colors.clayLight },
  dayText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.ink },
  todayText: { color: '#fff', fontFamily: Fonts.bold },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 1 },
  panel: { margin: Spacing.md, backgroundColor: Colors.card, borderRadius: Radii.card, borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  panelTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.inkMuted },
  assignBtn: { backgroundColor: Colors.clay, borderRadius: Radii.pill, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  assignBtnText: { color: '#fff', fontSize: 12, fontFamily: Fonts.semiBold },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.separator },
  panelItem: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.ink, flex: 1 },
  panelStatus: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.gray },
  empty: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.gray, paddingVertical: Spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md, paddingBottom: 100 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.inkMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40, maxHeight: '70%' },
  sheetTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.ink, marginBottom: Spacing.md },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.separator },
  pickerDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  pickerLabel: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, color: Colors.ink },
  pickerSub: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.gray },
  pickerChevron: { fontSize: 18, color: Colors.gray },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  backChevron: { fontSize: 20, color: Colors.clay, marginRight: 4 },
  backLabel: { fontSize: 15, color: Colors.clay, fontFamily: Fonts.semiBold },
  cancelBtn: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radii.cta, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  cancelText: { color: Colors.inkMuted, fontFamily: Fonts.semiBold },
});
