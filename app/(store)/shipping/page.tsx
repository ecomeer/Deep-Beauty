import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الشحن والاسترجاع | Deep Beauty',
}

export default function ShippingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1
        className="text-4xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}
      >
        الشحن والاسترجاع
      </h1>
      <p className="text-sm opacity-50 mb-10">آخر تحديث: أبريل 2025</p>

      <div className="space-y-8 text-sm leading-8 opacity-80">

        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
            مناطق الشحن والتوصيل
          </h2>
          <div className="space-y-3">
            {[
              { country: 'الكويت', time: '١–٢ يوم عمل', price: 'مجاني على الطلبات فوق ١٥ د.ك' },
              { country: 'السعودية', time: '٣–٥ أيام عمل', price: 'يحدد عند الطلب' },
              { country: 'الإمارات', time: '٣–٥ أيام عمل', price: 'يحدد عند الطلب' },
              { country: 'قطر', time: '٣–٥ أيام عمل', price: 'يحدد عند الطلب' },
              { country: 'البحرين', time: '٣–٥ أيام عمل', price: 'يحدد عند الطلب' },
              { country: 'عُمان', time: '٣–٥ أيام عمل', price: 'يحدد عند الطلب' },
            ].map((row) => (
              <div
                key={row.country}
                className="flex justify-between items-center px-5 py-3 rounded-xl"
                style={{ background: 'white', border: '1px solid var(--beige)' }}
              >
                <span className="font-bold" style={{ color: 'var(--text-dark)' }}>{row.country}</span>
                <span>{row.time}</span>
                <span style={{ color: 'var(--primary)' }}>{row.price}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>
            تتبع الطلب
          </h2>
          <p>
            بعد شحن طلبك ستصلك رسالة نصية على رقم هاتفك تحتوي على رقم التتبع.
            يمكنك أيضاً تتبع طلبك من صفحة <a href="/track" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>تتبع الطلب</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>
            سياسة الاسترجاع والاستبدال
          </h2>
          <ul className="list-disc list-inside space-y-2 mr-2">
            <li>نقبل الإرجاع خلال <strong>١٤ يوماً</strong> من تاريخ الاستلام</li>
            <li>يجب أن يكون المنتج غير مستخدم وفي عبوته الأصلية</li>
            <li>لا نقبل إرجاع المنتجات المفتوحة لأسباب صحية إلا في حالة العيوب التصنيعية</li>
            <li>تكلفة الشحن عند الإرجاع على عاتق العميل إلا في حالة وجود عيب في المنتج</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>
            كيفية طلب الاسترجاع
          </h2>
          <ol className="list-decimal list-inside space-y-2 mr-2">
            <li>تواصل معنا عبر البريد الإلكتروني خلال ١٤ يوماً من الاستلام</li>
            <li>أرسل صورة للمنتج ورقم الطلب</li>
            <li>سنتواصل معك خلال ٢٤ ساعة لتأكيد الاسترجاع</li>
            <li>يتم استرداد المبلغ خلال ٥–٧ أيام عمل</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>
            تواصل معنا
          </h2>
          <p>
            لأي استفسار حول الشحن أو الإرجاع:{' '}
            <a href="mailto:contact@deepbeautykw.com" style={{ color: 'var(--primary)' }}>
              contact@deepbeautykw.com
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
