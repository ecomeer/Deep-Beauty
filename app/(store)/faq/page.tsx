import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة | Deep Beauty',
}

const faqs = [
  {
    q: 'كم تستغرق عملية التوصيل؟',
    a: 'داخل الكويت: ١–٢ يوم عمل. دول الخليج: ٣–٥ أيام عمل.',
  },
  {
    q: 'هل يمكنني إرجاع المنتج؟',
    a: 'نعم، نقبل الإرجاع خلال ١٤ يوماً من تاريخ الاستلام شرط أن يكون المنتج غير مستخدم وفي عبوته الأصلية.',
  },
  {
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'نقبل الدفع بـ KNET، Visa، Mastercard، والدفع عند الاستلام داخل الكويت.',
  },
  {
    q: 'هل منتجاتكم طبيعية؟',
    a: 'نعم، جميع منتجاتنا مصنوعة من مكونات طبيعية خالية من البارابين والمواد الكيميائية الضارة.',
  },
  {
    q: 'كيف أتتبع طلبي؟',
    a: 'بعد شحن طلبك ستصلك رسالة نصية برقم التتبع. يمكنك أيضاً تتبع طلبك من صفحة "تتبع الطلب" على موقعنا.',
  },
  {
    q: 'هل تشحنون خارج الكويت؟',
    a: 'نعم، نشحن إلى السعودية، الإمارات، قطر، البحرين، وعُمان.',
  },
  {
    q: 'كيف أتواصل مع خدمة العملاء؟',
    a: 'يمكنك التواصل معنا عبر البريد الإلكتروني أو واتساب المتاح على الموقع، وسنرد خلال ٢٤ ساعة.',
  },
  {
    q: 'هل يمكنني تعديل طلبي بعد تأكيده؟',
    a: 'يمكن تعديل الطلب خلال ساعتين من التأكيد فقط. بعد ذلك يدخل مرحلة التجهيز ولا يمكن تعديله.',
  },
]

export default function FAQPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1
        className="text-4xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}
      >
        الأسئلة الشائعة
      </h1>
      <p className="text-sm opacity-50 mb-10">إجابات على أكثر الأسئلة شيوعاً</p>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-2xl p-6"
            style={{ background: 'white', border: '1px solid var(--beige)' }}
          >
            <h2 className="font-bold mb-2 text-base" style={{ color: 'var(--primary)' }}>
              {faq.q}
            </h2>
            <p className="text-sm leading-7 opacity-80" style={{ color: 'var(--text-dark)' }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-12 rounded-2xl p-6 text-center"
        style={{ background: 'var(--beige)' }}
      >
        <p className="text-sm mb-3" style={{ color: 'var(--text-dark)' }}>
          لم تجد إجابة لسؤالك؟
        </p>
        <a
          href="mailto:contact@deepbeautykw.com"
          className="text-sm font-bold"
          style={{ color: 'var(--primary)' }}
        >
          تواصل معنا
        </a>
      </div>
    </main>
  )
}
