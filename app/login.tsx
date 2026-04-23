/**
 * HabitTracker – login.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Login/register screen layout and form design.
 * Logo made using Canva
 *
 * Adapted from:
 * IS4447 Lab workspace - FormField, PrimaryButton components.
 * Drizzle ORM for user queries — https://orm.drizzle.team/docs/select
 * React Context API — https://react.dev/reference/react/createContext
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with building login/register screen and session
 * management via AppContext.
 *
 * 
 *
 * I understand and can explain all code in this file.
 */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from './_layout';

export default function LoginScreen() {
  const router = useRouter();
  const context = useContext(AppContext);
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  if (!context) return null;
  const { setUserId } = context;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.trim().toLowerCase()));

    if (user.length === 0 || user[0].passwordHash !== password) {
      Alert.alert('Error', 'Invalid username or password.');
      return;
    }

    setUserId(user[0].id);
    router.replace('/(tabs)');
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters.');
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.trim().toLowerCase()));

    if (existing.length > 0) {
      Alert.alert('Error', 'Username already taken.');
      return;
    }

    await db.insert(usersTable).values({
      username: username.trim().toLowerCase(),
      passwordHash: password,
      createdAt: new Date().toISOString(),
    });

    const newUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.trim().toLowerCase()));

    if (newUser.length > 0) {
      setUserId(newUser[0].id);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Image
          source={require('@/assets/images/Hab.png')}
          style={styles.logo}
          accessibilityLabel="HabitBud logo"
        />
        <Text style={[styles.appName, { color: colors.primary }]}>HabitBud</Text>
        <ScreenHeader
          title={isRegistering ? 'Create Account' : 'Welcome Back'}
          subtitle={isRegistering ? 'Sign up to start tracking' : 'Log in to continue'}
        />

        <View style={styles.form}>
          <FormField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
          />
        </View>

        <PrimaryButton
          label={isRegistering ? 'Register' : 'Login'}
          onPress={isRegistering ? handleRegister : handleLogin}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <PrimaryButton
            label={isRegistering ? 'Login' : 'Register'}
            variant="secondary"
            compact
            onPress={() => setIsRegistering(!isRegistering)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  form: {
    marginBottom: 8,
    marginTop: 16,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
  },
  logo: {
    alignSelf: 'center',
    height: 120,
    marginBottom: 12,
    resizeMode: 'cover',
    width: 120,
    borderRadius: 60,
  },
});