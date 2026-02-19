import React from 'react';
import { View, Text } from 'react-native';

type ProgressBarProps = {
  value: number;
  total: number;
  showLabel?: boolean;
};

export function ProgressBar({ value, total, showLabel = true }: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const ratio = Math.min(1, Math.max(0, value / safeTotal));
  const percent = Math.round(ratio * 100);

  return (
    <View>
      <View className="h-2 w-full rounded-full bg-slate-200">
        <View
          className="h-2 rounded-full bg-brand"
          style={{ width: `${percent}%` }}
        />
      </View>
      {showLabel ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[11px] text-muted">{`${value} of ${total} done today`}</Text>
          <Text className="text-[11px] font-semibold text-brand">{`${percent}%`}</Text>
        </View>
      ) : null}
    </View>
  );
}
