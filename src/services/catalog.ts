import type {
  AddOn,
  BookingSelectionLine,
  CatalogFilters,
  CatalogItemView,
  CatalogSearchInput,
  DemoState,
  PricingSnapshot,
  Product,
  RentalPackage,
  RentalPeriod,
} from '@/domain/models'
import { allocateRequirements, expandAllocationRequirements } from '@/services/availability'
import { getDemoStateService } from '@/services/mockServices'
import { quoteBooking } from '@/services/pricing'

export type PreviewMode = 'normal' | 'loading' | 'error'

export interface ProductDetailView {
  product: Product
  addOns: AddOn[]
  availableCount: number
}

export interface PackageDetailView {
  rentalPackage: RentalPackage
  components: { product: Product; quantity: number }[]
  addOns: AddOn[]
  available: boolean
}

const failedPreviews = new Set<string>()

export function resetCatalogPreviewFailures(): void {
  failedPreviews.clear()
}

async function simulate(mode: PreviewMode, key: string): Promise<void> {
  if (mode === 'loading') await new Promise((resolve) => setTimeout(resolve, 650))
  if (mode === 'error' && !failedPreviews.has(key)) {
    failedPreviews.add(key)
    throw new Error('Simulated recoverable catalog error')
  }
}

function scenarioNow(state: DemoState): string {
  return (
    state.demoScenarios.find((scenario) => scenario.id === state.activeScenarioId)?.asOf ??
    '2026-10-04T10:00:00+08:00'
  )
}

function availabilityCount(
  state: DemoState,
  line: BookingSelectionLine,
  period: RentalPeriod,
): number {
  const requirements = expandAllocationRequirements([line], state.packages, state.addOns)
  const ceiling = requirements.reduce((maximum, requirement) => {
    const count = state.inventoryUnits.filter(
      (unit) => unit.productId === requirement.productId && unit.lifecycle === 'active',
    ).length
    return Math.max(maximum, count)
  }, 1)

  let available = 0
  for (let quantity = 1; quantity <= ceiling; quantity += 1) {
    const scaled = requirements.map((requirement) => ({
      ...requirement,
      quantity: requirement.quantity * quantity,
    }))
    const result = allocateRequirements({
      requirements: scaled,
      period,
      units: state.inventoryUnits,
      bookings: state.bookings,
      availabilityBlocks: state.availabilityBlocks,
      asOf: scenarioNow(state),
    })
    if (!result.available) break
    available = quantity
  }
  return available
}

function toProductView(state: DemoState, product: Product, period: RentalPeriod): CatalogItemView {
  const availableCount = availabilityCount(
    state,
    { id: `preview-${product.id}`, kind: 'product', itemId: product.id, quantity: 1 },
    period,
  )
  return {
    id: product.id,
    slug: product.slug,
    kind: 'product',
    name: product.name,
    category: product.category,
    serviceCategory: product.serviceCategory,
    brand: product.brand,
    dailyRate: product.dailyRate,
    summary: product.summary,
    imagePath: product.imagePaths[0],
    availableCount,
    availability: availableCount === 0 ? 'unavailable' : availableCount === 1 ? 'limited' : 'available',
  }
}

function toPackageView(
  state: DemoState,
  rentalPackage: RentalPackage,
  period: RentalPeriod,
): CatalogItemView {
  const availableCount = availabilityCount(
    state,
    { id: `preview-${rentalPackage.id}`, kind: 'package', itemId: rentalPackage.id, quantity: 1 },
    period,
  )
  return {
    id: rentalPackage.id,
    slug: rentalPackage.slug,
    kind: 'package',
    name: rentalPackage.name,
    category: 'package',
    serviceCategory: rentalPackage.serviceCategory,
    brand: 'Paket Sewa Balikpapan',
    dailyRate: rentalPackage.dailyRate,
    summary: 'Paket dengan komponen wajib yang dialokasikan bersama untuk seluruh periode.',
    imagePath: rentalPackage.imagePaths[0],
    availableCount,
    availability: availableCount === 0 ? 'unavailable' : availableCount === 1 ? 'limited' : 'available',
  }
}

export function searchCatalogState(
  state: DemoState,
  input: CatalogSearchInput,
): CatalogItemView[] {
  const items = [
    ...state.products.map((product) => toProductView(state, product, input.period)),
    ...state.packages.map((rentalPackage) => toPackageView(state, rentalPackage, input.period)),
  ]
  const filtered = items.filter((item) => {
    const categoryMatch =
      input.filters.categories.length === 0 ||
      input.filters.categories.includes(item.category) ||
      input.filters.categories.includes(item.serviceCategory)
    const brandMatch = input.filters.brands.length === 0 || input.filters.brands.includes(item.brand)
    const minMatch = input.filters.minDailyRate === undefined || item.dailyRate >= input.filters.minDailyRate
    const maxMatch = input.filters.maxDailyRate === undefined || item.dailyRate <= input.filters.maxDailyRate
    const availabilityMatch = !input.filters.availableOnly || item.availableCount > 0
    return categoryMatch && brandMatch && minMatch && maxMatch && availabilityMatch
  })

  return filtered.sort((a, b) => {
    if (input.filters.sort === 'price_asc') return a.dailyRate - b.dailyRate
    if (input.filters.sort === 'price_desc') return b.dailyRate - a.dailyRate
    return Number(b.availableCount > 0) - Number(a.availableCount > 0)
  })
}

export async function searchCatalog(
  input: CatalogSearchInput,
  mode: PreviewMode = 'normal',
): Promise<CatalogItemView[]> {
  await simulate(mode, `search-${mode}`)
  return searchCatalogState(getDemoStateService().snapshot(), input)
}

export async function getFeaturedItems(
  period: RentalPeriod,
  mode: PreviewMode = 'normal',
): Promise<CatalogItemView[]> {
  await simulate(mode, `featured-${mode}`)
  const state = getDemoStateService().snapshot()
  return state.products.filter((product) => product.isFeatured).slice(0, 4).map((product) =>
    toProductView(state, product, period),
  )
}

export async function getProductDetail(
  slug: string,
  period: RentalPeriod,
  mode: PreviewMode = 'normal',
): Promise<ProductDetailView | undefined> {
  await simulate(mode, `product-${slug}-${mode}`)
  const state = getDemoStateService().snapshot()
  const product = state.products.find((candidate) => candidate.slug === slug)
  if (!product) return undefined
  return {
    product,
    addOns: state.addOns.filter((addOn) => addOn.applicableTo.includes(product.id)),
    availableCount: availabilityCount(
      state,
      { id: `detail-${product.id}`, kind: 'product', itemId: product.id, quantity: 1 },
      period,
    ),
  }
}

export async function getPackageDetail(
  slug: string,
  period: RentalPeriod,
  mode: PreviewMode = 'normal',
): Promise<PackageDetailView | undefined> {
  await simulate(mode, `package-${slug}-${mode}`)
  const state = getDemoStateService().snapshot()
  const rentalPackage = state.packages.find((candidate) => candidate.slug === slug)
  if (!rentalPackage) return undefined
  return {
    rentalPackage,
    components: rentalPackage.components.flatMap((component) => {
      const product = state.products.find((candidate) => candidate.id === component.productId)
      return product ? [{ product, quantity: component.quantity }] : []
    }),
    addOns: state.addOns.filter((addOn) => addOn.applicableTo.includes(rentalPackage.id)),
    available:
      availabilityCount(
        state,
        { id: `detail-${rentalPackage.id}`, kind: 'package', itemId: rentalPackage.id, quantity: 1 },
        period,
      ) > 0,
  }
}

export function quoteSelection(
  item: Product | RentalPackage,
  quantity: number,
  period: RentalPeriod,
  selectedAddOns: AddOn[],
): PricingSnapshot {
  return quoteBooking(
    period,
    [
      { id: item.id, name: item.name, quantity, price: item.dailyRate, priceUnit: 'per_day' },
      ...selectedAddOns.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        quantity: 1,
        price: addOn.price,
        priceUnit: addOn.priceUnit,
      })),
    ],
    'demo-policy-v1',
  )
}

export function filterOptions(state: DemoState): { brands: string[]; categories: string[] } {
  return {
    brands: [...new Set(state.products.map((product) => product.brand))].sort(),
    categories: ['camera', 'lens', 'iphone', 'accessory', 'package'],
  }
}

export function emptyFilters(): CatalogFilters {
  return { categories: [], brands: [], availableOnly: false, sort: 'recommended' }
}
