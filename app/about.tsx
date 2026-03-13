import React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SOURCE_URL = 'https://github.com/shwetanaren/inburgering-prep-A2';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView className="flex-1 px-5 pb-8">
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={20} color="#2f6cf6" />
            <Text className="text-[17px] font-semibold text-ink">About this app</Text>
          </View>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#6b7280" />
          </Pressable>
        </View>

        <Card className="mt-5 px-5 py-5">
          <Text className="text-[22px] font-semibold leading-7 text-ink">
            Build Dutch sentences with more confidence.
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-muted">
            A free A2 learning app focused on the hardest part of the journey: turning vocabulary
            into real sentences you can use.
          </Text>
        </Card>

        <Card className="mt-4 px-5 py-5">
          <View className="flex-row items-center gap-2">
            <Ionicons name="layers-outline" size={18} color="#2f6cf6" />
            <Text className="text-[14px] font-semibold text-ink">What is included</Text>
          </View>

          <View className="mt-4 gap-3">
            <View className="flex-row gap-3">
              <Ionicons name="checkmark-circle-outline" size={18} color="#2f6cf6" />
              <Text className="flex-1 text-[14px] leading-6 text-muted">
                10 practical themes for learning and practicing locally
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Ionicons name="checkmark-circle-outline" size={18} color="#2f6cf6" />
              <Text className="flex-1 text-[14px] leading-6 text-muted">
                Pure learning with words, sentence patterns, and short conversations
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Ionicons name="checkmark-circle-outline" size={18} color="#2f6cf6" />
              <Text className="flex-1 text-[14px] leading-6 text-muted">
                No sign-ups and no personal data stored by this app
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mt-4 px-5 py-5">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles-outline" size={18} color="#2f6cf6" />
            <Text className="text-[14px] font-semibold text-ink">Release note</Text>
          </View>
          <Text className="mt-3 text-[14px] leading-6 text-muted">
            This free public release was created by Shweta Narendernath in collaboration with AI.
            A separate paid version, tuned by learning levels, is planned as a different app.
          </Text>
          <Pressable
            className="mt-4 self-start rounded-full border border-line bg-white px-4 py-2"
            onPress={() => Linking.openURL(SOURCE_URL)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="open-outline" size={16} color="#2f6cf6" />
              <Text className="text-[13px] font-semibold text-brand">View project page</Text>
            </View>
          </Pressable>
        </Card>

        <Button className="mt-6" label="Close" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
