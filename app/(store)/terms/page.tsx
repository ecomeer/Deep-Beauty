import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'الشروط والأحكام | Deep Beauty',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--text-dark)' }}>
        الشروط والأحكام
      </h1>
      <p className="text-sm opacity-50 mb-10">آخر تحديث: أبريل 2025</p>

      <div className="space-y-8 text-sm leading-8 opacity-80">
        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>١. القبول بالشروط</h2>
          <p>باستخدامك لموقع Deep Beauty، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يُرجى عدم استخدام الموقع.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٢. المنتجات والأسعار</h2>
          <p>نحتفظ بحق تعديل الأسعار في أي وقت دون إشعار مسبق. جميع الأسعار بالدينار الكويتي وتشمل ضريبة القيمة المضافة إن وُجدت. الصور المعروضة هي لأغراض توضيحية وقد تختلف قليلاً عن المنتج الفعلي.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٣. الطلبات والدفع</h2>
          <p>يتم تأكيد الطلب فور إتمام عملية الدفع أو قبول طلب الدفع عند الاستلام. نحتفظ بحق إلغاء أي طلب في حالة وجود خطأ في السعر أو نفاد المخزون، مع استرداد كامل للمبلغ المدفوع.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٤. الشحن والتوصيل</h2>
          <p>نوصل داخل الكويت فقط خلال ٢–٥ أيام عمل. قد تتأخر الشحنات في أوقات الذروة أو الإجازات الرسمية. نبذل قصارى جهدنا لضمان وصول طلبك في الوقت المحدد.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٥. الملكية الفكرية</h2>
          <p>جميع المحتويات على الموقع بما تشمل الصور والنصوص والشعار هي ملك حصري لـ Deep Beauty ومحمية بقوانين حقوق الملكية الفكرية. لا يجوز إعادة استخدامها دون إذن كتابي مسبق.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--primary)' }}>٦. تواصل معنا</h2>
          <p>لأي استفسار حول هذه الشروط، تواصل معنا عبر واتساب أو البريد الإلكتروني: <a href="mailto:contact@deepbeauty.kw" style={{ color: 'var(--primary)' }}>contact@deepbeauty.kw</a></p>
        </section>
      </div>
    </main>
  )
}
