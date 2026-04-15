import { Stack } from 'expo-router';

export default function TrackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="bad-habits" />
      <Stack.Screen name="bad-habit-detail" />
      <Stack.Screen name="add-edit-bad-habit" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="journal-entry" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="log-activity" />
      <Stack.Screen name="relapse-sheet" />
    </Stack>
  );
}