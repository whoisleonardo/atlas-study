import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { TopicColors } from '../constants/design';

interface Props {
  selected: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ selected, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TopicColors.map((color) => (
        <TouchableOpacity
          key={color}
          style={[styles.dot, { backgroundColor: color }, selected === color && styles.selected]}
          onPress={() => onChange(color)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  dot: { width: 28, height: 28, borderRadius: 14 },
  selected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
});
