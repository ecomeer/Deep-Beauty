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
    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>⚡ عرض محدود</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sale.name_ar} — خصم {sale.discount_percentage}%</span>
      <span style={{ fontSize: '0.85rem', fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.05em' }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
      <Link href="/products" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.9rem', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
        تسوق الآن
      </Link>
    </div>
  )
}

export default function HomePage({ featuredProducts, activeFlashSale }: {
  featuredProducts: Product[]
  activeFlashSale: FlashSale | null
}) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
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

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif' }}>

      {activeFlashSale && <FlashSaleBanner sale={activeFlashSale} />}

      {/* ─── HERO ─── */}
      <section className="hp-hero">
        {/* Background image fills right half on desktop, full on mobile */}
        <div className="hp-hero__bg">
          <Image
            src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop"
            alt="" fill priority sizes="(max-width:1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
          <div className="hp-hero__bg-overlay" />
        </div>

        {/* Content */}
        <div className="hp-hero__content">
          <div className="hp-hero__text">
            <p className="hp-eyebrow">مصنوع في الكويت · Since 2022</p>
            <h1 className="hp-hero__h1">
              جمالك يبدأ<br />
              <span>من الأعماق</span>
            </h1>
            <p className="hp-hero__desc">
              عناية بالبشرة مصنوعة من أجود المكونات الطبيعية — نقية، فعّالة، فاخرة.
            </p>
            <div className="hp-hero__btns">
              <Link href="/products" className="hp-btn-primary">تسوق المجموعة</Link>
              <Link href="/about" className="hp-btn-ghost">اعرفي أكثر</Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="hp-hero__stats">
            {[
              { n: '+5,000', l: 'عميلة سعيدة' },
              { n: '100%', l: 'مكونات طبيعية' },
              { n: '3+', l: 'سنوات خبرة' },
            ].map((s) => (
              <div key={s.l} className="hp-stat">
                <strong>{s.n}</strong>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="hp-strip">
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="hp-strip__item">
                Deep Hydration <span className="hp-dot">·</span>
                Silky Glow <span className="hp-dot">·</span>
                Pure Ingredients <span className="hp-dot">·</span>
                Made in Kuwait <span className="hp-dot">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TRUST BAR ─── */}
      <div className="hp-trust" ref={r}>
        {[
          { icon: '🌿', t: 'طبيعي ١٠٠٪', d: 'بدون مواد كيميائية ضارة' },
          { icon: '🔬', t: 'مُختبر سريرياً', d: 'آمن لجميع أنواع البشرة' },
          { icon: '🇰🇼', t: 'صُنع في الكويت', d: 'بأيدٍ كويتية محلية' },
          { icon: '♻️', t: 'صديق للبيئة', d: 'تغليف مستدام ومسؤول' },
        ].map((f) => (
          <div key={f.t} className="hp-trust__item fade-in-section">
            <span className="hp-trust__icon">{f.icon}</span>
            <div>
              <strong>{f.t}</strong>
              <p>{f.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="hp-section" ref={r as any}>
        <div className="hp-section__head fade-in-section">
          <div className="hp-section__title-wrap">
            <span className="hp-eyebrow">الأكثر مبيعاً</span>
            <h2 className="hp-section__h2">منتجات صُنعت بعناية</h2>
          </div>
          <Link href="/products" className="hp-link-arrow">عرض الكل ←</Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="hp-products-grid fade-in-section">
            {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="hp-empty fade-in-section">لا توجد منتجات مميزة حالياً — أضيفيها من لوحة الأدمن</div>
        )}
      </section>

      {/* ─── FULL-WIDTH EDITORIAL ─── */}
      <section className="hp-editorial fade-in-section" ref={r as any}>
        <Image
          src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop"
          alt="Deep Beauty Editorial"
          fill sizes="100vw"
          className="object-cover"
        />
        <div className="hp-editorial__veil" />
        <div className="hp-editorial__body">
          <span className="hp-eyebrow" style={{ color: 'rgba(255,255,255,0.65)' }}>الجمال الحقيقي</span>
          <h2 className="hp-editorial__h2">اكتشفي سر البشرة المشرقة</h2>
          <Link href="/products" className="hp-btn-white">تسوق الآن ✦</Link>
        </div>
      </section>

      {/* ─── ABOUT SPLIT ─── */}
      <section className="hp-about fade-in-section" ref={r as any}>
        <div className="hp-about__img">
          <Image
            src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=900&auto=format&fit=crop"
            alt="Deep Beauty Story"
            fill sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="hp-about__badge">
            <strong>+5,000</strong>
            <span>عميلة سعيدة</span>
          </div>
        </div>
        <div className="hp-about__text">
          <span className="hp-eyebrow">قصتنا</span>
          <h2 className="hp-about__h2">من نحن</h2>
          <p className="hp-about__body">
            ديب بيوتي — شركة كويتية متخصصة في صناعة منتجات العناية بالبشرة الفاخرة. نؤمن أن الجمال الحقيقي يبدأ من الداخل، لذلك نختار كل مكوّن بعناية فائقة لضمان النقاء والفاعلية القصوى.
          </p>
          <div className="hp-about__pillars">
            {[
              { t: 'طبيعي ١٠٠٪', d: 'مكونات نقية خالية من الكيماويات' },
              { t: 'جودة فاخرة', d: 'معايير دولية في كل مرحلة' },
              { t: 'مُختبر سريرياً', d: 'آمن لجميع أنواع البشرة' },
              { t: 'صُنع في الكويت', d: 'بأيدٍ محلية وروح كويتية' },
            ].map((f) => (
              <div key={f.t} className="hp-pillar">
                <div className="hp-pillar__dot" />
                <div>
                  <strong>{f.t}</strong>
                  <p>{f.d}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/about" className="hp-btn-primary" style={{ width: 'fit-content' }}>اعرفي أكثر عنا ←</Link>
        </div>
      </section>

      {/* ─── HOW TO USE ─── */}
      <section className="hp-section hp-section--light" ref={r as any}>
        <div className="hp-section__head fade-in-section">
          <div className="hp-section__title-wrap" style={{ alignItems: 'center', textAlign: 'center', width: '100%' }}>
            <span className="hp-eyebrow">دليل الاستخدام</span>
            <h2 className="hp-section__h2">روتين العناية اليومي</h2>
          </div>
        </div>
        <div className="hp-steps fade-in-section">
          {[
            { n: '01', t: 'نظّفي', d: 'ابدئي بغسول لطيف لتنظيف البشرة من المكياج والشوائب', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400' },
            { n: '02', t: 'السيروم', d: 'بضع قطرات من السيروم على بشرة نظيفة ودلّكيه برفق', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400' },
            { n: '03', t: 'الترطيب', d: 'أضيفي المرطب لقفل الترطيب والحفاظ على نضارة البشرة', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400' },
            { n: '04', t: 'النتيجة', d: 'بشرة مشرقة، ناعمة، وصحية تدوم طوال اليوم', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400' },
          ].map((s) => (
            <div key={s.n} className="hp-step">
              <div className="hp-step__img">
                <Image src={s.img} alt={s.t} fill sizes="280px" className="object-cover" />
                <span className="hp-step__n">{s.n}</span>
              </div>
              <h3 className="hp-step__t">{s.t}</h3>
              <p className="hp-step__d">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section className="hp-reviews" ref={r as any}>
        <div className="hp-reviews__head fade-in-section">
          <span className="hp-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>آراء عملائنا</span>
          <h2 className="hp-reviews__h2">ماذا تقول عميلاتنا</h2>
        </div>
        <div className="hp-reviews__grid">
          {[
            { name: 'نورة الرشيد', area: 'السالمية', text: 'بشرتي تغيرت من أول أسبوع! السيروم خفيف جداً ونتيجته مذهلة، صرت أحصل على مجاملات يومياً.' },
            { name: 'شيخة المطيري', area: 'حولي', text: 'كريم الليل أفضل استثمار لبشرتي. الترطيب يدوم طوال اليوم والرائحة الطبيعية تجنن.' },
            { name: 'فاطمة العنزي', area: 'الجهراء', text: 'جربت منتجات كثيرة لكن ديب بيوتي مختلفة — طبيعية وفعّالة. أنصح فيها كل البنات بدون تردد.' },
          ].map((t, i) => (
            <div key={i} className="hp-review fade-in-section">
              <div className="hp-review__stars">★★★★★</div>
              <p className="hp-review__text">"{t.text}"</p>
              <div className="hp-review__author">
                <div className="hp-review__av">{t.name[0]}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.area} · الكويت</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="hp-newsletter" ref={r as any}>
        <div className="hp-newsletter__inner fade-in-section">
          <div>
            <span className="hp-eyebrow">ابقي على تواصل</span>
            <h2 className="hp-newsletter__h2">اشتركي في نشرتنا</h2>
            <p className="hp-newsletter__sub">عروض حصرية ومنتجات جديدة مباشرة في بريدك الإلكتروني.</p>
          </div>
          {subscribed ? (
            <div className="hp-newsletter__ok">✅ شكراً! ستصلك عروضنا قريباً.</div>
          ) : (
            <form className="hp-newsletter__form" onSubmit={(e) => { e.preventDefault(); setSubscribed(true) }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدك الإلكتروني" required className="input-field" dir="ltr" />
              <button type="submit" className="hp-btn-primary">اشتركي</button>
            </form>
          )}
        </div>
      </section>

    </div>
  )
}
