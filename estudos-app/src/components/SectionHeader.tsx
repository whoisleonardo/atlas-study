import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/design';

interface Props {
  title: string;
  progress?: number;
}

export function SectionHeader({ title, progress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {progress !== undefined && (
        <Text style={styles.pct}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  title: { fontSize: 13, fontWeight: '600', color: Colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pct: { fontSize: 13, color: Colors.inkMuted },
});
