import * as Calendar from 'expo-calendar';
import { Database } from '@/types/supabase';

type Item = Database['public']['Tables']['items']['Row'];

/**
 * Requests calendar permissions and returns true if granted
 */
async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) {
      console.error('Calendar permission error:', error);
    }
    return false;
  }
}

/**
 * Gets the default calendar ID for creating events
 */
async function getDefaultCalendarId(): Promise<string | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(
      (cal) => cal.allowsModifications && cal.isPrimary
    );
    return defaultCalendar?.id || calendars.find((cal) => cal.allowsModifications)?.id || null;
  } catch (error) {
    if (__DEV__) {
      console.error('Get calendar error:', error);
    }
    return null;
  }
}

/**
 * Adds an item's renewal date to the system calendar
 * 
 * @param item - The item to add to calendar
 * @returns The created event ID, or null if failed
 */
export async function addToCalendar(item: Item): Promise<string | null> {
  try {
    // Request permission
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      throw new Error('Calendar permission not granted');
    }

    // Get default calendar
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) {
      throw new Error('No calendar available');
    }

    // Parse expiry date
    if (!item.expiry_date) {
      throw new Error('Item has no expiry date');
    }

    const expiryDate = new Date(item.expiry_date);
    const now = new Date();

    // Create event
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `Renew ${item.title}`,
      startDate: expiryDate,
      endDate: new Date(expiryDate.getTime() + 60 * 60 * 1000), // 1 hour duration
      notes: `Estimated cost: £${item.cost_monthly?.toFixed(2) || 'N/A'}. Open SpotCheck to negotiate.`,
      alarms: [
        {
          relativeOffset: -14 * 24 * 60, // 14 days before (in minutes)
          method: Calendar.AlarmMethod.ALERT,
        },
        {
          relativeOffset: -1 * 24 * 60, // 1 day before (in minutes)
          method: Calendar.AlarmMethod.ALERT,
        },
      ],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return eventId;
  } catch (error) {
    if (__DEV__) {
      console.error('Add to calendar error:', error);
    }
    throw error;
  }
}
