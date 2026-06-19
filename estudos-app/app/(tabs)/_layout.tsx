import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/design';
import { useLanguage } from '../../src/hooks/useLanguage';

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />;
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.bone }]} />;
}

export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.clay,
        tabBarInactiveTintColor: Colors.gray,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.tabBarBorder,
          backgroundColor: Platform.OS === 'android' ? Colors.bone : 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen name="index" options={{
        title: t.tabTopics,
        tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="calendario" options={{
        title: t.tabCalendar,
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="cursos" options={{
        title: t.tabCourses,
        tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="lembretes" options={{
        title: t.tabReminders,
        tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="voce" options={{
        title: t.tabYou,
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
