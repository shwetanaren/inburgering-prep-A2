import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useOffline } from '@/components/useOffline';
import { getDialogue, listDialoguesByWeek } from '@/packages/services';
import type { DialogueDTO } from '@/packages/services';
import { useRouter } from 'expo-router';
import { useSelectedWeek } from '@/components/WeekContext';

const WEEK = 1;

export default function DialogueScreen() {
  const { isOffline } = useOffline();
  const router = useRouter();
  const { selectedWeek } = useSelectedWeek();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogue, setDialogue] = useState<DialogueDTO | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaries = await listDialoguesByWeek(selectedWeek);
      const first = summaries[0];
      if (!first) {
        setDialogue(null);
      } else {
        const full = await getDialogue(first.id);
        setDialogue(full);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <LoadingState title="Loading dialogue" description="Fetching the scenario." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load dialogue"
          description="Please try again."
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (!dialogue) {
    return (
      <Screen>
        <EmptyState title="No dialogue yet" description="Check back later." />
      </Screen>
    );
  }

  return (
    <Screen>
      <OfflineBanner visible={isOffline} />
      <ScrollView className="flex-1 px-5 pb-6">
        <View className="mt-2 flex-row items-center gap-2">
          <Pressable onPress={() => router.push('/')}>
            <Ionicons name="chevron-back" size={20} color="#2f6cf6" />
          </Pressable>
          <Text className="text-[15px] font-semibold text-ink">{dialogue.title}</Text>
        </View>

        <View className="mt-4 items-center">
          <View className="rounded-full bg-slate-200 px-4 py-2">
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {dialogue.scenario}
            </Text>
          </View>
        </View>

        {dialogue.lines.map((line, idx) => {
          const isUser = idx % 2 === 1;
          return (
            <View key={`${line.speaker}-${idx}`} className="mt-4">
              <Text className="text-[11px] text-muted">{line.speaker}</Text>
              <View
                className={`mt-2 max-w-[78%] rounded-2xl px-4 py-3 ${
                  isUser ? 'self-end bg-brand' : 'self-start bg-white'
                }`}
                style={
                  isUser
                    ? undefined
                    : {
                        shadowColor: '#0F172A',
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 2,
                      }
                }
              >
                <Text className={`text-[14px] ${isUser ? 'text-white' : 'text-ink'}`}>
                  {line.nl}
                </Text>
                <Text
                  className={`mt-1 text-[12px] ${isUser ? 'text-blue-100' : 'text-muted'}`}
                >
                  {line.en}
                </Text>
              </View>
            </View>
          );
        })}

        <Button className="mt-8" label="Finish Practice" onPress={() => {}} />
      </ScrollView>
    </Screen>
  );
}
