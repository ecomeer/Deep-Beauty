import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'من نحن | Deep Beauty',
  description: 'تعرفي على قصة ديب بيوتي — منتجات عناية فاخرة بالبشرة مصنوعة في الكويت من أجود المكونات الطبيعية.',
}

const VALUES = [
  { icon: '🌿', title: 'طبيعي ١٠٠٪', desc: 'نختار كل مكوّن بعناية فائقة من أجود مصادر الطبيعة، بعيداً عن المواد الكيميائية الضارة.' },
  { icon: '👑', title: 'جودة فاخرة', desc: 'معايير جودة عالمية صارمة في كل مرحلة من مراحل الإنتاج، من المكوّن إلى التغليف.' },
  { icon: '🔬', title: 'مُختبر سريريًا', desc: 'كل منتجاتنا مختبرة ومعتمدة وآمنة على جميع أنواع البشرة الحساسة وغيرها.' },
  { icon: '🇰🇼', title: 'صُنع في الكويت', desc: 'فخورون بأن منتجاتنا تُصنع بالكامل في الكويت، مما يضمن الطازجية والجودة المستمرة.' },
]

const TEAM = [
  { name: 'فريق التطوير', role: 'أبحاث ومكونات', icon: '🧪' },
  { name: 'فريق التصميم', role: 'تجربة العميل', icon: '✨' },
  { name: 'فريق الخدمة', role: 'دعم ومتابعة', icon: '💝' },
]

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--off-white)' }}>

      {/* Hero */}
      <section className="py-24 px-6 text-center" style={{ background: 'var(--beige)' }}>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--primary)' }}>✦ قصتنا</p>
        <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
          من نحن
        </h1>
        <p className="text-base leading-8 max-w-2xl mx-auto opacity-70" style={{ color: 'var(--text-dark)' }}>
          ديب بيوتي — رحلة بدأت بحلم بسيط: تقديم عناية فاخرة بالبشرة مستوحاة من الطبيعة الكويتية،
          مصنوعة بأيدٍ ماهرة ومحبة، لكل امرأة تستحق الأفضل.
        </p>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="rounded-3xl h-80 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--beige), var(--dark-beige))' }}>
            <div className="text-center">
              <div className="text-8xl mb-4">💎</div>
              <p className="text-2xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>Deep Beauty</p>
              <p className="text-sm opacity-60 mt-1" style={{ color: 'var(--text-dark)' }}>Since 2022</p>
            </div>
          </div>
          <div className="space-y-5">
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
              القصة تبدأ من الأعماق
            </h2>
            <p className="leading-8 opacity-75 text-sm" style={{ color: 'var(--text-dark)' }}>
              في عام ٢٠٢٢، وُلدت فكرة ديب بيوتي من شغف حقيقي بالعناية بالبشرة الطبيعية.
              رأينا كيف تعاني كثيرات من المنتجات المليئة بالمواد الكيميائية، فقررنا أن نقدم بديلاً حقيقياً:
              منتجات تعتني ببشرتك بنفس الاهتمام الذي تستحقينه.
            </p>
            <p className="leading-8 opacity-75 text-sm" style={{ color: 'var(--text-dark)' }}>
              اليوم، نفخر بخدمة أكثر من ٥٠٠٠ عميلة سعيدة في الكويت والمنطقة، ونواصل رحلتنا نحو
              تقديم أفضل ما أنتجته الطبيعة في قوارير فاخرة تليق بجمالك.
            </p>
            <div className="flex gap-8 pt-2">
              {[{ val: '+٥٠٠٠', label: 'عميلة سعيدة' }, { val: '٣+', label: 'سنوات خبرة' }, { val: '١٠٠٪', label: 'طبيعي' }].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'Cormorant Garamond, serif' }}>{s.val}</div>
                  <div className="text-xs opacity-60" style={{ color: 'var(--text-dark)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6" style={{ background: 'var(--beige)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>✦ مبادئنا</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>قيمنا</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-dark)' }}>{v.title}</h3>
                <p className="text-xs leading-6 opacity-65" style={{ color: 'var(--text-dark)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>✦ فريقنا</p>
          <h2 className="text-4xl font-bold mb-14" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>من يصنع السحر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TEAM.map((t) => (
              <div key={t.name} className="rounded-2xl p-8" style={{ background: 'var(--beige)' }}>
                <div className="text-5xl mb-4">{t.icon}</div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{t.name}</h3>
                <p className="text-sm opacity-60" style={{ color: 'var(--text-dark)' }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center" style={{ background: 'var(--primary)' }}>
        <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          ابدئي رحلتك معنا
        </h2>
        <p className="text-white opacity-75 mb-8 max-w-md mx-auto leading-7">
          اكتشفي مجموعتنا الكاملة من منتجات العناية الفاخرة المصنوعة خصيصاً لك.
        </p>
        <Link href="/products" className="inline-block bg-white px-10 py-4 rounded-xl font-bold transition-all hover:opacity-90" style={{ color: 'var(--primary)' }}>
          تسوق الآن ✦
        </Link>
      </section>

    </div>
  )
}
