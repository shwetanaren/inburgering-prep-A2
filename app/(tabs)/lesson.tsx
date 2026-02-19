import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import { getLesson, listLessonsByWeek } from '@/packages/services';
import type { LessonDTO, LessonSummaryDTO, SentenceLessonPayloadDTO } from '@/packages/services';
import { useSelectedWeek } from '@/components/WeekContext';

export default function LessonScreen() {
  const { isOffline } = useOffline();
  const router = useRouter();
  const { selectedWeek } = useSelectedWeek();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lessons, setLessons] = useState<LessonSummaryDTO[]>([]);
  const [sentenceDetails, setSentenceDetails] = useState<LessonDTO[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listLessonsByWeek(selectedWeek)
      .then(async (rows) => {
        setLessons(rows);
        const sentenceIds = rows.filter((l) => l.kind === 'sentence').map((l) => l.id);
        const details = await Promise.all(sentenceIds.map((id) => getLesson(id)));
        setSentenceDetails(details.filter((d): d is LessonDTO => Boolean(d)));
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  useEffect(() => {
    load();
  }, [load]);

  const sentenceLessons = useMemo(() => sentenceDetails, [sentenceDetails]);

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading lessons" description="Fetching week 1 content." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load lessons"
          description="Please try again."
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (lessons.length === 0) {
    return (
      <Screen>
        <EmptyState title="No lessons yet" description="Content will appear here." />
      </Screen>
    );
  }

  const firstSentence = sentenceLessons[0];

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5 pb-8">
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable onPress={() => router.push('/')}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-ink">Week 1: Supermarket</Text>
          <Ionicons name="information-circle-outline" size={20} color="#2f6cf6" />
        </View>

        <View className="mt-5">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-brand">
            Step 1 of {sentenceLessons.length}
          </Text>
          <Text className="mt-2 text-[18px] font-semibold text-ink">The A-G Framework</Text>
          <Text className="mt-2 text-[13px] text-muted">
            Master these 7 fundamental Dutch sentence patterns to pass the A2 exam with confidence.
          </Text>
        </View>

        <Card className="mt-4 bg-amber-50">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
            <Text className="text-[13px] font-semibold text-amber-700">Why this framework?</Text>
          </View>
          <Text className="mt-2 text-[13px] text-amber-700">
            Most exam questions focus on word order. Learning these patterns is the fastest way
            to improve your score.
          </Text>
        </Card>

        {sentenceLessons.map((lesson, idx) => {
          const isFirst = idx === 0;
          const code = lesson.title.split('—')[0]?.trim() ?? 'A';
          const payload = lesson.payload as SentenceLessonPayloadDTO;
          const subtitle = payload.patternDescEn ?? payload.patternDesc ?? 'Sentence pattern';
          const statusLabel =
            lesson.progressStatus === 'done'
              ? 'Done'
              : lesson.progressStatus === 'in_progress'
                ? 'In progress'
                : 'Not started';
          const statusBg =
            lesson.progressStatus === 'done'
              ? 'bg-green-100'
              : lesson.progressStatus === 'in_progress'
                ? 'bg-amber-100'
                : 'bg-slate-100';
          const statusText =
            lesson.progressStatus === 'done'
              ? 'text-green-700'
              : lesson.progressStatus === 'in_progress'
                ? 'text-amber-700'
                : 'text-slate-600';

          return (
            <Pressable
              key={lesson.id}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
              className="mt-4"
            >
              <Card className={`border ${isFirst ? 'border-brand' : 'border-transparent'}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                      <Text className="text-[15px] font-semibold text-brand">{code}</Text>
                    </View>
                    <View>
                      <Text className="text-[15px] font-semibold text-ink">{lesson.title}</Text>
                      <Text className="mt-1 text-[12px] text-muted">{subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
                <View className={`mt-3 self-start rounded-full px-3 py-1 ${statusBg}`}>
                  <Text className={`text-[11px] font-semibold ${statusText}`}>{statusLabel}</Text>
                </View>
                {isFirst ? (
                  <Text className="mt-3 text-[11px] font-semibold text-brand">START HERE</Text>
                ) : null}
              </Card>
            </Pressable>
          );
        })}

        <Button
          className="mt-6"
          label={firstSentence ? `Start ${firstSentence.title}` : 'Start Lesson'}
          onPress={() => {
            if (firstSentence) router.push(`/lesson/${firstSentence.id}`);
          }}
          rightIcon={<Ionicons name="arrow-forward" size={16} color="#fff" />}
        />
      </ScrollView>
    </Screen>
  );
}
