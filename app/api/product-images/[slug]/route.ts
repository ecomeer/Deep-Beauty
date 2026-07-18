import { NextRequest, NextResponse } from 'next/server'

const DRIVE_FILE_IDS: Record<string, string> = {
  'bridal-oil': '1prVPnkkUoaY5PVVl5dutJMEyrwibgEJW',
  'natural-sidr-shampoo': '1pwdnos-kqC1GfnZaviblKJ9Hov5sb8xf',
  'silk-collection': '1pwwNZgbk_ZxSj7H-Z065w4KcB93PnnzR',
  'silk-shower-gel': '1q2g1ocLx4chqH8d5iNbNQo500jLXCgj-',
  'silk-body-cream': '1q4KTY-FcYt84xsOqosLa4k108XaA3KdL',
  'silk-khumria': '1q7J0d-DrQJT6i2XwAwiHGPYOwAOyKqfS',
  'coffee-scrub': '1q8Rz0w7PMPwMaE_yUCFg9xf8x9zR3odn',
  'aker-fassi-brightening-collection': '1qB5C91ouE-NyDJv-0nCNSxIPhRtWdDD6',
  'aker-fassi-brightening-spray': '1qBRS4WQPJdyx-ZOsZZ8LBHLTsZdfyS2v',
  'aker-fassi-brightening-soap': '1qGHzwc2BQA796iCpg2BISkEgVuJ9HCSX',
  'aker-fassi-brightening-scrub': '1qGXaP7M61J9VL7rftUL1UtK_5KEkZMHl',
  'vitamin-c-turmeric-collection': '1qNg86WNqC4Pfk1WmQIEwtksFVxUBJ6qB',
  'vitamin-c-turmeric-scrub': '1qOjSEwsCEJWhWP6LYmv3EWn9JmvcgGUO',
  'vitamin-c-turmeric-cream': '1qPD9-dDD5UO7P0afAYeu7vChoYWODqxA',
  'vitamin-c-turmeric-soap': '1qY03VKNmEUHTYSOV3w1C1RscGbCqb6ER',
  'herbal-dalka-collection': '1q_WhFyifmZCafJ7OPRcwaRH_Zs0eKF3q',
  'herbal-dalka-oil': '1qdQsU7qhawq_xkkmLXgYQ2CAKGoy-kq8',
  'herbal-body-dalka': '1qfWTeGuLG7iEpuNIxal7KMGJNUFYCV_q',
}

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const fileId = DRIVE_FILE_IDS[slug]

  if (!fileId) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const response = NextResponse.redirect(
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`,
    307
  )
  response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return response
}
