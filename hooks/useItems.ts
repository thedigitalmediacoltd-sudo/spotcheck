import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { triggerHaptic } from '@/services/sensory';

type Item = Database['public']['Tables']['items']['Row'];

export function useItems(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['items', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('expiry_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as Item[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Trigger haptic feedback on delete
      triggerHaptic('light');
      
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['items', userId] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Item[]>(['items', userId]);

      // Optimistically update
      if (previousItems) {
        queryClient.setQueryData<Item[]>(
          ['items', userId],
          previousItems.filter((item) => item.id !== itemId)
        );
      }

      return { previousItems };
    },
    onError: (err, itemId, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['items', userId], context.previousItems);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['items', userId] });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newItem: Database['public']['Tables']['items']['Insert']) => {
      const { data, error } = await supabase
        .from('items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['items', userId] });

      const previousItems = queryClient.getQueryData<Item[]>(['items', userId]);

      // Optimistically add (with temporary ID)
      if (previousItems) {
        const optimisticItem: Item = {
          ...newItem,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as Item;

        queryClient.setQueryData<Item[]>(
          ['items', userId],
          [...previousItems, optimisticItem]
        );
      }

      return { previousItems };
    },
    onSuccess: (data) => {
      // Replace optimistic item with real one
      const currentItems = queryClient.getQueryData<Item[]>(['items', userId]);
      if (currentItems) {
        const updatedItems = currentItems.map((item) =>
          item.id.startsWith('temp-') ? data : item
        );
        queryClient.setQueryData(['items', userId], updatedItems);
      }
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['items', userId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items', userId] });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    deleteItem: deleteMutation.mutate,
    addItem: addMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isAdding: addMutation.isPending,
  };
}
