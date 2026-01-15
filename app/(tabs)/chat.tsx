import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { sendMessage } from '@/services/chat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { TabBar } from '@/components/TabBar';
import { Toast } from '@/components/Toast';
import { Send } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: "I've analyzed your items. Ask me how to save money.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || isLoading) return;

    if (isOffline) {
      setToastMessage('You are offline. Reconnect to send messages.');
      setToastVisible(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await sendMessage(inputText.trim(), user.id);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      if (__DEV__) {
        console.error('Chat error:', error);
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Visual feedback for errors
      setToastMessage('Failed to send message');
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View className="flex-row justify-end mb-4 px-4">
          <View className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
            <Text className="text-white text-sm">{item.text}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View className="flex-row justify-start mb-4 px-4">
          <View className="bg-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <Text className="text-slate-900 text-sm">{item.text}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-slate-100 px-6 py-4">
          <Text 
            className="text-2xl font-semibold text-slate-900"
            accessibilityRole="header"
          >
            Spot
          </Text>
          <Text 
            className="text-slate-500 text-sm mt-1"
            accessibilityRole="text"
          >
            Your financial assistant
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListFooterComponent={
            isLoading ? (
              <View className="flex-row justify-start mb-4 px-4">
                <View className="bg-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <ActivityIndicator size="small" color="#64748B" />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Area */}
        <View className="bg-white border-t border-slate-100 px-4 py-3">
          <View className="flex-row items-center">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Spot..."
              placeholderTextColor="#94A3B8"
              className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-slate-900 mr-3"
              multiline
              maxLength={500}
              editable={!isLoading}
              accessibilityLabel="Message input"
              accessibilityHint="Type your question for Spot"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading || isOffline}
              className={`w-12 h-12 rounded-full bg-blue-600 items-center justify-center ${
                !inputText.trim() || isLoading || isOffline ? 'opacity-50' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityHint={isOffline ? "Requires internet connection. You are currently offline." : "Sends your message to Spot"}
              accessibilityState={{ disabled: !inputText.trim() || isLoading || isOffline }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Toast
        message={toastMessage}
        type="error"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <TabBar />
    </KeyboardAvoidingView>
  );
}
