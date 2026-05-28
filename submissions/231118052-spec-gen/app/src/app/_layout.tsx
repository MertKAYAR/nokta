import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiFocused]}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#444',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Avatar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪞" label="Avatar" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Ses',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎙️" label="Ses" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="forge"
        options={{
          title: 'Forge',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛠️" label="Forge" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="bridge"
        options={{
          title: 'Uzman',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📞" label="Uzman" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111',
    borderTopColor: '#222',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabIcon: {
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  emojiFocused: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    color: '#444',
    fontFamily: 'monospace',
  },
  labelFocused: {
    color: '#00ff88',
  },
});
