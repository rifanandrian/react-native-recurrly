import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';
import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

const Index = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={isSignedIn ? '/(tabs)' : '/(auth)/sign-in'} />;
};

export default Index;
