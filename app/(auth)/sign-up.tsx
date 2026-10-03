import { Link } from 'expo-router';
import { useState } from 'react';
import { ErrorBanner, Field, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { useAuth } from '@/store/authStore';

export default function SignUp() {
  const { signUp, busy, error } = useAuth();
  const [displayName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Screen headerless>
      <Heading size={34}>Join the guild</Heading>
      <Txt muted>Create your account. You will choose your class next.</Txt>
      <Panel>
        <ErrorBanner message={error} />
        <Field label="Display name" value={displayName} onChangeText={setName} autoCapitalize="words" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <GoldButton label="Create account" loading={busy} onPress={() => signUp({ email, password, displayName })} />
      </Panel>
      <Link href="/sign-in" accessibilityRole="link"><Txt bold>Already enrolled? Sign in</Txt></Link>
    </Screen>
  );
}
