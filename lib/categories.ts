// Products store their category as free text (the Arabic name), while
// links may carry a slug (sitemap, home, footer) or a name. This is the
// single place that maps an incoming ?category= param to the stored
// filter value. The products API (app/api/products/route.ts) does the
// same resolution server-side against the categories table.

export interface CategoryLike {
  slug?: string | null
  name_ar?: string | null
  name_en?: string | null
}

export function resolveCategoryName(
  param: string | null | undefined,
  categories: CategoryLike[]
): string {
  if (!param) return ''

  const bySlug = categories.find((c) => c.slug === param)
  if (bySlug) return bySlug.name_ar || bySlug.name_en || param

  const byName = categories.find((c) => c.name_ar === param || c.name_en === param)
  if (byName) return byName.name_ar || byName.name_en || param

  return param
}
