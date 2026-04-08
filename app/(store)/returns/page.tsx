import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'سياسة الاسترجاع والاستبدال | Deep Beauty',
}

export default function ReturnsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
        سياسة الاسترجاع والاستبدال
      </h1>
      <p className="text-sm opacity-50 mb-10">آخر تحديث: أبريل 2025</p>

      <div className="space-y-8 text-sm leading-8 opacity-80">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>١. شروط الاسترجاع</h2>
          <p>نقبل الاسترجاع خلال <strong>٧ أيام</strong> من تاريخ الاستلام بشرط:</p>
          <ul className="list-disc list-inside space-y-1 mr-2 mt-2">
            <li>المنتج غير مستخدم وبحالته الأصلية</li>
            <li>العبوة مغلقة ولم تُفتح</li>
            <li>وجود إيصال الشراء أو رقم الطلب</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٢. حالات لا يُقبل فيها الاسترجاع</h2>
          <ul className="list-disc list-inside space-y-1 mr-2">
            <li>المنتجات المستخدمة أو المفتوحة لأسباب صحية وسلامة</li>
            <li>منتجات العروض الخاصة والتصفية</li>
            <li>مضي أكثر من ٧ أيام على الاستلام</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٣. المنتجات التالفة أو الخاطئة</h2>
          <p>إذا وصلك منتج تالف أو مختلف عما طلبته، تواصل معنا خلال <strong>٤٨ ساعة</strong> من الاستلام مع صورة للمنتج وسنتكفل بالاستبدال أو الاسترداد الكامل فوراً.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٤. كيفية الاسترجاع</h2>
          <ol className="list-decimal list-inside space-y-2 mr-2">
            <li>تواصل معنا عبر واتساب مع ذكر رقم الطلب</li>
            <li>سنرسل لك تعليمات إعادة المنتج</li>
            <li>بعد استلام المنتج وفحصه، يتم الاسترداد خلال ٣–٥ أيام عمل</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٥. رسوم الاسترجاع</h2>
          <p>في حالة الاسترجاع لأسباب شخصية (غير عيب في المنتج)، تتحمل العميل رسوم الشحن العائد. أما في حالة العيوب أو الأخطاء من جانبنا، فنتحمل كامل التكاليف.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٦. تواصل معنا</h2>
          <p>
            للاستفسار عن أي طلب استرجاع:{' '}
            <Link href="/#contact" style={{ color: 'var(--primary)' }}>تواصل معنا</Link>
            {' '}أو عبر البريد:{' '}
            <a href="mailto:contact@deepbeauty.kw" style={{ color: 'var(--primary)' }}>contact@deepbeauty.kw</a>
          </p>
        </section>
      </div>
    </main>
  )
}
