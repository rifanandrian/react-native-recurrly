import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  notice?: ReactNode;
};

const trustSignals = ['Private sessions', 'Secure recovery', 'Fast setup'];

const AuthShell = ({ title, subtitle, children, footer, notice }: AuthShellProps) => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        bounces={false}
        className="flex-1 bg-background"
        contentContainerClassName="px-5 pb-10 pt-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 items-center">
          <View className="mb-7 flex-row items-center gap-3">
            <View className="size-14 items-center justify-center rounded-2xl bg-accent">
              <Text className="text-2xl font-sans-extrabold text-background">R</Text>
            </View>

            <View>
              <Text className="text-3xl font-sans-extrabold text-primary">Recurrly</Text>
              <Text className="-mt-1 text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
                Smart billing clarity
              </Text>
            </View>
          </View>

          <Text className="text-3xl font-sans-bold text-primary">{title}</Text>
          <Text className="mt-2 max-w-[320px] text-center text-base font-sans-medium text-muted-foreground">
            {subtitle}
          </Text>
        </View>

        <View className="mt-8 rounded-3xl border border-border bg-card p-5">{children}</View>

        {notice}

        <View className="mt-6 flex-row flex-wrap justify-center gap-2">
          {trustSignals.map((item) => (
            <View className="rounded-full border border-border bg-background px-4 py-2" key={item}>
              <Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
                {item}
              </Text>
            </View>
          ))}
        </View>

        {footer}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthShell;
