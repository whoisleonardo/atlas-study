import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { ProgressRing } from './ProgressRing';
import { Colors, Radii, Spacing, Fonts } from '../constants/design';
import { useLanguage } from '../hooks/useLanguage';
import type { TopicoResumo, Item } from '../types';

interface Props {
  topico: TopicoResumo;
  nextItem?: Item;
  onPress: () => void;
  onLongPress?: () => void;
}

export function TopicCard({ topico, nextItem, onPress, onLongPress }: Props) {
  const { t } = useLanguage();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: topico.cor + '22' }]}>
          <Text style={[styles.avatarText, { color: topico.cor }]}>
            {topico.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nome}>{topico.nome}</Text>
          {nextItem && (
            <Text style={styles.next} numberOfLines={1}>
              {t.next} · {nextItem.titulo}
            </Text>
          )}
          <Text style={styles.count}>
            {t.itemsProgress(topico.concluidos, topico.totalItens)}
          </Text>
        </View>
      </View>
      <ProgressRing size={44} percentage={topico.progresso} color={topico.cor} strokeWidth={3.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  avatarText: { fontSize: 16, fontFamily: Fonts.semiBold },
  info: { flex: 1 },
  nome: { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.ink, marginBottom: 2 },
  next: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.inkMuted, marginBottom: 1 },
  count: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.gray },
});
