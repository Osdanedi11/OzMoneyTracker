import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { DatabaseProvider } from '../src/context/DatabaseContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  return (
    <ErrorBoundary>
      <DatabaseProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgPrimary },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-expense"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="edit-expense/[id]/index"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="add-category"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="edit-category/[id]/index"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </DatabaseProvider>
    </ErrorBoundary>
  );
}
