import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import {
  getContentProgress,
  getThemeProgress,
  getTodayPlan,
  listDialoguesByWeek,
  listLessonsByWeek,
} from '@/packages/services';
import type {
  ContentProgressDTO,
  DialogueSummaryDTO,
  LessonSummaryDTO,
  ProgressDTO,
} from '@/packages/services';
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
  const [weekOpen, setWeekOpen] = useState(false);
  const [themeProgress, setThemeProgress] = useState<{
    totalWords: number;
    reviewedTodayCount: number;
    dueCount: number;
  } | null>(null);
  const [sentenceProgress, setSentenceProgress] = useState<ContentProgressDTO | null>(null);
  const [dialogueProgress, setDialogueProgress] = useState<ContentProgressDTO | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getTodayPlan(),
      listLessonsByWeek(selectedWeek),
      listDialoguesByWeek(selectedWeek),
      getThemeProgress(selectedWeek),
      getContentProgress(selectedWeek, 'sentence'),
      getContentProgress(selectedWeek, 'dialogue'),
    ])
      .then(([plan, lessonRows, dialogueRows, themeProg, sentenceProg, dialogueProg]) => {
        setProgress(plan.progress);
        setLessons(lessonRows);
        setDialogues(dialogueRows);
        setThemeProgress(themeProg);
        setSentenceProgress(sentenceProg);
        setDialogueProgress(dialogueProg);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  const reviewCount = themeProgress?.reviewedTodayCount ?? 0;
  const goal = themeProgress?.totalWords ?? 0;
  const dueCount = themeProgress?.dueCount ?? 0;
  const streak = progress.streakCurrent;
  const sentenceLessons = lessons.filter((l) => l.kind === 'sentence');
  const themeLabel = weekLabels[selectedWeek] ?? `Week ${selectedWeek}`;
  const lessonTitle =
    sentenceLessons.length > 0 ? `Week ${selectedWeek}: ${themeLabel} A-G` : `Week ${selectedWeek}`;
  const getPill = (reviewed: number, total: number) => {
    if (total <= 0 || reviewed <= 0) {
      return { label: 'Not started', bg: 'bg-slate-100', text: 'text-slate-600' };
    }
    if (reviewed >= total) {
      return { label: 'Done today', bg: 'bg-green-100', text: 'text-green-700' };
    }
    return { label: 'In progress', bg: 'bg-amber-100', text: 'text-amber-700' };
  };

  const wordsPill = getPill(reviewCount, goal);
  const sentencePill = getPill(
    sentenceProgress?.reviewedTodayCount ?? 0,
    sentenceProgress?.totalCount ?? 0
  );
  const dialoguePill = getPill(
    dialogueProgress?.reviewedTodayCount ?? 0,
    dialogueProgress?.totalCount ?? 0
  );
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

        {!loadingWeeks && weeks.length >= 1 ? (
          <Card className="mt-4 px-5 py-4">
            <Pressable onPress={() => setWeekOpen((prev) => !prev)}>
              <View className="flex-row items-center justify-between">
                <View>
                  <View className="self-start rounded-full bg-blue-100 px-3 py-1">
                    <Text className="text-[11px] font-semibold uppercase tracking-widest text-brand">
                      Theme
                    </Text>
                  </View>
                  <Text className="mt-2 text-[15px] font-semibold text-ink">
                    {`Week ${selectedWeek}`}
                  </Text>
                  <Text className="mt-1 text-[12px] text-muted">
                    {weekLabels[selectedWeek] ?? `Week ${selectedWeek}`}
                  </Text>
                </View>
                <Ionicons
                  name={weekOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#9ca3af"
                />
              </View>
            </Pressable>

            {weekOpen ? (
              <View className="mt-4 border-t border-line pt-3">
                {weeks.map((week) => {
                  const isActive = week === selectedWeek;
                  return (
                    <Pressable
                      key={`week-option-${week}`}
                      onPress={() => {
                        setSelectedWeek(week);
                        setWeekOpen(false);
                      }}
                      className={`rounded-xl px-3 py-2 ${isActive ? 'bg-blue-50' : ''}`}
                    >
                      <Text className={`text-[13px] font-semibold ${isActive ? 'text-brand' : 'text-ink'}`}>
                        {`Week ${week}`}
                      </Text>
                      <Text className={`text-[12px] ${isActive ? 'text-brand' : 'text-muted'}`}>
                        {weekLabels[week] ?? `Week ${week}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </Card>
        ) : null}

        <Pressable onPress={() => router.push('/review')} className="mt-4">
          <Card className="px-5 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="grid-outline" size={14} color="#4b5563" />
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                Learn Words
              </Text>
            </View>
            <Text className="text-[15px] font-semibold text-brand">{`${reviewCount} / ${goal}`}</Text>
          </View>
          <View className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <View
              className="h-2 rounded-full bg-brand"
              style={{ width: `${Math.min(100, Math.round((reviewCount / Math.max(goal, 1)) * 100))}%` }}
            />
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <View className={`rounded-full px-3 py-1 ${wordsPill.bg}`}>
              <Text className={`text-[11px] font-semibold ${wordsPill.text}`}>
                {wordsPill.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/lesson')} className="mt-4">
          <Card>
            <View className="flex-row items-center gap-2">
              <Ionicons name="document-text-outline" size={14} color="#4b5563" />
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                Build Sentences
              </Text>
            </View>
            <Text className="mt-2 text-[15px] font-semibold text-ink">{lessonTitle}</Text>
            <Text className="mt-1 text-[12px] text-muted">A‑G sentence framework</Text>
            <View className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <View
                className="h-2 rounded-full bg-brand"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((sentenceProgress?.reviewedTodayCount ?? 0) /
                        Math.max(sentenceProgress?.totalCount ?? 0, 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </View>
            <Text className="mt-2 text-[12px] text-muted">
              {`${sentenceProgress?.reviewedTodayCount ?? 0} / ${sentenceProgress?.totalCount ?? 0} practiced today`}
            </Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View className={`rounded-full px-3 py-1 ${sentencePill.bg}`}>
              <Text className={`text-[11px] font-semibold ${sentencePill.text}`}>
                {sentencePill.label}
              </Text>
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
                Speak Dialogues
              </Text>
            </View>
            <Text className="mt-2 text-[12px] text-muted">
              {dialogue?.scenario ? `At the ${dialogue.scenario}` : 'Scenario'}
            </Text>
            <Text className="mt-1 text-[15px] font-semibold text-ink">
              {dialogue?.title ?? 'No dialogue yet'}
            </Text>
            <View className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <View
                className="h-2 rounded-full bg-brand"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((dialogueProgress?.reviewedTodayCount ?? 0) /
                        Math.max(dialogueProgress?.totalCount ?? 0, 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </View>
            <Text className="mt-2 text-[12px] text-muted">
              {`${dialogueProgress?.reviewedTodayCount ?? 0} / ${dialogueProgress?.totalCount ?? 0} practiced today`}
            </Text>
            <View className="mt-3 flex-row items-center justify-between">
              <View className={`rounded-full px-3 py-1 ${dialoguePill.bg}`}>
                <Text className={`text-[11px] font-semibold ${dialoguePill.text}`}>
                  {dialoguePill.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
