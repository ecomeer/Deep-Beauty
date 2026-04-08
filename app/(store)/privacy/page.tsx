import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | Deep Beauty',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
        سياسة الخصوصية
      </h1>
      <p className="text-sm opacity-50 mb-10">آخر تحديث: أبريل 2025</p>

      <div className="space-y-8 text-sm leading-8 opacity-80">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>١. المعلومات التي نجمعها</h2>
          <p>عند تسجيل الطلب نجمع: الاسم، رقم الهاتف، عنوان التوصيل، والبريد الإلكتروني (اختياري). عند الاشتراك في النشرة البريدية نجمع البريد الإلكتروني فقط.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٢. كيف نستخدم معلوماتك</h2>
          <ul className="list-disc list-inside space-y-1 mr-2">
            <li>معالجة وتوصيل طلباتك</li>
            <li>التواصل معك بشأن حالة الطلب</li>
            <li>إرسال عروض وأخبار المتجر (للمشتركين فقط)</li>
            <li>تحسين خدماتنا ومنتجاتنا</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٣. حماية بياناتك</h2>
          <p>نستخدم تشفير SSL لحماية بياناتك أثناء الإرسال. لا نشارك معلوماتك الشخصية مع أي طرف ثالث إلا ما يلزم لتوصيل طلبك (شركة الشحن).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٤. ملفات تعريف الارتباط (Cookies)</h2>
          <p>نستخدم ملفات الكوكيز لحفظ محتوى سلة التسوق وتحسين تجربة التصفح. يمكنك تعطيلها من إعدادات المتصفح مع العلم أن ذلك قد يؤثر على بعض وظائف الموقع.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٥. حقوقك</h2>
          <p>يحق لك في أي وقت طلب حذف بياناتك أو تعديلها أو الحصول على نسخة منها. تواصل معنا عبر البريد الإلكتروني وسنستجيب خلال ٧ أيام عمل.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٦. تواصل معنا</h2>
          <p>لأي استفسار حول خصوصيتك: <a href="mailto:contact@deepbeauty.kw" style={{ color: 'var(--primary)' }}>contact@deepbeauty.kw</a></p>
        </section>
      </div>
    </main>
  )
}
