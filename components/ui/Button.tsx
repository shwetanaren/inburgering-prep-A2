import React from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  rightIcon?: React.ReactNode;
  className?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  rightIcon,
  className,
}: ButtonProps) {
  const base =
    variant === 'primary'
      ? 'bg-brand'
      : variant === 'secondary'
        ? 'bg-white border border-brand'
        : variant === 'success'
          ? 'bg-brand'
          : 'bg-transparent';
  const text =
    variant === 'primary'
      ? 'text-white'
      : variant === 'secondary'
        ? 'text-brand'
        : variant === 'success'
          ? 'text-white'
          : 'text-ink';

  return (
    <Pressable
      onPress={onPress}
      className={`h-14 justify-center rounded-2xl px-5 active:opacity-80 ${base} ${className ?? ''}`}
    >
      <View className="flex-row items-center justify-center gap-2">
        <Text className={`text-base font-semibold ${text}`}>{label}</Text>
        {rightIcon}
      </View>
    </Pressable>
  );
}
