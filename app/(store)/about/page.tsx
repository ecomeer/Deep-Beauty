import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BeakerIcon,
  SparklesIcon,
  ShieldCheckIcon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'من نحن | Deep Beauty',
  description: 'تعرفي على قصة ديب بيوتي — منتجات عناية فاخرة بالبشرة مصنوعة في الكويت من أجود المكونات الطبيعية.',
}

const STATS = [
  { val: '٣+', label: 'سنوات خبرة' },
  { val: '١٠٠٪', label: 'مكونات طبيعية' },
  { val: '٥٠٠٠+', label: 'عميلة سعيدة' },
]

const VALUES = [
  { Icon: SparklesIcon, title: 'طبيعي ١٠٠٪', desc: 'نختار كل مكوّن بعناية من أجود مصادر الطبيعة، بعيداً عن المواد الكيميائية الضارة.' },
  { Icon: StarIcon, title: 'جودة فاخرة', desc: 'معايير جودة عالمية صارمة في كل مرحلة، من المكوّن إلى التغليف الأنيق.' },
  { Icon: BeakerIcon, title: 'مُختبر سريريًا', desc: 'جميع منتجاتنا مختبرة ومعتمدة وآمنة لجميع أنواع البشرة بما فيها الحساسة.' },
  { Icon: MapPinIcon, title: 'صُنع في الكويت', desc: 'فخورون بأن منتجاتنا تُصنع في الكويت مما يضمن الطازجية والجودة المستمرة.' },
]

export default function AboutPage() {
  return (
    <div className="pt-24 overflow-x-hidden" style={{ background: '#fff8f4', color: '#201b15' }}>

      {/* ══════════════════════════════
          01 HERO — Editorial Asymmetry
      ══════════════════════════════ */}
      <section className="relative min-h-[88vh] flex items-center px-6 md:px-20 py-20">
        {/* Subtle background decoration */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(156,102,68,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center w-full">

          {/* Text — right side (RTL start) */}
          <div className="md:col-span-7 space-y-7 z-10">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ color: 'var(--primary)' }}
            >
              ✦ قصتنا
            </span>

            <h1
              className="text-6xl md:text-7xl font-headline font-bold leading-tight"
              style={{ color: '#201b15' }}
            >
              جمال من<br />
              <em className="not-italic" style={{ color: 'var(--primary)' }}>عمق الطبيعة</em>
            </h1>

            <p className="text-base md:text-lg leading-8 max-w-lg" style={{ color: '#51443c' }}>
              لا نؤمن فقط بمنتجات العناية — بل نؤمن بأن البشرة تستحق تغذيةً حقيقية مستخلصة
              من أنقى مكونات الطبيعة. في ديب بيوتي، نجمع بين حكمة الأجداد ودقة العلم الحديث.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'var(--primary)' }}
            >
              اكتشفي المجموعة
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Visual — editorial card */}
          <div className="md:col-span-5 relative">
            <div
              className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl md:rotate-2"
              style={{ background: 'linear-gradient(160deg, #EEE0D5 0%, #dcc8b8 60%, #c4a882 100%)' }}
            >
              {/* Decorative inner pattern */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10 text-center">
                <div
                  className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--primary)' }}
                >
                  <SparklesIcon className="w-9 h-9" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p
                    className="text-3xl font-headline font-bold tracking-tight mb-1"
                    style={{ color: 'var(--primary)' }}
                  >
                    Deep Beauty
                  </p>
                  <p className="text-xs tracking-[0.3em] uppercase opacity-60">Kuwait — Since 2022</p>
                </div>
                {/* Horizontal rule */}
                <div className="w-16 h-px" style={{ background: 'var(--primary)', opacity: 0.4 }} />
                <p className="text-xs leading-6 opacity-70 max-w-[180px]">
                  عناية فاخرة بالبشرة من قلب الطبيعة الكويتية
                </p>
              </div>
            </div>
            {/* Glow */}
            <div
              className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full blur-3xl -z-10"
              style={{ background: 'rgba(156,102,68,0.12)' }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          02 PHILOSOPHY
      ══════════════════════════════ */}
      <section className="py-28 px-6 md:px-20" style={{ background: '#fef1e8' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-start">

            {/* Label + heading */}
            <div className="md:w-1/3 md:sticky md:top-32">
              <span
                className="text-xs font-bold tracking-[0.25em] uppercase block mb-4"
                style={{ color: 'var(--primary)' }}
              >
                01 — فلسفتنا
              </span>
              <h2 className="text-4xl font-headline leading-snug" style={{ color: '#201b15' }}>
                التناغم بين<br />الطبيعة والعلم
              </h2>
            </div>

            {/* Content */}
            <div className="md:w-2/3 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  {
                    Icon: BeakerIcon,
                    title: 'الابتكار الطبيعي',
                    desc: 'نستخدم أساليب الاستخلاص الباردة للحفاظ على سلامة الجزيئات النباتية النشطة، لضمان وصول الفوائد الكاملة لبشرتك.',
                  },
                  {
                    Icon: SparklesIcon,
                    title: 'الاستدامة الواعية',
                    desc: 'كل قطرة في زجاجاتنا نتيجة حصاد أخلاقي يحترم التوازن البيئي ويدعم المجتمعات المحلية التي نستمد منها مكوناتنا.',
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="space-y-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--beige)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: '#201b15' }}>{title}</h3>
                    <p className="text-sm leading-7" style={{ color: '#51443c' }}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* Wide banner */}
              <div
                className="w-full h-56 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--beige) 0%, var(--dark-beige) 100%)' }}
              >
                <div className="text-center space-y-2 px-8">
                  <p
                    className="text-2xl md:text-3xl font-headline font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    مكونات طبيعية مختارة بعناية
                  </p>
                  <p className="text-sm opacity-60 tracking-widest uppercase">Pure — Natural — Effective</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          03 BENTO GRID — Purity
      ══════════════════════════════ */}
      <section className="py-28 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase block mb-4"
              style={{ color: 'var(--primary)' }}
            >
              02 — النقاء أولاً
            </span>
            <h2 className="text-4xl md:text-5xl font-headline" style={{ color: '#201b15' }}>
              مكونات من رحم الأرض
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ gridAutoRows: '180px' }}>

            {/* Large hero card */}
            <div
              className="col-span-2 row-span-2 rounded-2xl relative overflow-hidden flex flex-col justify-end p-7"
              style={{ background: 'linear-gradient(160deg, #dcc8b8 0%, #b8916d 100%)' }}
            >
              {/* decorative circle */}
              <div
                className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
                style={{ background: 'var(--primary)' }}
              />
              <div className="relative z-10">
                <h4 className="text-2xl font-headline font-bold text-white mb-1">زيوت عطرية نادرة</h4>
                <p className="text-white/75 text-sm leading-6">
                  مستخلصة بطرق باردة من أجود المصادر الطبيعية الخالصة.
                </p>
              </div>
            </div>

            {/* No toxins */}
            <div
              className="rounded-2xl p-5 flex flex-col justify-between"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              <CheckBadgeIcon className="w-7 h-7 opacity-90" />
              <div>
                <h4 className="font-bold text-base mb-1">خالٍ من السموم</h4>
                <p className="text-xs opacity-75 leading-5">نستثني أكثر من ٢٠٠٠ مادة كيميائية ضارة.</p>
              </div>
            </div>

            {/* Texture card */}
            <div
              className="rounded-2xl flex items-center justify-center p-6"
              style={{ background: 'linear-gradient(135deg, #f5ebe0 0%, var(--beige) 100%)' }}
            >
              <div className="text-center space-y-2">
                <ShieldCheckIcon className="w-10 h-10 mx-auto" style={{ color: 'var(--primary)' }} />
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--primary)' }}>مُعتمد</p>
              </div>
            </div>

            {/* Plant extracts — wide */}
            <div
              className="col-span-2 rounded-2xl flex flex-col sm:flex-row items-center overflow-hidden"
              style={{ background: 'var(--beige)' }}
            >
              <div className="p-7 flex-1">
                <h4 className="font-bold text-lg mb-2" style={{ color: '#201b15' }}>مستخلصات نباتية</h4>
                <p className="text-sm leading-6" style={{ color: '#51443c' }}>
                  نبحث في أرجاء العالم عن أقوى النباتات لننقل طاقتها الكاملة إلى بشرتك.
                </p>
              </div>
              <div
                className="flex-shrink-0 w-full sm:w-32 h-24 sm:h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #dcc8b8 0%, #c4a882 100%)' }}
              >
                <SparklesIcon className="w-10 h-10 opacity-50" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          04 STORY — Split Editorial
      ══════════════════════════════ */}
      <section className="py-28 px-6 md:px-20" style={{ background: '#fff8f4' }}>
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row gap-20 items-center">

          {/* Text */}
          <div className="md:w-1/2 space-y-7">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ color: 'var(--primary)' }}
            >
              03 — قصتنا
            </span>
            <h2 className="text-4xl font-headline leading-snug" style={{ color: '#201b15' }}>
              بدأت الرحلة بحلم بسيط
            </h2>
            <div className="space-y-5 text-sm leading-8" style={{ color: '#51443c' }}>
              <p>
                تأسست ديب بيوتي في قلب الكويت من شغف حقيقي بالعناية الطبيعية بالبشرة. رأينا كيف
                تعاني كثيرات من المنتجات المليئة بالمواد الكيميائية، فقررنا أن نقدم بديلاً حقيقياً
                يحترم جمال المرأة الطبيعي.
              </p>
              <p>
                قضينا سنوات في البحث والتطوير للوصول إلى صيغ توازن بين الرفاهية والنتائج الحقيقية.
                اليوم نفخر بخدمة آلاف العميلات في الكويت ودول الخليج.
              </p>
            </div>
            {/* Stats */}
            <div className="flex gap-10 pt-3 border-t" style={{ borderColor: 'var(--beige)' }}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <div
                    className="text-3xl font-headline font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    {s.val}
                  </div>
                  <div className="text-xs uppercase tracking-widest mt-1 opacity-60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Portrait card */}
          <div className="md:w-1/2 relative flex justify-center">
            <div
              className="w-72 h-72 md:w-80 md:h-80 rounded-full flex items-center justify-center border-4 relative"
              style={{
                background: 'linear-gradient(135deg, #EEE0D5 0%, #dcc8b8 100%)',
                borderColor: 'var(--beige)',
              }}
            >
              <div className="text-center space-y-3">
                <p className="text-4xl font-headline font-bold" style={{ color: 'var(--primary)' }}>DB</p>
                <div className="w-10 h-px mx-auto" style={{ background: 'var(--primary)', opacity: 0.5 }} />
                <p className="text-xs tracking-[0.25em] uppercase opacity-60">Made in Kuwait</p>
              </div>
            </div>

            {/* Floating quote */}
            <div
              className="absolute -top-4 -right-2 md:-right-8 max-w-[195px] rounded-2xl p-5 shadow-lg"
              style={{ background: 'white', border: '1px solid var(--beige)' }}
            >
              <p className="text-xs italic leading-6" style={{ color: '#51443c' }}>
                "الجمال الحقيقي يبدأ من الداخل، وينعكس على البشرة المُغذّاة جيداً."
              </p>
              <span
                className="block mt-3 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--primary)' }}
              >
                — فريق ديب بيوتي
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          05 VALUES — Grid
      ══════════════════════════════ */}
      <section className="py-24 px-6 md:px-20" style={{ background: '#fef1e8' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase block mb-4"
              style={{ color: 'var(--primary)' }}
            >
              04 — مبادئنا
            </span>
            <h2 className="text-4xl font-headline" style={{ color: '#201b15' }}>ما نؤمن به</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-7 shadow-sm border flex flex-col gap-4"
                style={{ borderColor: 'var(--beige)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--beige)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="font-bold text-base" style={{ color: '#201b15' }}>{title}</h3>
                <p className="text-xs leading-6" style={{ color: '#51443c' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          06 CTA
      ══════════════════════════════ */}
      <section className="py-28 px-6 text-center" style={{ background: '#fff8f4' }}>
        <div className="max-w-xl mx-auto space-y-8">
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16" style={{ background: 'var(--beige)' }} />
            <SparklesIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <div className="h-px w-16" style={{ background: 'var(--beige)' }} />
          </div>

          <h2 className="text-4xl font-headline leading-snug" style={{ color: '#201b15' }}>
            انضمي إلى مجتمع<br />
            <em className="not-italic" style={{ color: 'var(--primary)' }}>ديب بيوتي</em> اليوم
          </h2>
          <p className="text-sm leading-7" style={{ color: '#51443c' }}>
            اكتشفي مجموعتنا الكاملة من منتجات العناية الطبيعية الفاخرة المصنوعة خصيصاً لكِ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              اكتشفي المنتجات
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all border-2 hover:bg-[var(--beige)]"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              تتبعي طلبك
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
