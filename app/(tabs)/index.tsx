import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import { getTodayPlan, listDialoguesByWeek, listLessonsByWeek } from '@/packages/services';
import type { DialogueSummaryDTO, LessonSummaryDTO, ProgressDTO } from '@/packages/services';
import { useSelectedWeek } from '@/components/WeekContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isOffline } = useOffline();
  const { weeks, selectedWeek, setSelectedWeek, loadingWeeks } = useSelectedWeek();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<ProgressDTO | null>(null);
  const [lessons, setLessons] = useState<LessonSummaryDTO[]>([]);
  const [dialogues, setDialogues] = useState<DialogueSummaryDTO[]>([]);
  const [weekLabels, setWeekLabels] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTodayPlan(),
      listLessonsByWeek(selectedWeek),
      listDialoguesByWeek(selectedWeek),
    ])
      .then(([plan, lessonRows, dialogueRows]) => {
        setProgress(plan.progress);
        setLessons(lessonRows);
        setDialogues(dialogueRows);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (weeks.length === 0) return;
    Promise.all(
      weeks.map(async (week) => {
        const rows = await listLessonsByWeek(week);
        const title = rows[0]?.title ?? `Week ${week}`;
        const parts = title.split('—');
        const label = parts.length > 1 ? parts[1]?.trim() : title;
        return { week, label: label || `Week ${week}` };
      })
    ).then((rows) => {
      const map: Record<number, string> = {};
      rows.forEach((row) => {
        map[row.week] = row.label;
      });
      setWeekLabels(map);
    });
  }, [weeks]);

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading your plan" description="Preparing today’s review." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load your plan"
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
        <EmptyState title="No plan yet" description="Add content to get started." />
      </Screen>
    );
  }

  const reviewCount = progress.reviewsTodayCount;
  const goal = progress.dailyGoal;
  const dueCount = progress.dueCount;
  const streak = progress.streakCurrent;
  const sentenceLessons = lessons.filter((l) => l.kind === 'sentence');
  const themeLabel = weekLabels[selectedWeek] ?? `Week ${selectedWeek}`;
  const lessonTitle =
    sentenceLessons.length > 0 ? `Week ${selectedWeek}: ${themeLabel} A-G` : `Week ${selectedWeek}`;
  const lessonStatus = sentenceLessons[0]?.progressStatus ?? 'not_started';
  const statusLabel =
    lessonStatus === 'done' ? 'Done' : lessonStatus === 'in_progress' ? 'In progress' : 'Not started';
  const statusBg =
    lessonStatus === 'done'
      ? 'bg-green-100'
      : lessonStatus === 'in_progress'
        ? 'bg-amber-100'
        : 'bg-slate-100';
  const statusText =
    lessonStatus === 'done'
      ? 'text-green-700'
      : lessonStatus === 'in_progress'
        ? 'text-amber-700'
        : 'text-slate-600';
  const dialogue = dialogues[0];

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5 pb-6" contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Text className="text-[11px] font-bold text-brand">NL</Text>
            </View>
            <Text className="text-[17px] font-semibold text-ink">InburgeringPrep</Text>
          </View>
          <Ionicons name="settings-outline" size={20} color="#6b7280" />
        </View>

        {!loadingWeeks && weeks.length >= 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
          >
            <View className="flex-row gap-2">
              {weeks.map((week) => {
                const isActive = week === selectedWeek;
                const label = weekLabels[week] ?? `Week ${week}`;
                return (
                  <Pressable
                    key={`week-${week}`}
                    onPress={() => setSelectedWeek(week)}
                    className={`rounded-full px-4 py-2 ${isActive ? 'bg-brand' : 'bg-white border border-line'}`}
                  >
                    <Text className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-ink'}`}>
                      {`Week ${week}`}
                    </Text>
                    <Text className={`text-[11px] ${isActive ? 'text-blue-100' : 'text-muted'}`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        <Card className="mt-5 px-5 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Text className="text-[18px]">🔥</Text>
            </View>
            <View>
              <Text className="text-[15px] font-semibold text-ink">{`${streak}-day streak`}</Text>
              <Text className="text-[13px] text-muted">Keep it up!</Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 px-5 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              Today’s Goal
            </Text>
            <Text className="text-[15px] font-semibold text-brand">{`${reviewCount} / ${goal}`}</Text>
          </View>
          <View className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <View
              className="h-2 rounded-full bg-brand"
              style={{ width: `${Math.min(100, Math.round((reviewCount / Math.max(goal, 1)) * 100))}%` }}
            />
          </View>
          <Text className="mt-2 text-[12px] text-muted">{`${dueCount} words due`}</Text>
          <Button
            className="mt-4"
            label="Start Review"
            onPress={() => router.push('/review')}
            rightIcon={<Ionicons name="arrow-forward" size={16} color="#fff" />}
          />
        </Card>

        <Pressable onPress={() => router.push('/lesson')} className="mt-4">
          <Card>
            <View className="flex-row items-center gap-2">
              <Ionicons name="book-outline" size={14} color="#4b5563" />
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                Lesson
              </Text>
            </View>
            <Text className="mt-2 text-[15px] font-semibold text-ink">{lessonTitle}</Text>
            <Text className="mt-1 text-[12px] text-muted">A‑G sentence framework</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View className={`rounded-full px-3 py-1 ${statusBg}`}>
              <Text className={`text-[11px] font-semibold ${statusText}`}>{statusLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/dialogue')} className="mt-4">
          <Card>
            <View className="flex-row items-center gap-2">
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#4b5563" />
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                Dialogue
              </Text>
            </View>
            <Text className="mt-2 text-[12px] text-muted">
              {dialogue?.scenario ? `At the ${dialogue.scenario}` : 'Scenario'}
            </Text>
            <Text className="mt-1 text-[15px] font-semibold text-ink">
              {dialogue?.title ?? 'No dialogue yet'}
            </Text>
            <View className="mt-3 flex-row items-center justify-end">
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
