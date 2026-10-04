export type DateTimeIso = string
export type MoneyIdr = number
export type EntityId = string

export type ProductCategory = 'camera' | 'lens' | 'iphone' | 'accessory'
export type ServiceCategory = 'camera' | 'iphone'
export type InventoryLifecycle = 'active' | 'inactive' | 'retired' | 'lost'
export type PriceUnit = 'per_day' | 'one_time'
export type AvailabilityBlockReason = 'maintenance' | 'damage' | 'internal_use' | 'manual_hold'

export type BookingStatus =
  | 'draft'
  | 'waiting_payment'
  | 'confirmed'
  | 'picked_up'
  | 'returned'
  | 'completed'
  | 'expired'
  | 'cancelled'
  | 'rejected'

export type PaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'deposit_paid'
  | 'paid_in_full'
  | 'failed'
  | 'expired'
  | 'refunded'

export type GuaranteeStatus = 'required' | 'presented' | 'accepted' | 'returned'

export interface RentalPeriod {
  pickupAt: DateTimeIso
  returnAt: DateTimeIso
  timezone: 'Asia/Makassar'
}

export interface Product {
  id: EntityId
  slug: string
  category: ProductCategory
  serviceCategory: ServiceCategory
  name: string
  brand: string
  dailyRate: MoneyIdr
  summary: string
  specifications: Record<string, string>
  includedItems: string[]
  imagePaths: string[]
  isFeatured: boolean
}

export interface InventoryUnit {
  id: EntityId
  productId: EntityId
  assetLabel: string
  lifecycle: InventoryLifecycle
  variantTags: string[]
}

export interface PackageComponent {
  productId: EntityId
  quantity: number
  variantTags?: string[]
}

export interface RentalPackage {
  id: EntityId
  slug: string
  name: string
  serviceCategory: ServiceCategory
  dailyRate: MoneyIdr
  components: PackageComponent[]
  imagePaths: string[]
}

export interface AddOn {
  id: EntityId
  productId?: EntityId
  name: string
  price: MoneyIdr
  priceUnit: PriceUnit
  stockTracked: boolean
  applicableTo: EntityId[]
}

export interface Customer {
  id: EntityId
  name: string
  whatsapp: string
  email?: string
  isDemoCustomer: boolean
}

export interface CustomerContact {
  name: string
  whatsapp: string
  email?: string
}

export interface PricedLineSnapshot {
  lineId: EntityId
  name: string
  quantity: number
  priceUnit: PriceUnit
  unitPrice: MoneyIdr
  total: MoneyIdr
}

export interface PricingSnapshot {
  billableDays: number
  lines: PricedLineSnapshot[]
  rentalSubtotal: MoneyIdr
  depositDue: MoneyIdr
  depositPaid: MoneyIdr
  remainingBalance: MoneyIdr
  currency: 'IDR'
  policyVersion: string
}

export interface BookingLine {
  id: EntityId
  kind: 'product' | 'package' | 'addon'
  itemId: EntityId
  nameSnapshot: string
  quantity: number
  priceUnit: PriceUnit
  unitPriceSnapshot: MoneyIdr
  packageComponentsSnapshot?: PackageComponent[]
}

export interface Allocation {
  id: EntityId
  bookingId: EntityId
  bookingLineId: EntityId
  inventoryUnitId: EntityId
  componentProductId: EntityId
  releasedAt?: DateTimeIso
}

export interface BookingEvent {
  id: EntityId
  at: DateTimeIso
  actor: 'demo_customer' | 'demo_admin' | 'system'
  label: string
}

export interface Booking {
  id: EntityId
  reference: string
  customerId: EntityId
  primaryServiceCategory: ServiceCategory
  period: RentalPeriod
  createdAt: DateTimeIso
  updatedAt: DateTimeIso
  holdExpiresAt?: DateTimeIso
  status: BookingStatus
  paymentStatus: PaymentStatus
  guaranteeStatus: GuaranteeStatus
  lines: BookingLine[]
  allocations: Allocation[]
  pricing: PricingSnapshot
  customerSnapshot: CustomerContact
  timeline: BookingEvent[]
  note?: string
}

export interface AvailabilityBlock {
  id: EntityId
  inventoryUnitId: EntityId
  reason: AvailabilityBlockReason
  period: RentalPeriod
  note?: string
  createdAt: DateTimeIso
}

export interface DemoScenario {
  id: string
  label: string
  asOf: DateTimeIso
  startRoute: string
  mode: 'normal' | 'loading' | 'recoverable_error' | 'final_conflict' | 'empty'
}

export interface LocationAndPolicyCopy {
  timezone: 'Asia/Makassar'
  operatingHours: string
  pickupLocation: string
  guaranteeNotice: string
  policyVersion: string
  provisional: boolean
}

export interface DemoState {
  schemaVersion: number
  activeScenarioId: string
  bookingSequence: number
  products: Product[]
  inventoryUnits: InventoryUnit[]
  packages: RentalPackage[]
  addOns: AddOn[]
  customers: Customer[]
  bookings: Booking[]
  availabilityBlocks: AvailabilityBlock[]
  demoScenarios: DemoScenario[]
  locationAndPolicyCopy: LocationAndPolicyCopy
}

export interface QuoteLineInput {
  id: EntityId
  name: string
  quantity: number
  price: MoneyIdr
  priceUnit: PriceUnit
}

export interface BookingSelectionLine {
  id: EntityId
  kind: 'product' | 'package' | 'addon'
  itemId: EntityId
  quantity: number
}

export interface AllocationRequirement {
  bookingLineId: EntityId
  productId: EntityId
  quantity: number
  variantTags?: string[]
}

export interface AllocationResult {
  available: boolean
  allocations: Omit<Allocation, 'id' | 'bookingId'>[]
  unavailableRequirement?: AllocationRequirement
}

export type CatalogItemKind = 'product' | 'package'
export type AvailabilityLabel = 'available' | 'limited' | 'unavailable'

export interface CatalogItemView {
  id: EntityId
  slug: string
  kind: CatalogItemKind
  name: string
  category: ProductCategory | 'package'
  serviceCategory: ServiceCategory
  brand: string
  dailyRate: MoneyIdr
  summary: string
  imagePath?: string
  availableCount: number
  availability: AvailabilityLabel
}

export interface CatalogFilters {
  categories: string[]
  brands: string[]
  minDailyRate?: MoneyIdr
  maxDailyRate?: MoneyIdr
  availableOnly: boolean
  sort: 'recommended' | 'price_asc' | 'price_desc'
}

export interface CatalogSearchInput {
  period: RentalPeriod
  filters: CatalogFilters
}

export interface CheckoutSelection {
  kind: 'product' | 'package'
  itemId: EntityId
  quantity: number
  addOnIds: EntityId[]
  period: RentalPeriod
}

export interface CreateBookingInput extends CheckoutSelection {
  customer: CustomerContact
  note?: string
  termsAccepted: true
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: 'unavailable' | 'invalid_selection' }
