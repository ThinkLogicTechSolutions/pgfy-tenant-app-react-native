/** Tenant bottom tabs — Home · My Stay · Profile. */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette, fontFamily } from '@/theme';

function icon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={(focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap))} size={23} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.navy,
        tabBarInactiveTintColor: palette.inkTertiary,
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="stay" options={{ title: 'My Stay', tabBarIcon: icon('bed') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
