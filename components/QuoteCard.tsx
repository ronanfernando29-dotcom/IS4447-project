/**
 * HabitTracker – QuoteCard.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Quote card layout and styling.
 *
 * Adapted from:
 * API Ninjas Quotes API (https://api-ninjas.com/api/quotes) for motivational quotes.
 * API key stored in .env file using EXPO_PUBLIC_ prefix — https://docs.expo.dev/guides/environment-variables/
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with fetch logic, error handling, and loading states
 * for the external API integration.
 *
 * 
 *
 * I understand and can explain all code in this file.
 */

import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function QuoteCard() {
  const { colors } = useTheme();
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY;
  console.log('API KEY:', API_KEY);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('https://api.api-ninjas.com/v1/quotes', {
        headers: { 'X-Api-Key': API_KEY || '' },
      });
      const data = await response.json();
      console.log('Quote response:', JSON.stringify(data));
      if (data && data[0]) {
        setQuote(data[0].quote);
        setAuthor(data[0].author);
      }
    } catch (e) {
      console.log('Quote error:', e);
      setError(true);
      setQuote('The secret of getting ahead is getting started.');
      setAuthor('Mark Twain');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="format-quote-open" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Daily Motivation</Text>
        <Pressable
          accessibilityLabel="Get new quote"
          accessibilityRole="button"
          onPress={fetchQuote}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <>
          <Text style={[styles.quote, { color: colors.text }]}>"{quote}"</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>— {author}</Text>
          {error ? (
            <Text style={[styles.offline, { color: colors.textSecondary }]}>
              Offline — shows default quote
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  loader: {
    paddingVertical: 12,
  },
  quote: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  author: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'right',
  },
  offline: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});