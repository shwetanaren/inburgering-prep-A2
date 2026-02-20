import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import { getLesson, recordContentReview, setLessonProgress } from '@/packages/services';
import type { LessonDTO, SentenceLessonPayloadDTO, VocabLessonPayloadDTO } from '@/packages/services';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isOffline } = useOffline();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getLesson(id)
      .then((data) => {
        setLesson(data);
        if (data?.progress?.status !== 'done') {
          setJustCompleted(false);
        }
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onComplete = async () => {
    if (!lesson) return;
    setJustCompleted(true);
    await setLessonProgress(lesson.id, 'done');
    if (lesson.kind === 'sentence') {
      await recordContentReview(lesson.id, 'sentence', 'good');
    }
    load();
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading lesson" description="Fetching lesson details." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load lesson"
          description="Please try again."
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <EmptyState title="Lesson missing" description="We couldn’t find this lesson." />
      </Screen>
    );
  }

  const isSentence = lesson.kind === 'sentence';
  const sentencePayload = lesson.payload as SentenceLessonPayloadDTO;
  const vocabPayload = lesson.payload as VocabLessonPayloadDTO;

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5 pb-8">
        <View className="mt-2 flex-row items-center gap-2">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#2f6cf6" />
          </Pressable>
          <Text className="text-base font-semibold text-ink">{lesson.title}</Text>
        </View>

        {isSentence ? (
          <View className="mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-brand">
              Pattern {sentencePayload.patternCode}
            </Text>
          <Text className="mt-2 text-xl font-semibold text-ink">
            {sentencePayload.patternTitle}
          </Text>
          {sentencePayload.patternTitleEn ? (
            <Text className="mt-1 text-sm text-muted">{sentencePayload.patternTitleEn}</Text>
          ) : null}
          <Text className="mt-2 text-sm text-muted">{sentencePayload.patternDesc}</Text>
          {sentencePayload.patternDescEn ? (
            <Text className="mt-1 text-sm text-muted">{sentencePayload.patternDescEn}</Text>
          ) : null}

            <Card className="mt-5">
              <Text className="text-sm font-semibold text-ink">Example</Text>
              <Text className="mt-2 text-base text-ink">{sentencePayload.example.nl}</Text>
              <Text className="mt-1 text-xs text-muted">{sentencePayload.example.en}</Text>
            </Card>

            <Text className="mt-6 text-sm font-semibold text-ink">Practice sentences</Text>
            {sentencePayload.sentences.map((line, idx) => (
              <Card key={`${line.nl}-${idx}`} className="mt-3">
                <Text className="text-base text-ink">{line.nl}</Text>
                <Text className="mt-1 text-xs text-muted">{line.en}</Text>
              </Card>
            ))}
          </View>
        ) : (
          <View className="mt-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-brand">
              Vocabulary
            </Text>
            <Text className="mt-2 text-xl font-semibold text-ink">Word list</Text>
            <Text className="mt-2 text-sm text-muted">
              {vocabPayload.introEn ?? 'Practice your vocabulary for the week.'}
            </Text>
            {lesson.words.map((word) => (
              <Card key={word.id} className="mt-3">
                <Text className="text-base font-semibold text-ink">
                  {`${word.article ?? ''} ${word.lemma}`.trim()}
                </Text>
                <Text className="mt-1 text-xs text-muted">{word.translation}</Text>
              </Card>
            ))}
          </View>
        )}

        <View className="mt-6">
          <Button
            className="mt-3"
            variant={lesson.progress?.status === 'done' || justCompleted ? 'success' : 'secondary'}
            label={lesson.progress?.status === 'done' || justCompleted ? 'Completed' : 'Mark Complete'}
            onPress={lesson.progress?.status === 'done' ? undefined : onComplete}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
