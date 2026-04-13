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
    <div className="bg-surface pt-32">

      {/* Hero */}
      <section className="py-24 px-6 text-center bg-surface-container-low">
        <p className="text-sm font-medium mb-3 text-primary">✦ قصتنا</p>
        <h1 className="text-5xl md:text-6xl font-headline mb-6 text-on-surface">
          من نحن
        </h1>
        <p className="text-base leading-8 max-w-2xl mx-auto text-on-surface-variant">
          ديب بيوتي — رحلة بدأت بحلم بسيط: تقديم عناية فاخرة بالبشرة مستوحاة من الطبيعة الكويتية،
          مصنوعة بأيدٍ ماهرة ومحبة، لكل امرأة تستحق الأفضل.
        </p>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="rounded-3xl h-80 flex items-center justify-center bg-surface-container">
            <div className="text-center">
              <div className="text-8xl mb-4">💎</div>
              <p className="text-2xl font-headline text-primary">Deep Beauty</p>
              <p className="text-sm text-on-surface-variant mt-1">Since 2022</p>
            </div>
          </div>
          <div className="space-y-5">
            <h2 className="text-4xl font-headline text-on-surface">
              القصة تبدأ من الأعماق
            </h2>
            <p className="leading-8 text-sm text-on-surface-variant">
              في عام ٢٠٢٢، وُلدت فكرة ديب بيوتي من شغف حقيقي بالعناية بالبشرة الطبيعية.
              رأينا كيف تعاني كثيرات من المنتجات المليئة بالمواد الكيميائية، فقررنا أن نقدم بديلاً حقيقياً:
              منتجات تعتني ببشرتك بنفس الاهتمام الذي تستحقينه.
            </p>
            <p className="leading-8 text-sm text-on-surface-variant">
              اليوم، نفخر بخدمة أكثر من ٥٠٠٠ عميلة سعيدة في الكويت والمنطقة، ونواصل رحلتنا نحو
              تقديم أفضل ما أنتجته الطبيعة في قوارير فاخرة تليق بجمالك.
            </p>
            <div className="flex gap-8 pt-2">
              {[{ val: '+٥٠٠٠', label: 'عميلة سعيدة' }, { val: '٣+', label: 'سنوات خبرة' }, { val: '١٠٠٪', label: 'طبيعي' }].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-primary font-headline">{s.val}</div>
                  <div className="text-xs text-on-surface-variant">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-surface-container">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium mb-2 text-primary">✦ مبادئنا</p>
            <h2 className="text-4xl font-headline text-on-surface">قيمنا</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-surface rounded-2xl p-6 text-center shadow-editorial border border-outline-variant/50">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-base mb-2 text-on-surface">{v.title}</h3>
                <p className="text-xs leading-6 text-on-surface-variant">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium mb-2 text-primary">✦ فريقنا</p>
          <h2 className="text-4xl font-headline mb-14 text-on-surface">من يصنع السحر</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TEAM.map((t) => (
              <div key={t.name} className="rounded-2xl p-8 bg-surface-container">
                <div className="text-5xl mb-4">{t.icon}</div>
                <h3 className="font-bold mb-1 text-on-surface">{t.name}</h3>
                <p className="text-sm text-on-surface-variant">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center bg-primary">
        <h2 className="text-4xl font-headline text-white mb-4">
          ابدئي رحلتك معنا
        </h2>
        <p className="text-white/75 mb-8 max-w-md mx-auto leading-7">
          اكتشفي مجموعتنا الكاملة من منتجات العناية الفاخرة المصنوعة خصيصاً لك.
        </p>
        <Link href="/products" className="inline-block bg-white px-10 py-4 rounded-xl font-bold transition-all hover:bg-white/90 text-primary">
          تسوق الآن ✦
        </Link>
      </section>

    </div>
  )
}
