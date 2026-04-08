'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('🚚 شحن مجاني للطلبات فوق ٢٠ د.ك')

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'announcement_text')
      .single()
      .then(({ data }) => {
        const val = data?.value ?? ''
        if (val) {
          setText(val)
          setVisible(true)
        }
      }, () => {
        setVisible(true)
      })
  }, [])

  if (!visible) return null

  return (
    <div className="announcement-banner flex items-center justify-between gap-4">
      <div className="flex-1 text-center text-sm text-white font-medium">{text}</div>
      <button
        type="button"
        aria-label="إغلاق الإعلان"
        onClick={() => setVisible(false)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <XMarkIcon className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
