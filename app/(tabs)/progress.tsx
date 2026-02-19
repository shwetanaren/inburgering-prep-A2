import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useOffline } from '@/components/useOffline';
import { getProgress } from '@/packages/services';
import type { ProgressDTO } from '@/packages/services';

export default function ProgressScreen() {
  const { isOffline } = useOffline();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<ProgressDTO | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getProgress()
      .then((data) => setProgress(data))
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading progress" description="Pulling your stats." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load progress"
          description="Please try again."
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (!progress) {
    return (
      <Screen>
        <EmptyState title="No progress yet" description="Complete a review to see stats." />
      </Screen>
    );
  }

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5">
        <View className="mt-4 flex-row items-center justify-end">
          <Pressable>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        <View className="mt-2 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark" size={32} color="#22c55e" />
          </View>
          <Text className="mt-5 text-[22px] font-semibold text-ink">Review Complete!</Text>
          <Text className="mt-2 text-[13px] text-muted">Great job staying on track.</Text>
        </View>

        <Card className="mt-6">
          <View className="flex-row items-center justify-between">
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-warning">
                🔥 {progress.streakCurrent}
              </Text>
              <Text className="text-[11px] text-muted">Streak</Text>
            </View>
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-ink">
                {progress.reviewsTodayCount}
              </Text>
              <Text className="text-[11px] text-muted">Cards</Text>
            </View>
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-brand">{progress.dueCount}</Text>
              <Text className="text-[11px] text-muted">Due</Text>
            </View>
          </View>
        </Card>

        <View className="mt-6">
          <ProgressBar value={progress.reviewsTodayCount} total={progress.dailyGoal} />
          <Text className="mt-3 text-center text-[12px] text-muted">
            Next review in ~4 hours
          </Text>
        </View>

        <Button className="mt-8" label="Back to Home" onPress={() => router.push('/')} />
        <View className="mt-3" />
      </ScrollView>
    </Screen>
  );
}
