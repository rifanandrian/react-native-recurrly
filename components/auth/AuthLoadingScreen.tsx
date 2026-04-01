import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AuthLoadingScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 size-16 items-center justify-center rounded-2xl bg-accent">
          <Text className="text-3xl font-sans-extrabold text-background">R</Text>
        </View>

        <Text className="text-2xl font-sans-bold text-primary">Recurrly</Text>
        <Text className="mt-2 text-center text-sm font-sans-medium text-muted-foreground">
          Preparing your subscription workspace
        </Text>

        <ActivityIndicator className="mt-6" color="#ea7a53" />
      </View>
    </SafeAreaView>
  );
};

export default AuthLoadingScreen;
