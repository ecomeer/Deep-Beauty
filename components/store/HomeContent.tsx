'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product, FlashSale } from '@/types'
import ProductCard from '@/components/store/ProductCard'

function useCountdown(endsAt: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now())
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), done: diff === 0 }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => { const id = setInterval(() => setTime(calc()), 1000); return () => clearInterval(id) }, [endsAt])
  return time
}

function FlashSaleBanner({ sale }: { sale: FlashSale }) {
  const { h, m, s, done } = useCountdown(sale.ends_at)
  if (done) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flash-sale-bar">
      <span className="flash-tag">⚡ عرض محدود</span>
      <span className="flash-title">{sale.name_ar} — خصم {sale.discount_percentage}%</span>
      <div className="flash-timer">
        {[{ v: pad(h), l: 'س' }, { v: pad(m), l: 'د' }, { v: pad(s), l: 'ث' }].map((u, i) => (
          <span key={i} className="flash-unit">{u.v}<small>{u.l}</small></span>
        ))}
      </div>
      <Link href="/products" className="flash-btn">تسوق الآن</Link>
    </div>
  )
}

const FEATURES = [
  { icon: '🌿', title: 'طبيعي ١٠٠٪', desc: 'مكونات نقية خالية من الكيماويات الضارة' },
  { icon: '🔬', title: 'مُختبر سريرياً', desc: 'آمن لجميع أنواع البشرة ومثبت علمياً' },
  { icon: '🇰🇼', title: 'صُنع في الكويت', desc: 'بأيدٍ كويتية محلية بعناية واحتراف' },
  { icon: '♻️', title: 'صديق للبيئة', desc: 'تغليف مستدام ومسؤول بيئياً' },
]

const REVIEWS = [
  { name: 'نورة الرشيد', area: 'السالمية', text: 'بشرتي تغيرت من أول أسبوع! السيروم خفيف جداً ونتيجته مذهلة، صرت أحصل على مجاملات يومياً.' },
  { name: 'شيخة المطيري', area: 'حولي', text: 'كريم الليل أفضل استثمار لبشرتي. الترطيب يدوم طوال اليوم والرائحة الطبيعية تجنن.' },
  { name: 'فاطمة العنزي', area: 'الجهراء', text: 'جربت منتجات كثيرة لكن ديب بيوتي مختلفة — طبيعية وفعّالة. أنصح فيها كل البنات بدون تردد.' },
]

export default function HomePage({ featuredProducts, activeFlashSale }: {
  featuredProducts: Product[]
  activeFlashSale: FlashSale | null
}) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const sectionsRef = useRef<(Element | null)[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.06 }
    )
    sectionsRef.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const r = (el: Element | null) => { if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el) }

  const tabs = [
    { key: 'all', label: 'الكل' },
    { key: 'face', label: 'علاج البشرة' },
    { key: 'serum', label: 'سيروم' },
    { key: 'body', label: 'جسم' },
  ]

  const filteredProducts = activeTab === 'all'
    ? featuredProducts
    : featuredProducts.filter(p => {
        if (activeTab === 'serum') return p.name_ar.includes('سيروم') || p.name_en.toLowerCase().includes('serum')
        if (activeTab === 'body') return p.category === 'العناية بالجسم'
        return p.category === 'العناية بالوجه'
      })

  return (
    <div>
      {activeFlashSale && <FlashSaleBanner sale={activeFlashSale} />}

      {/* ══ 1. HERO ══ */}
      <section className="ref-hero">
        <div className="ref-hero__inner">
          {/* Text side */}
          <div className="ref-hero__text fade-in-section" ref={r}>
            <p className="ref-eyebrow">مصنوع في الكويت · Since 2022</p>
            <h1 className="ref-hero__h1">
              جمالك يبدأ<br />
              <em>من الأعماق</em>
            </h1>
            <p className="ref-hero__desc">
              عناية بالبشرة مصنوعة من أجود المكونات الطبيعية — نقية، فعّالة، فاخرة.
            </p>
            <div className="ref-hero__btns">
              <Link href="/products" className="btn-primary ref-cta">تسوق المجموعة</Link>
              <Link href="/about" className="ref-ghost">اعرفي أكثر</Link>
            </div>
            <div className="ref-hero__stats">
              {[{ n: '+5,000', l: 'عميلة سعيدة' }, { n: '100%', l: 'طبيعي' }, { n: '3+', l: 'سنوات خبرة' }].map(s => (
                <div key={s.l} className="ref-stat">
                  <strong>{s.n}</strong>
                  <span>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Image side */}
          <div className="ref-hero__visual fade-in-section" ref={r}>
            <div className="ref-hero__img-wrap">
              <Image
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=900&auto=format&fit=crop"
                alt="Deep Beauty Hero"
                fill priority sizes="(max-width:1023px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="ref-hero__img-overlay" />
              {/* Floating price badge */}
              <div className="ref-hero__badge">
                <span className="ref-hero__badge-label">ابتدءاً من</span>
                <strong className="ref-hero__badge-price">KD 8</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. FEATURES ══ */}
      <section className="ref-features fade-in-section" ref={r}>
        <div className="ref-container">
          <div className="ref-section-head ref-section-head--center">
            <p className="ref-eyebrow">لماذا ديب بيوتي</p>
            <h2 className="ref-section-h2">مميزات منتجاتنا</h2>
            <p className="ref-section-sub">نستخدم أجود المكونات الطبيعية المختارة بعناية لمنحك نتائج حقيقية تدوم</p>
          </div>
          <div className="ref-features__grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="ref-feature-card">
                <div className="ref-feature-card__icon">{f.icon}</div>
                <h3 className="ref-feature-card__title">{f.title}</h3>
                <p className="ref-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. ABOUT SPLIT ══ */}
      <section className="ref-about fade-in-section" ref={r}>
        {/* Text */}
        <div className="ref-about__text">
          <p className="ref-eyebrow">قصتنا</p>
          <h2 className="ref-about__h2">عن علامتنا التجارية وعملنا</h2>
          <p className="ref-about__body">
            في ديب بيوتي، نؤمن أن البشرة الصحية تستحق أفضل ما تقدمه الطبيعة. لم نكن نبحث عن منتج — كنا نبحث عن تجربة حقيقية، تطريها بعطف، تقوي مرونتها، وتضفي عليها لمسة من الفخامة الطبيعية، المستوحاة من الثقة الكبيرة في المكوّنات الطبيعية الفريدة.
          </p>
          <Link href="/about" className="ref-about__btn">
            اكتشفي المزيد →
          </Link>
        </div>
        {/* Images grid */}
        <div className="ref-about__imgs">
          <div className="ref-about__img ref-about__img--tall">
            <Image
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop"
              alt="about 1" fill sizes="300px" className="object-cover"
            />
          </div>
          <div className="ref-about__img-col">
            <div className="ref-about__img ref-about__img--short">
              <Image
                src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&auto=format&fit=crop"
                alt="about 2" fill sizes="200px" className="object-cover"
              />
            </div>
            <div className="ref-about__img ref-about__img--short">
              <Image
                src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=400&auto=format&fit=crop"
                alt="about 3" fill sizes="200px" className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. PRODUCTS ══ */}
      <section className="ref-products fade-in-section" ref={r}>
        <div className="ref-container">
          <div className="ref-section-head">
            <h2 className="ref-section-h2">تسوق منتجاتنا</h2>
            <Link href="/products" className="ref-see-all">عرض الكل ←</Link>
          </div>
          {/* Tabs */}
          <div className="ref-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`ref-tab ${activeTab === t.key ? 'ref-tab--active' : ''}`}
              >{t.label}</button>
            ))}
          </div>
          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="ref-products__grid">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="ref-empty">لا توجد منتجات في هذه الفئة حالياً</p>
          )}
        </div>
      </section>

      {/* ══ 5. REVIEWS ══ */}
      <section className="ref-reviews fade-in-section" ref={r}>
        <div className="ref-container">
          <div className="ref-section-head ref-section-head--center">
            <p className="ref-eyebrow">آراء عملائنا</p>
            <h2 className="ref-section-h2">تقييمات عملائنا</h2>
          </div>
          <div className="ref-reviews__grid">
            {REVIEWS.map((rv, i) => (
              <div key={i} className="ref-review">
                <div className="ref-review__stars">★★★★★</div>
                <p className="ref-review__text">"{rv.text}"</p>
                <div className="ref-review__author">
                  <div className="ref-review__av">{rv.name[0]}</div>
                  <div>
                    <strong>{rv.name}</strong>
                    <span>{rv.area} · الكويت</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. NEWSLETTER ══ */}
      <section className="ref-newsletter fade-in-section" ref={r}>
        <div className="ref-container">
          <div className="ref-newsletter__inner">
            <div>
              <p className="ref-eyebrow">ابقي على تواصل</p>
              <h2 className="ref-newsletter__h2">اشتركي في نشرتنا البريدية</h2>
              <p className="ref-newsletter__sub">عروض حصرية ومنتجات جديدة مباشرة في بريدك الإلكتروني.</p>
            </div>
            {subscribed ? (
              <div className="ref-newsletter__ok">✅ شكراً! ستصلك عروضنا قريباً.</div>
            ) : (
              <form className="ref-newsletter__form" onSubmit={async (e) => {
                e.preventDefault()
                setSubLoading(true); setSubError('')
                try {
                  const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
                  if (res.ok) setSubscribed(true)
                  else { const d = await res.json(); setSubError(d.error || 'حدث خطأ') }
                } catch { setSubError('حدث خطأ، حاولي مرة أخرى') }
                finally { setSubLoading(false) }
              }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني" required className="input-field" dir="ltr" />
                <button type="submit" className="btn-primary" disabled={subLoading}>
                  {subLoading ? '...' : 'اشتركي'}
                </button>
                {subError && <p className="ref-newsletter__error">{subError}</p>}
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
