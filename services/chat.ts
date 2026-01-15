import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Item = Database['public']['Tables']['items']['Row'];

interface ChatResponse {
  response: string;
}

/**
 * Sends a message to the chat coach AI.
 * Fetches all active items and sends them along with the query.
 * 
 * @param query - The user's question/message
 * @param userId - The current user's ID
 * @returns The AI's response as a string
 * @throws Error if the request fails
 */
export async function sendMessage(query: string, userId: string): Promise<string> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  try {
    // Fetch all active items for the user
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('renewal_status', 'active')
      .order('created_at', { ascending: false });

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('chat-coach', {
      body: {
        query: query.trim(),
        items: items || [],
      },
    });

    if (error) {
      throw new Error(`Chat failed: ${error.message}`);
    }

    const response = data as ChatResponse;

    if (!response || !response.response) {
      throw new Error('Invalid response from chat coach');
    }

    return response.response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Chat failed: ${error}`);
  }
}
