import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radii } from '../constants/design';
import type { Curso } from '../types';

const STATUS_LABEL: Record<string, string> = { FAZENDO: 'Active', PAUSADO: 'Paused', CONCLUIDO: 'Owned', PLANEJADO: 'Planned' };

interface Props {
  curso: Curso;
  onPress?: () => void;
}

export function CursoRow({ curso, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.row, curso.status === 'PAUSADO' && styles.paused]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{curso.nome}</Text>
        {curso.plataforma && <Text style={styles.platform}>{curso.plataforma}</Text>}
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: curso.status === 'FAZENDO' ? Colors.clayLight : Colors.separator }]}>
          <Text style={[styles.badgeText, { color: curso.status === 'FAZENDO' ? Colors.clay : Colors.gray }]}>
            {STATUS_LABEL[curso.status]}
          </Text>
        </View>
        <Text style={styles.valor}>{curso.moeda} {curso.valor.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  paused: { opacity: 0.78 },
  nome: { fontSize: 15, fontWeight: '500', color: Colors.ink },
  platform: { fontSize: 12, color: Colors.inkMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  valor: { fontSize: 12, color: Colors.gray },
});
