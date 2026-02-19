import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
};

export function Screen({ children, className }: ScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-bg ${className ?? ''}`}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
