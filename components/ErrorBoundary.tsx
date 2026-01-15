import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to crash reporting service in production
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    // In production, send to crash reporting service (e.g., Sentry)
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-slate-50 items-center justify-center p-6">
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full">
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-rose-100 items-center justify-center mb-4">
                  <AlertTriangle size={40} color="#DC2626" />
                </View>
                <Text 
                  className="text-2xl font-semibold text-slate-900 mb-2 text-center"
                  accessibilityRole="header"
                >
                  Something went wrong
                </Text>
                <Text 
                  className="text-slate-500 text-sm text-center"
                  accessibilityRole="text"
                >
                  We encountered an unexpected error. Don't worry, your data is safe.
                </Text>
              </View>

              {__DEV__ && this.state.error && (
                <View className="mb-6 p-4 bg-slate-100 rounded-xl">
                  <Text 
                    className="text-xs font-mono text-slate-700 mb-2"
                    accessibilityRole="text"
                  >
                    Error Details (Dev Only):
                  </Text>
                  <Text 
                    className="text-xs font-mono text-slate-600"
                    accessibilityRole="text"
                  >
                    {this.state.error.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={this.handleReload}
                className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                accessibilityRole="button"
                accessibilityLabel="Reload App"
                accessibilityHint="Reloads the app to recover from the error"
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2 text-lg">
                  Reload App
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
