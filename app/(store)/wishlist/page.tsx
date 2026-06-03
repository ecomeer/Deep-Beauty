import type { Metadata } from 'next'
import WishlistClient from './WishlistClient'

import { useWishlistContext } from '@/context/WishlistContext'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'
import { ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  return <WishlistClient />
}
