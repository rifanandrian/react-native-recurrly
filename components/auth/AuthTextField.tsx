import { clsx } from 'clsx';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  editable?: boolean;
};

const AuthTextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  autoComplete,
  textContentType,
  rightActionLabel,
  onRightActionPress,
  editable = true,
}: AuthTextFieldProps) => {
  return (
    <View className="auth-field">
      <View className="flex-row items-center justify-between">
        <Text className="auth-label">{label}</Text>
        {rightActionLabel && onRightActionPress ? (
          <Pressable onPress={onRightActionPress}>
            <Text className="text-sm font-sans-semibold text-accent">{rightActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        className={clsx(
          'flex-row items-center rounded-2xl border bg-background px-4',
          error ? 'border-destructive' : 'border-border',
        )}
      >
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          className="flex-1 py-4 text-base font-sans-medium text-primary"
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0, 0, 0, 0.45)"
          secureTextEntry={secureTextEntry}
          selectionColor="#ea7a53"
          textContentType={textContentType}
          value={value}
        />
      </View>

      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
};

export default AuthTextField;
