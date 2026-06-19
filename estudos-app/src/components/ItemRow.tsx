import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Fonts } from '../constants/design';
import type { Item, ItemStatus } from '../types';

const STATUS_CYCLE: Record<ItemStatus, ItemStatus> = {
  PENDENTE: 'FAZENDO',
  FAZENDO: 'CONCLUIDO',
  CONCLUIDO: 'PENDENTE',
};

interface Props {
  item: Item;
  onStatusChange: (id: number, next: ItemStatus) => void;
  onLongPress?: () => void;
}

function StatusIcon({ status, color }: { status: ItemStatus; color: string }) {
  if (status === 'PENDENTE') {
    return <View style={[styles.iconCircle, { borderColor: '#D8D0C2' }]} />;
  }
  if (status === 'FAZENDO') {
    return (
      <View style={[styles.iconCircle, { borderColor: color }]}>
        <View style={[styles.iconDot, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={[styles.iconCircle, { borderColor: color, backgroundColor: color }]}>
      <Text style={styles.checkmark}>✓</Text>
    </View>
  );
}

export function ItemRow({ item, onStatusChange, onLongPress }: Props) {
  const color = Colors.clay;
  const isDone = item.status === 'CONCLUIDO';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onStatusChange(item.id, STATUS_CYCLE[item.status])}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <StatusIcon status={item.status} color={color} />
      <View style={styles.content}>
        <Text style={[styles.titulo, isDone && styles.done]}>{item.titulo}</Text>
        {item.periodo && <Text style={styles.meta}>{item.periodo}</Text>}
      </View>
      {item.tipo === 'META' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>META</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  iconCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  iconDot: { width: 8, height: 8, borderRadius: 4 },
  checkmark: { color: '#fff', fontSize: 12, fontFamily: Fonts.bold },
  content: { flex: 1 },
  titulo: { fontSize: 15, fontFamily: Fonts.regular, color: Colors.ink },
  done: { color: Colors.gray, textDecorationLine: 'line-through' },
  meta: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.inkMuted, marginTop: 1 },
  badge: { backgroundColor: Colors.clayLight, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: Colors.clay, fontFamily: Fonts.semiBold },
});
