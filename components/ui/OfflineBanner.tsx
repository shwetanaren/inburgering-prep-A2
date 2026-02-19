import React from 'react';
import { View, Text } from 'react-native';

type OfflineBannerProps = {
  visible: boolean;
};

export function OfflineBanner({ visible }: OfflineBannerProps) {
  if (!visible) return null;
  return (
    <View className="mx-5 mt-3 rounded-xl bg-amber-100 px-4 py-2">
      <Text className="text-xs font-semibold text-amber-700">
        You’re offline. Changes will sync locally.
      </Text>
    </View>
  );
}
