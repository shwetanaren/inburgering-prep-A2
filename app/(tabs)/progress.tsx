import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import { getProgress, getWeeklyActivity } from '@/packages/services';
import type { ActivitySummaryDTO, ProgressDTO } from '@/packages/services';

export default function ProgressScreen() {
  const { isOffline } = useOffline();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [summary, setSummary] = useState<ActivitySummaryDTO | null>(null);
  const [progress, setProgress] = useState<ProgressDTO | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getWeeklyActivity(6), getProgress()])
      .then(([activity, prog]) => {
        setSummary(activity);
        setProgress(prog);
      })
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

  if (!summary || !progress) {
    return (
      <Screen>
        <EmptyState title="No progress yet" description="Complete a review to see stats." />
      </Screen>
    );
  }

  const maxTotal = Math.max(1, ...summary.weeks.map((w) => w.total));

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5">
        <View className="mt-5 flex-row items-center gap-2">
          <Ionicons name="stats-chart" size={18} color="#2f6cf6" />
          <Text className="text-[17px] font-semibold text-ink">Progress</Text>
        </View>

        <Card className="mt-5 px-5 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Text className="text-[18px]">🔥</Text>
            </View>
            <View>
              <Text className="text-[15px] font-semibold text-ink">{`${progress.streakCurrent}-day streak`}</Text>
              <Text className="text-[12px] text-muted">{`Best: ${progress.streakBest} days`}</Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 px-5 py-4">
          <Text className="text-[13px] font-semibold text-ink">Last 90 days activity</Text>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-brand">{summary.totals.words}</Text>
              <Text className="text-[11px] text-muted">Words</Text>
            </View>
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-amber-600">{summary.totals.sentences}</Text>
              <Text className="text-[11px] text-muted">Sentences</Text>
            </View>
            <View className="items-center">
              <Text className="text-[16px] font-semibold text-emerald-600">{summary.totals.dialogues}</Text>
              <Text className="text-[11px] text-muted">Dialogues</Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 px-5 py-4">
          <Text className="text-[13px] font-semibold text-ink">Weekly activity</Text>
          <Text className="mt-1 text-[12px] text-muted">Last 6 weeks</Text>
          <View className="mt-4 flex-row items-end justify-between">
            {summary.weeks.map((week) => {
              const heightTotal = Math.max(8, Math.round((week.total / maxTotal) * 140));
              const wordsH = Math.round((week.words / Math.max(week.total, 1)) * heightTotal);
              const sentencesH = Math.round((week.sentences / Math.max(week.total, 1)) * heightTotal);
              const dialoguesH = Math.max(0, heightTotal - wordsH - sentencesH);
              return (
                <View key={week.weekStartMs} className="items-center">
                  <View className="w-6 rounded-full bg-blue-100" style={{ height: 150, overflow: 'hidden' }}>
                    <View style={{ height: 150 - heightTotal }} />
                    <View style={{ height: wordsH }} className="w-6 bg-brand" />
                    <View style={{ height: sentencesH }} className="w-6 bg-amber-500" />
                    <View style={{ height: dialoguesH }} className="w-6 bg-emerald-500" />
                  </View>
                  <Text className="mt-2 text-[10px] text-muted">{week.label}</Text>
                </View>
              );
            })}
          </View>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-brand" />
              <Text className="text-[11px] text-muted">Words</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-amber-500" />
              <Text className="text-[11px] text-muted">Sentences</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emerald-500" />
              <Text className="text-[11px] text-muted">Dialogues</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
