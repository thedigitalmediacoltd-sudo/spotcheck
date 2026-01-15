import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Initialize audio mode on app start
let audioModeInitialized = false;

export async function initializeAudio() {
  if (audioModeInitialized) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // CRITICAL: Never play sound if ringer is silent
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioModeInitialized = true;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to initialize audio mode:', error);
    }
  }
}

/**
 * Triggers a sound effect, respecting silent mode.
 * Will only play if the device is not in silent mode.
 * Also respects user preference from Settings.
 * 
 * @param type - Type of sound: 'success' or 'alert'
 * @param preferences - Optional preferences object to check if sounds are enabled
 */
export async function triggerSound(
  type: 'success' | 'alert',
  preferences?: { soundsEnabled: boolean }
) {
  // Check user preference if provided
  if (preferences && !preferences.soundsEnabled) {
    return; // Sounds disabled in settings
  }
  try {
    // Ensure audio mode is initialized
    await initializeAudio();

    // Note: In production, replace with actual sound files:
    // const soundFile = type === 'success' 
    //   ? require('../assets/sounds/success.mp3')
    //   : require('../assets/sounds/alert.mp3');
    
    // For now, we'll skip actual sound playback since we don't have sound files
    // The audio mode is configured to respect silent mode (playsInSilentModeIOS: false)
    // When sound files are added, uncomment below:
    
    // const { sound } = await Audio.Sound.createAsync(
    //   soundFile,
    //   { shouldPlay: true, volume: 0.3 }
    // );
    
    // sound.setOnPlaybackStatusUpdate((status) => {
    //   if (status.isLoaded && status.didJustFinish) {
    //     sound.unloadAsync();
    //   }
    // });
    
    // The audio system will automatically respect silent mode
    // If the device is in silent mode, this will fail silently
  } catch (error) {
    // Silently fail if audio cannot play (e.g., device is in silent mode)
    // This is expected behavior and should not be logged
  }
}

/**
 * Triggers a haptic feedback.
 * expo-haptics automatically respects the OS 'System Haptics' toggle.
 * If haptics are disabled globally, this will fail silently.
 * Also respects user preference from Settings.
 * 
 * @param type - Type of haptic: 'light', 'success', or 'error'
 * @param preferences - Optional preferences object to check if haptics are enabled
 */
export async function triggerHaptic(
  type: 'light' | 'success' | 'error',
  preferences?: { hapticsEnabled: boolean }
) {
  // Check user preference if provided
  if (preferences && !preferences.hapticsEnabled) {
    return; // Haptics disabled in settings
  }

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    // Silently fail if haptics are disabled
    // This is expected behavior
  }
}
