import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar, using custom TabBar
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen 
        name="dashboard" 
        options={{
          href: null, // Hide from tabs (redirects to index)
        }}
      />
    </Tabs>
  );
}
