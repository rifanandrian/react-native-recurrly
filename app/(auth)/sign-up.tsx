import {
  getPasswordChecklist,
  normalizeEmailAddress,
  parseClerkError,
  validateEmailAddress,
  validatePassword,
  validatePasswordConfirmation,
  validateVerificationCode,
  type AuthFieldErrors,
} from '@/lib/auth';
import { useSignUp } from '@clerk/expo/legacy';
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

const SignUp = () => {
  const { isLoaded, setActive, signUp } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const normalizedEmail = useMemo(() => normalizeEmailAddress(email), [email]);
  const checklist = useMemo(() => getPasswordChecklist(password), [password]);

  const applyError = (error: unknown, fallback: string) => {
    const parsed = parseClerkError(error, fallback);
    setFieldErrors((current) => ({ ...current, ...parsed.fieldErrors }));
    setFormError(parsed.formError);
  };

  const resetTransientState = () => {
    setFieldErrors({});
    setFormError('');
    setNotice('');
  };

  const finishSignUp = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setFormError('We could not finish setting up your account.');
      return;
    }

    await setActive({ session: sessionId });
    router.replace('/(tabs)');
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    const nextErrors = {
      email: validateEmailAddress(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };
    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      await signUp.create({ emailAddress: normalizedEmail, password });
      setPendingVerification(true);
      setCode('');
      setNotice(`We sent a 6-digit verification code to ${normalizedEmail}.`);
    } catch (error) {
      applyError(error, 'Unable to create your account right now.');
      setIsSubmitting(false);
      return;
    }

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (error) {
      applyError(error, 'We created your account, but could not send the verification code yet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (isSubmitting) {
      return;
    }

    const nextErrors = { code: validateVerificationCode(code) };
    setFieldErrors(nextErrors);
    if (!isLoaded || nextErrors.code) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete') {
        await finishSignUp(attempt.createdSessionId);
      } else {
        setFormError('Your email is verified, but account setup is not complete yet.');
      }
    } catch (error) {
      applyError(error, 'Unable to verify your email right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (isSubmitting || !isLoaded) {
      return;
    }

    resetTransientState();
    setIsSubmitting(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setNotice(`We sent a fresh verification code to ${normalizedEmail}.`);
    } catch (error) {
      applyError(error, 'Unable to resend your verification code right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

              <Text style={styles.title}>{pendingVerification ? 'Verify your email' : 'Create account'}</Text>
              <Text style={styles.subtitle}>
                {pendingVerification
                  ? 'Enter the email code we sent to finish setting up your account'
                  : 'Create your account to start managing your subscriptions'}
              </Text>

              <View style={styles.card}>
                {!pendingVerification ? (
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

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      onChangeText={setPassword}
                      placeholder="Create a password"
                      placeholderTextColor="#6B7280"
                      returnKeyType="next"
                      secureTextEntry
                      style={[styles.input, fieldErrors.password && styles.inputError]}
                      value={password}
                    />
                    {fieldErrors.password ? <Text style={styles.error}>{fieldErrors.password}</Text> : null}

                    <View style={styles.checklist}>
                      {checklist.map((item) => (
                        <Text key={item.label} style={[styles.checklistItem, item.isValid && styles.checklistItemValid]}>
                          {item.isValid ? 'Done' : 'Need'}: {item.label}
                        </Text>
                      ))}
                    </View>

                    <Text style={styles.label}>Confirm password</Text>
                    <TextInput
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#6B7280"
                      returnKeyType="done"
                      secureTextEntry
                      style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                      value={confirmPassword}
                    />
                    {fieldErrors.confirmPassword ? <Text style={styles.error}>{fieldErrors.confirmPassword}</Text> : null}
                  </>
                ) : (
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

                {notice ? <Text style={styles.notice}>{notice}</Text> : null}
                {formError ? <Text style={styles.error}>{formError}</Text> : null}

                <Pressable
                  disabled={
                    pendingVerification
                      ? !code || isSubmitting
                      : !email || !password || !confirmPassword || isSubmitting
                  }
                  onPress={pendingVerification ? handleVerifyEmail : handleCreateAccount}
                  style={[
                    styles.button,
                    (
                      pendingVerification
                        ? !code || isSubmitting
                        : !email || !password || !confirmPassword || isSubmitting
                    ) && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting
                      ? pendingVerification
                        ? 'Verifying...'
                        : 'Creating account...'
                      : pendingVerification
                        ? 'Verify email'
                        : 'Create account'}
                  </Text>
                </Pressable>

                {pendingVerification ? (
                  <Pressable disabled={isSubmitting} onPress={handleResendCode}>
                    <Text style={styles.linkText}>Resend code</Text>
                  </Pressable>
                ) : null}

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Link href="/(auth)/sign-in" style={styles.footerLink}>Sign in</Link>
                </View>

                <View nativeID="clerk-captcha" style={styles.hiddenCaptcha} />
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
  checklist: { gap: 4 },
  checklistItem: { color: '#4B5563', fontFamily: 'sans-medium', fontSize: 12, lineHeight: 18 },
  checklistItemValid: { color: '#16A34A' },
  hiddenCaptcha: { width: 0, height: 0, opacity: 0 },
});

export default SignUp;
