import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@spotcheck_preferences';

interface Preferences {
  requireFaceID: boolean;
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
}

const defaultPreferences: Preferences = {
  requireFaceID: true,
  hapticsEnabled: true,
  soundsEnabled: true,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading preferences:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving preference:', error);
      }
      // Rollback on error
      setPreferences(preferences);
    }
  };

  return {
    preferences,
    isLoading,
    updatePreference,
  };
}
