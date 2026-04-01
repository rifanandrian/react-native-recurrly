import {
  normalizeEmailAddress,
  parseClerkError,
  validateEmailAddress,
  validatePassword,
  validatePasswordConfirmation,
  validateVerificationCode,
  type AuthFieldErrors,
} from '@/lib/auth';
import { useSignIn } from '@clerk/expo/legacy';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

type SignInStage = 'password' | 'mfa' | 'reset-request' | 'reset-verify';

const SignIn = () => {
  const { isLoaded, setActive, signIn } = useSignIn();
  const router = useRouter();
  const [stage, setStage] = useState<SignInStage>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = useMemo(() => normalizeEmailAddress(email), [email]);

  const resetTransientState = () => {
    setFieldErrors({});
    setFormError('');
    setNotice('');
  };

  const applyError = (error: unknown, fallback: string) => {
    const parsed = parseClerkError(error, fallback);
    setFieldErrors((current) => ({ ...current, ...parsed.fieldErrors }));
    setFormError(parsed.formError);
  };

  const finishSignIn = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setFormError('We could not finish signing you in.');
      return;
    }

    await setActive({ session: sessionId });
    router.replace('/(tabs)');
  };

  const handlePasswordSignIn = async () => {
    const nextErrors = {
      email: validateEmailAddress(email),
      password: validatePassword(password),
    };

    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.email || nextErrors.password) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      const attempt = await signIn.create({
        identifier: normalizedEmail,
        password,
      });

      if (attempt.status === 'complete') {
        await finishSignIn(attempt.createdSessionId);
      } else if (attempt.status === 'needs_second_factor') {
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        setStage('mfa');
        setNotice(`We sent a 6-digit code to ${normalizedEmail}.`);
      } else {
        setFormError('We need one more verification step to finish signing you in.');
      }
    } catch (error) {
      applyError(error, 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySecondFactor = async () => {
    const nextErrors = { code: validateVerificationCode(code) };
    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.code) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (attempt.status === 'complete') {
        await finishSignIn(attempt.createdSessionId);
      } else {
        setFormError('That code was accepted, but sign-in is not complete yet.');
      }
    } catch (error) {
      applyError(error, 'Unable to verify your sign-in code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartReset = async () => {
    const nextErrors = { email: validateEmailAddress(email) };
    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.email) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: normalizedEmail,
      });
      setStage('reset-verify');
      setCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setNotice(`We sent a password reset code to ${normalizedEmail}.`);
    } catch (error) {
      applyError(error, 'Unable to start password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async () => {
    const nextErrors = {
      code: validateVerificationCode(code),
      newPassword: validatePassword(newPassword),
      confirmNewPassword: validatePasswordConfirmation(newPassword, confirmNewPassword),
    };
    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.code || nextErrors.newPassword || nextErrors.confirmNewPassword) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword,
      });

      if (attempt.status === 'complete') {
        await finishSignIn(attempt.createdSessionId);
      } else {
        setFormError('Password updated, but sign-in still needs another step.');
      }
    } catch (error) {
      applyError(error, 'Unable to reset your password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      if (stage === 'mfa') {
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        setNotice(`We sent a fresh sign-in code to ${normalizedEmail}.`);
      } else if (stage === 'reset-verify') {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: normalizedEmail,
        });
        setNotice(`We sent a fresh password reset code to ${normalizedEmail}.`);
      }
    } catch (error) {
      applyError(error, 'Unable to resend the code right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    stage === 'password'
      ? 'Welcome back'
      : stage === 'mfa'
        ? 'Check your email'
        : stage === 'reset-request'
          ? 'Reset your password'
          : 'Create a new password';

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.logoRow}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoLetter}>R</Text>
                </View>
                <View>
                  <Text style={styles.logoWordmark}>Recurrly</Text>
                  <Text style={styles.logoTagline}>SMART BILLING</Text>
                </View>
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {stage === 'password' && 'Sign in to continue managing your subscriptions'}
                {stage === 'mfa' && 'Enter the email code we sent to confirm it is you'}
                {stage === 'reset-request' && 'We will send you a secure code to reset your password'}
                {stage === 'reset-verify' && 'Choose a new password and enter the code from your email'}
              </Text>

              <View style={styles.card}>
                {(stage === 'password' || stage === 'reset-request') && (
                  <>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#6B7280"
                      returnKeyType="next"
                      style={[styles.input, fieldErrors.email && styles.inputError]}
                      value={email}
                    />
                    {fieldErrors.email ? <Text style={styles.error}>{fieldErrors.email}</Text> : null}
                  </>
                )}

                {stage === 'password' && (
                  <>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#6B7280"
                      returnKeyType="done"
                      secureTextEntry
                      style={[styles.input, fieldErrors.password && styles.inputError]}
                      value={password}
                    />
                    {fieldErrors.password ? <Text style={styles.error}>{fieldErrors.password}</Text> : null}
                  </>
                )}

                {(stage === 'mfa' || stage === 'reset-verify') && (
                  <>
                    <Text style={styles.label}>Verification code</Text>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter the 6-digit code"
                      placeholderTextColor="#6B7280"
                      returnKeyType="done"
                      style={[styles.input, fieldErrors.code && styles.inputError]}
                      value={code}
                    />
                    {fieldErrors.code ? <Text style={styles.error}>{fieldErrors.code}</Text> : null}
                  </>
                )}

                {stage === 'reset-verify' && (
                  <>
                    <Text style={styles.label}>New password</Text>
                    <TextInput
                      onChangeText={setNewPassword}
                      placeholder="Create a new password"
                      placeholderTextColor="#6B7280"
                      returnKeyType="next"
                      secureTextEntry
                      style={[styles.input, fieldErrors.newPassword && styles.inputError]}
                      value={newPassword}
                    />
                    {fieldErrors.newPassword ? <Text style={styles.error}>{fieldErrors.newPassword}</Text> : null}

                    <Text style={styles.label}>Confirm new password</Text>
                    <TextInput
                      onChangeText={setConfirmNewPassword}
                      placeholder="Re-enter your new password"
                      placeholderTextColor="#6B7280"
                      returnKeyType="done"
                      secureTextEntry
                      style={[styles.input, fieldErrors.confirmNewPassword && styles.inputError]}
                      value={confirmNewPassword}
                    />
                    {fieldErrors.confirmNewPassword ? <Text style={styles.error}>{fieldErrors.confirmNewPassword}</Text> : null}
                  </>
                )}

                {notice ? <Text style={styles.notice}>{notice}</Text> : null}
                {formError ? <Text style={styles.error}>{formError}</Text> : null}

                {stage === 'password' && (
                  <Pressable onPress={handlePasswordSignIn} style={[styles.button, (!email || !password || isSubmitting) && styles.buttonDisabled]}>
                    <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
                  </Pressable>
                )}

                {stage === 'mfa' && (
                  <>
                    <Pressable onPress={handleVerifySecondFactor} style={[styles.button, (!code || isSubmitting) && styles.buttonDisabled]}>
                      <Text style={styles.buttonText}>{isSubmitting ? 'Verifying...' : 'Verify sign in'}</Text>
                    </Pressable>
                    <Pressable onPress={handleResendCode}>
                      <Text style={styles.linkText}>Resend code</Text>
                    </Pressable>
                  </>
                )}

                {stage === 'reset-request' && (
                  <>
                    <Pressable onPress={handleStartReset} style={[styles.button, (!email || isSubmitting) && styles.buttonDisabled]}>
                      <Text style={styles.buttonText}>{isSubmitting ? 'Sending code...' : 'Send reset code'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setStage('password')}>
                      <Text style={styles.linkText}>Back to sign in</Text>
                    </Pressable>
                  </>
                )}

                {stage === 'reset-verify' && (
                  <>
                    <Pressable
                      onPress={handleCompleteReset}
                      style={[styles.button, (!code || !newPassword || !confirmNewPassword || isSubmitting) && styles.buttonDisabled]}
                    >
                      <Text style={styles.buttonText}>{isSubmitting ? 'Updating password...' : 'Update password'}</Text>
                    </Pressable>
                    <Pressable onPress={handleResendCode}>
                      <Text style={styles.linkText}>Resend reset code</Text>
                    </Pressable>
                  </>
                )}

                {stage === 'password' ? (
                  <Pressable onPress={() => setStage('reset-request')}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </Pressable>
                ) : null}

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>New to Recurrly? </Text>
                  <Link href="/(auth)/sign-up" style={styles.footerLink}>Create account</Link>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9E3' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 56 },
  logoBox: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#EA7A53', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#FFF9E3', fontFamily: 'sans-extrabold', fontSize: 28 },
  logoWordmark: { color: '#081126', fontFamily: 'sans-extrabold', fontSize: 28 },
  logoTagline: { color: '#4B5563', fontFamily: 'sans-medium', fontSize: 12 },
  title: { color: '#081126', fontFamily: 'sans-bold', fontSize: 34, textAlign: 'center' },
  subtitle: { color: '#4B5563', fontFamily: 'sans-medium', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: '#FFF8E7', borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, borderRadius: 20, padding: 20, gap: 10 },
  label: { color: '#081126', fontFamily: 'sans-semibold', fontSize: 14, marginTop: 4 },
  input: { backgroundColor: '#FFF9E3', borderColor: 'rgba(0,0,0,0.15)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#081126', fontFamily: 'sans-medium', fontSize: 16 },
  inputError: { borderColor: '#DC2626' },
  error: { color: '#DC2626', fontFamily: 'sans-medium', fontSize: 12, lineHeight: 18 },
  notice: { color: '#EA7A53', fontFamily: 'sans-medium', fontSize: 12, lineHeight: 18 },
  button: { marginTop: 10, backgroundColor: '#EA7A53', borderRadius: 14, alignItems: 'center', paddingVertical: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#081126', fontFamily: 'sans-bold', fontSize: 16 },
  linkText: { color: '#EA7A53', fontFamily: 'sans-semibold', fontSize: 14, textAlign: 'center', marginTop: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  footerText: { color: '#4B5563', fontFamily: 'sans-medium', fontSize: 14 },
  footerLink: { color: '#EA7A53', fontFamily: 'sans-bold', fontSize: 14 },
});

export default SignIn;
