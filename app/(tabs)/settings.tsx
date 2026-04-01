import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="gap-4 rounded-[24px] bg-white p-5">
        <Text className="font-sans-extrabold text-3xl text-primary">Settings</Text>
        <View className="gap-1">
          <Text className="font-sans-semibold text-base text-text">Signed in as</Text>
          <Text className="font-sans-medium text-lg text-primary">
            {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id ?? 'Unknown user'}
          </Text>
        </View>
        <Text className="font-sans-regular text-sm leading-6 text-text">
          Your Clerk session is stored securely on-device with Expo Secure Store.
        </Text>
        <Pressable className="items-center rounded-[18px] bg-primary px-5 py-4" onPress={() => signOut()}>
          <Text className="font-sans-semibold text-base text-white">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

export default Settings
