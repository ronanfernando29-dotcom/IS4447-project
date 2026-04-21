import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
};

export default function InfoTag({ label, value }: Props) {
  const { colors, dark } = useTheme();

  return (
    <View style={[styles.tag, { backgroundColor: dark ? colors.border + '40' : '#EFF6FF' }]}>
      <Text style={[styles.label, { color: dark ? '#93C5FD' : '#1D4ED8' }]}>{label}</Text>
      <Text style={[styles.value, { color: dark ? '#BFDBFE' : '#1E3A8A' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 999,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
  },
});