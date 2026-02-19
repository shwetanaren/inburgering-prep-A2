import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useOffline } from '@/components/useOffline';
import { DEFAULT_SRS_CONFIG, type Rating } from '@/packages/srs';
import { getReviewQueueByWeek, recordReview } from '@/packages/services';
import type { ProgressDTO, ReviewResultDTO, TodayQueueItemDTO } from '@/packages/services';
import { useRouter } from 'expo-router';
import { useSelectedWeek } from '@/components/WeekContext';

type ReviewState = {
  queue: TodayQueueItemDTO[];
  index: number;
  flipped: boolean;
  lastResult: ReviewResultDTO | null;
  completed: boolean;
};

const ratingLabels: Record<Rating, string> = {
  again: '<1m',
  good: `${DEFAULT_SRS_CONFIG.intervalsDays[1] ?? 3}d`,
  easy: `${DEFAULT_SRS_CONFIG.intervalsDays[2] ?? 7}d`,
};

export default function ReviewScreen() {
  const { isOffline } = useOffline();
  const router = useRouter();
  const { selectedWeek } = useSelectedWeek();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [state, setState] = useState<ReviewState>({
    queue: [],
    index: 0,
    flipped: false,
    lastResult: null,
    completed: false,
  });
  const restartRef = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getReviewQueueByWeek(selectedWeek)
      .then((queue) => {
        setState({
          queue,
          index: 0,
          flipped: false,
          lastResult: null,
          completed: queue.length === 0,
        });
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!state.completed) {
      restartRef.current = false;
      return;
    }
    if (state.queue.length === 0) return;
    if (restartRef.current) return;
    restartRef.current = true;
    load();
  }, [state.completed, state.queue.length, load]);

  const current = state.queue[state.index];
  const total = state.queue.length;

  const onRate = async (rating: Rating) => {
    if (!current) return;
    try {
      const result = await recordReview(
        current.word.id,
        rating,
        current.state?.nextReviewAt
      );
      const nextIndex = state.index + 1;
      setState((prev) => ({
        ...prev,
        index: nextIndex,
        flipped: false,
        lastResult: result,
        completed: nextIndex >= prev.queue.length,
      }));
    } catch (err) {
      setError(err as Error);
    }
  };

  const progress: ProgressDTO | null = useMemo(
    () => state.lastResult?.progress ?? null,
    [state.lastResult]
  );

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading review" description="Building your queue." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load review"
          description="Please try again."
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (state.completed) {
    if (state.queue.length === 0) {
      return (
        <Screen>
          <EmptyState title="No cards due" description="Come back later for review." />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState title="Restarting review" description="Refreshing your cards." />
      </Screen>
    );
  }

  if (!current) {
    return (
      <Screen>
        <EmptyState title="No cards due" description="Come back later for review." />
      </Screen>
    );
  }

  const word = current.word;
  const title = `${word.article ?? ''} ${word.lemma}`.trim();
  const translation = word.translation;
  const exampleNl = word.exampleNl;
  const exampleEn = word.exampleEn;

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <View className="flex-row items-center justify-between px-5 pt-3">
        <Pressable onPress={() => router.push('/')}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={18} color="#2f6cf6" />
            <Text className="text-[15px] font-semibold text-brand">Home</Text>
          </View>
        </Pressable>
        <Text className="text-[12px] text-muted">{`Card ${state.index + 1} of ${total}`}</Text>
      </View>

      <View className="flex-1 px-5 pt-5">
        <Pressable
          onPress={() => setState((prev) => ({ ...prev, flipped: !prev.flipped }))}
          className="flex-1"
        >
          <Card className="flex-1 items-center justify-center px-6 py-8">
            <View className="rounded-full bg-blue-100 px-3 py-1">
              <Text className="text-[10px] font-semibold tracking-widest text-brand">
                {word.topic?.toUpperCase() ?? 'TOPIC'}
              </Text>
            </View>

            <Text className="mt-6 text-[28px] font-semibold text-ink">{title}</Text>

            {state.flipped ? (
              <View className="mt-6 w-full items-center">
                <Text className="text-[16px] font-semibold text-brand">{translation}</Text>
                {exampleNl ? (
                  <Text className="mt-4 text-center text-sm text-ink">
                    “{exampleNl}”
                  </Text>
                ) : null}
                {exampleEn ? (
                  <Text className="mt-2 text-center text-xs text-muted">
                    {exampleEn}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View className="mt-6 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="volume-medium" size={20} color="#2f6cf6" />
              </View>
            )}
          </Card>
        </Pressable>
        <Text className="mt-3 text-center text-[12px] text-muted">
          Tap card to reveal meaning
        </Text>
      </View>

      <View className="px-5 pb-6 pt-2">
        {state.lastResult ? (
          <Text className="mb-2 text-center text-[11px] font-semibold text-green-600">Saved</Text>
        ) : null}
        <Text className="mb-3 text-center text-[12px] text-muted">How did that feel?</Text>
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            onPress={() => onRate('again')}
            className="flex-1 rounded-2xl border border-red-200 bg-white px-3 py-3"
          >
            <Text className="text-center text-sm font-semibold text-danger">Again</Text>
            <Text className="text-center text-[11px] text-danger">{ratingLabels.again}</Text>
          </Pressable>
          <Pressable
            onPress={() => onRate('good')}
            className="flex-1 rounded-2xl border border-blue-200 bg-white px-3 py-3"
          >
            <Text className="text-center text-sm font-semibold text-brand">Good</Text>
            <Text className="text-center text-[11px] text-brand">{ratingLabels.good}</Text>
          </Pressable>
          <Pressable
            onPress={() => onRate('easy')}
            className="flex-1 rounded-2xl border border-green-200 bg-white px-3 py-3"
          >
            <Text className="text-center text-sm font-semibold text-success">Easy</Text>
            <Text className="text-center text-[11px] text-success">{ratingLabels.easy}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
