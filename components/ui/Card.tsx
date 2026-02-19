import React from 'react';
import { View } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={`bg-card rounded-2xl px-5 py-4 ${className ?? ''}`}
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}
