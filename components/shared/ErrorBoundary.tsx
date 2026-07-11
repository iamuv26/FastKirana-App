import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    router.replace('/');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-slate-50 dark:bg-zinc-950 items-center justify-center px-6 py-12">
          <View 
            style={{ width: Platform.OS === 'web' ? 420 : '100%' }}
            className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 items-center shadow-xl shadow-slate-100/10"
          >
            <View className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100 dark:border-rose-900/30 mb-4 animate-bounce">
              <AlertTriangle size={24} color="#e20a22" />
            </View>

            <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg text-center uppercase tracking-wide">
              App Encountered an Error
            </Text>
            
            <Text className="text-slate-500 dark:text-zinc-400 text-xs text-center font-bold mt-2 leading-relaxed">
              FastKirana was forced to pause to protect your cart data. Try resetting the current view to proceed.
            </Text>

            {this.state.error && (
              <View className="w-full bg-slate-50 dark:bg-zinc-950/40 rounded-2xl p-4 mt-5 border border-slate-100 dark:border-zinc-800/80">
                <Text className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1.5">
                  Error Details
                </Text>
                <ScrollView style={{ maxHeight: 120 }}>
                  <Text className="text-[10.5px] font-mono text-slate-700 dark:text-zinc-300 font-bold leading-relaxed">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 mt-2">
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            <Pressable
              onPress={this.handleReset}
              className="w-full bg-rose-600 active:bg-rose-700 py-3.5 rounded-xl items-center justify-center flex-row gap-2 active:scale-98 mt-6 shadow-md shadow-rose-600/10"
            >
              <RotateCcw size={16} color="#fff" strokeWidth={3} />
              <Text className="text-white font-black text-xs uppercase tracking-wider">
                Reset App Session
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
