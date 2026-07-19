// Maps Supabase auth error messages to clear Arabic messages.
// Keyed by substring match on the (lowercased) English error text.
const AUTH_ERROR_MESSAGES: Array<[pattern: string, message: string]> = [
  ['email not confirmed', 'لم يتم تأكيد بريدك الإلكتروني بعد — افحصي بريدك (ومجلد السبام) واضغطي رابط التأكيد'],
  ['invalid login', 'البريد الإلكتروني أو كلمة المرور غير صحيحة'],
  ['user already registered', 'هذا البريد مسجّل مسبقاً — جرّبي تسجيل الدخول بدلاً من ذلك'],
  ['already been registered', 'هذا البريد مسجّل مسبقاً — جرّبي تسجيل الدخول بدلاً من ذلك'],
  ['provider is not enabled', 'تسجيل الدخول بحساب Google غير مفعّل حالياً — تواصلي معنا أو استخدمي البريد الإلكتروني'],
  ['unsupported provider', 'تسجيل الدخول بحساب Google غير مفعّل حالياً — تواصلي معنا أو استخدمي البريد الإلكتروني'],
  ['rate limit', 'تم تجاوز حد المحاولات مؤقتاً — انتظري بضع دقائق ثم حاولي مجدداً'],
  ['security purposes', 'الرجاء الانتظار قليلاً قبل طلب رابط آخر'],
  ['password should be at least', 'كلمة المرور قصيرة جداً — يجب ألا تقل عن 6 أحرف'],
  ['invalid email', 'صيغة البريد الإلكتروني غير صحيحة'],
  ['network', 'تعذّر الاتصال بالخادم — تأكدي من اتصالك بالإنترنت'],
]

export function translateAuthError(
  error: { message?: string } | null | undefined,
  fallback: string
): string {
  const msg = error?.message?.toLowerCase() ?? ''
  for (const [pattern, message] of AUTH_ERROR_MESSAGES) {
    if (msg.includes(pattern)) return message
  }
  return fallback
}
