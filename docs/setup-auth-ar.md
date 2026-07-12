# دليل تفعيل تسجيل العملاء والبريد الإلكتروني — Deep Beauty

هذا الدليل يشرح خطوة بخطوة كيف تفعّل: تسجيل الدخول بجوجل، وتأكيد البريد الإلكتروني، وإرسال رسائل الطلبات. كل الخطوات تتم من **لوحة تحكم Supabase** و**Google Cloud** و**Resend** — الكود جاهز ولا يحتاج تعديلاً.

> **مهم:** الكود في المشروع يعمل بالفعل — أزرار جوجل وصفحات التسجيل موجودة. سبب عدم عملها هو أن هذه الخدمات تحتاج تفعيلاً من حساباتك أنت.

---

## 1️⃣ تفعيل تسجيل الدخول بحساب Google

### الخطوة أ — إنشاء مفاتيح OAuth في Google Cloud

1. ادخل إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروعاً جديداً (أو استخدم مشروعاً موجوداً)
3. من القائمة: **APIs & Services → OAuth consent screen**
   - اختر **External** واملأ اسم التطبيق (Deep Beauty) وبريد الدعم
4. ثم: **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - نوع التطبيق: **Web application**
   - في **Authorized redirect URIs** أضف بالضبط:
     ```
     https://pmxbvbzdntlhxnftisek.supabase.co/auth/v1/callback
     ```
     (استبدل `pmxbvbzdntlhxnftisek` بمعرّف مشروعك في Supabase إن كان مختلفاً)
5. انسخ **Client ID** و **Client Secret**

### الخطوة ب — تفعيل المزوّد في Supabase

1. ادخل إلى [لوحة Supabase](https://supabase.com/dashboard) → مشروعك
2. **Authentication → Providers → Google**
3. فعّل المفتاح (Enable)، والصق **Client ID** و **Client Secret**
4. احفظ

### الخطوة ج — ضبط روابط الموقع في Supabase

1. **Authentication → URL Configuration**
2. **Site URL**: ضع دومينك الحقيقي، مثال: `https://www.deepbeautykw.com`
3. **Redirect URLs**: أضف:
   ```
   https://www.deepbeautykw.com/auth/callback
   https://www.deepbeautykw.com/**
   ```
   (وأثناء التطوير أضف أيضاً `http://localhost:3000/auth/callback`)

✅ بعد هذه الخطوات زر «الدخول بحساب Google» سيعمل مباشرة.

---

## 2️⃣ إصلاح تأكيد البريد الإلكتروني عند التسجيل

**المشكلة الحالية:** Supabase يرسل رسائل التأكيد من خادمه المجاني المحدود جداً (حوالي رسالتين بالساعة، وغالباً تصل للسبام). لذلك يظن العميل أن التسجيل «لا يعمل».

**لديك خياران:**

### الخيار أ (موصى به): ربط SMTP خارجي عبر Resend

1. أنشئ حساباً مجانياً في [resend.com](https://resend.com) (3000 رسالة شهرياً مجاناً)
2. من لوحة Resend: **Domains → Add Domain** وأضف دومينك (`deepbeautykw.com`) واتبع تعليمات إضافة سجلات DNS (تُضاف عند مزوّد الدومين)
3. من **API Keys** أنشئ مفتاحاً وانسخه
4. في لوحة Supabase: **Project Settings → Authentication → SMTP Settings** وفعّل **Custom SMTP**:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: (مفتاح API الذي نسخته)
   - Sender email: `noreply@deepbeautykw.com`
   - Sender name: `Deep Beauty`

### الخيار ب (مؤقت وسريع): تعطيل تأكيد البريد

1. **Authentication → Providers → Email**
2. عطّل **Confirm email**

⚠️ **المخاطرة:** أي شخص يستطيع التسجيل ببريد لا يملكه. مقبول مؤقتاً للانطلاق، لكن فعّل الخيار أ لاحقاً.

---

## 3️⃣ تفعيل رسائل الطلبات (تأكيد الطلب وتحديثات الحالة)

الكود جاهز في المشروع ويعمل تلقائياً فور إضافة مفتاح Resend إلى متغيرات البيئة في Vercel:

1. من لوحة Resend انسخ **API Key** (نفس مفتاح الخطوة السابقة يصلح)
2. في [Vercel](https://vercel.com) → مشروع deep-beauty → **Settings → Environment Variables** أضف:
   | المتغير | القيمة |
   |---|---|
   | `RESEND_API_KEY` | مفتاح Resend |
   | `EMAIL_FROM` | `Deep Beauty <orders@deepbeautykw.com>` |
3. أعد النشر (Redeploy)

بعدها تلقائياً:
- ✉️ العميل يستلم **تأكيد طلب** فور الشراء (إن أدخل بريده)
- ✉️ العميل يستلم **تحديث حالة** عند الضغط على «إعلام العميل» في لوحة التحكم
- ✉️ حملات **النشرة البريدية** من لوحة التحكم تُرسل فعلياً

> بدون المفتاح، الموقع يعمل طبيعياً والرسائل تُتخطى بصمت — لا يتعطل شيء.

---

## 4️⃣ تفعيل بوابة الدفع UPayments (كي نت + بطاقات + المحافظ الرقمية)

الكود جاهز في المشروع. UPayments بوابة كويتية مرخصة من البنك المركزي وتدعم KNET وVisa/Mastercard وApple Pay وGoogle Pay وSamsung Pay عبر صفحة دفع مستضافة.

### للتجربة فوراً (Sandbox)
1. في Vercel أضف المتغيرين:
   | المتغير | القيمة |
   |---|---|
   | `UPAYMENTS_TOKEN` | `jtest123` (توكن الاختبار الرسمي) |
   | `UPAYMENTS_API_URL` | `https://sandboxapi.upayments.com/api/v1` |
2. أعد النشر، ثم جرّب طلباً بالدفع الإلكتروني — ستُوجَّه لصفحة دفع UPayments التجريبية.
3. بطاقات الاختبار في: developers.upayments.com/reference/test-cards
   ⚠️ في وضع الاختبار تعمل KNET والبطاقات فقط (لا Apple/Google/Samsung Pay).

### للانتقال للإنتاج
1. تواصل مع UPayments للحصول على مفاتيح الإنتاج: **support@upayments.com** أو واتساب **+965 1809888** (يتطلب عقد تاجر)
2. استبدل `UPAYMENTS_TOKEN` بتوكن الإنتاج و`UPAYMENTS_API_URL` برابط الإنتاج الذي يعطونه لك
3. أعد النشر

> **ملاحظة:** بمجرد ضبط `UPAYMENTS_TOKEN` تصبح UPayments هي بوابة الدفع؛ ولو أزلته يعود النظام تلقائياً إلى MyFatoorah (إن كان `MYFATOORAH_TOKEN` مضبوطاً).

---

## 5️⃣ قائمة التحقق النهائية

- [ ] زر «الدخول بحساب Google» يفتح صفحة جوجل ويعود للموقع مسجلاً
- [ ] التسجيل ببريد جديد: تصل رسالة التأكيد خلال دقيقة (افحص السبام أول مرة)
- [ ] بعد تأكيد البريد: تسجيل الدخول يعمل ويظهر حساب العميل
- [ ] طلب تجريبي ببريدك: تصل رسالة «تأكيد طلبك»
- [ ] من لوحة الأدمن: «إعلام العميل» يرسل بريد تحديث الحالة ويفتح واتساب
- [ ] متغير `NEXT_PUBLIC_DEV_BYPASS` **غير موجود** (أو ليس `true`) في Vercel — وإلا فلوحة الأدمن مفتوحة للجميع! ⚠️
- [ ] طلب تجريبي بالدفع الإلكتروني يفتح صفحة UPayments، والدفع ببطاقة الاختبار يعيدك إلى صفحة «تم الطلب بنجاح» وحالة الطلب تتحول إلى «مؤكد/مدفوع»
