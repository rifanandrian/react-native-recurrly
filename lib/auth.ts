export type AuthFieldName =
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'code'
  | 'newPassword'
  | 'confirmNewPassword';

export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

type ClerkLikeIssue = {
  code?: string;
  longMessage?: string;
  message?: string;
  meta?: {
    paramName?: string;
    name?: string;
  };
};

type ClerkLikeError = {
  errors?: ClerkLikeIssue[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

const clerkFieldMap: Record<string, AuthFieldName> = {
  code: 'code',
  emailAddress: 'email',
  email_address: 'email',
  identifier: 'email',
  password: 'password',
};

export const normalizeEmailAddress = (value: string) => value.trim().toLowerCase();

export const validateEmailAddress = (value: string) => {
  const normalizedEmail = normalizeEmailAddress(value);

  if (!normalizedEmail) {
    return 'Enter your email address.';
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return 'Enter a valid email address.';
  }

  return '';
};

export const getPasswordChecklist = (value: string) => [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    isValid: value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: 'One uppercase letter',
    isValid: /[A-Z]/.test(value),
  },
  {
    label: 'One lowercase letter',
    isValid: /[a-z]/.test(value),
  },
  {
    label: 'One number',
    isValid: /\d/.test(value),
  },
];

export const validatePassword = (value: string) => {
  if (!value) {
    return 'Enter your password.';
  }

  const checklist = getPasswordChecklist(value);

  if (checklist.every((item) => item.isValid)) {
    return '';
  }

  return 'Use 8+ characters with uppercase, lowercase, and a number.';
};

export const validatePasswordConfirmation = (password: string, confirmation: string) => {
  if (!confirmation) {
    return 'Re-enter your password.';
  }

  if (password !== confirmation) {
    return 'Passwords do not match.';
  }

  return '';
};

export const validateVerificationCode = (value: string) => {
  const sanitizedValue = value.trim();

  if (!sanitizedValue) {
    return 'Enter the verification code.';
  }

  if (!/^\d{6}$/.test(sanitizedValue)) {
    return 'Enter the 6-digit code sent to your email.';
  }

  return '';
};

export const parseClerkError = (
  error: unknown,
  fallbackMessage: string,
): { formError: string; fieldErrors: AuthFieldErrors } => {
  const issues = (error as ClerkLikeError)?.errors ?? [];
  const fieldErrors: AuthFieldErrors = {};

  issues.forEach((issue) => {
    const rawField = issue.meta?.paramName ?? issue.meta?.name ?? '';
    const field = clerkFieldMap[rawField];

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.longMessage ?? issue.message ?? fallbackMessage;
    }
  });

  return {
    formError: issues[0]?.longMessage ?? issues[0]?.message ?? fallbackMessage,
    fieldErrors,
  };
};
