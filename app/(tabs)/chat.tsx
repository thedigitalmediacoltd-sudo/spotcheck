import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { sendMessage } from '@/services/chat';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePaywall } from '@/context/PaywallContext';
import { useProfile } from '@/hooks/useProfile';
import { ProBadge } from '@/components/ProBadge';
import { TabBar } from '@/components/TabBar';
import { Toast } from '@/components/Toast';
import { NativeIcon } from '@/components/NativeIcon';

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
      text: "I've analyzed your documents. How can I help you save money?",
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
  const { showPaywall } = usePaywall();
  const { profile } = useProfile();

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || isLoading) return;

    if (isOffline) {
      setToastMessage('Connect to the internet to send messages');
      setToastVisible(true);
      return;
    }

    if (!profile?.is_pro) {
      showPaywall();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
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
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setToastMessage('Failed to send message');
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View style={styles.messageRowRight}>
          <View style={styles.userMessage}>
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.messageRowLeft}>
          <View style={styles.aiMessage}>
            <Text style={styles.aiMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }
  }, []);

  return (
    <LinearGradient
      colors={['#F5F5F7', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <NativeIcon name="sparkles" size={20} color="#007AFF" />
                </View>
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title} accessibilityRole="header">
                  Spot
                </Text>
                {profile?.is_pro && (
                  <View style={styles.badgeContainer}>
                    <ProBadge size="sm" />
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.subtitle} accessibilityRole="text">
              Your Financial Coach
            </Text>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            ListFooterComponent={
              isLoading ? (
                <View style={styles.messageRowLeft}>
                  <View style={styles.aiMessage}>
                    <ActivityIndicator size="small" color="#8E8E93" />
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="#8E8E93"
                style={styles.textInput}
                multiline
                maxLength={500}
                editable={!isLoading}
                accessibilityLabel="Message input"
                accessibilityHint="Type your question for Spot"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading || isOffline}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading || isOffline) && styles.sendButtonDisabled
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{ disabled: !inputText.trim() || isLoading || isOffline }}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <NativeIcon name="send" size={18} color="#FFFFFF" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    marginRight: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.6,
  },
  badgeContainer: {
    marginLeft: 12,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 17,
    paddingLeft: 48,
    fontWeight: '400',
  },
  messagesList: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  messageRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  messageRowLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  aiMessage: {
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  aiMessageText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#000000',
    fontSize: 17,
    maxHeight: 100,
    fontWeight: '400',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
