import { Link } from 'expo-router';
import { useState } from 'react';
import { ErrorBanner, Field, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { useAuth } from '@/store/authStore';

export default function SignIn() {
  const { signIn, busy, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Screen headerless>
      <Heading size={40}>Guildhall</Heading>
      <Txt muted>Sign in to enter your hall and rejoin the party.</Txt>
      <Panel>
        <ErrorBanner message={error} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <GoldButton label="Enter the hall" loading={busy} onPress={() => signIn({ email, password })} />
      </Panel>
      <Link href="/sign-up" accessibilityRole="link"><Txt bold>New here? Forge a character</Txt></Link>
    </Screen>
  );
}
