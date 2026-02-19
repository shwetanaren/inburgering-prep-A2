import React from 'react';
import { View, Text, Pressable } from 'react-native';

type StateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function LoadingState({ title, description }: StateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-lg font-semibold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: StateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-lg font-semibold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
      ) : null}
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-full bg-brand px-5 py-2"
        >
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ title, description, actionLabel, onAction }: StateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-lg font-semibold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
      ) : null}
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          className="mt-4 rounded-full bg-danger px-5 py-2"
        >
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
