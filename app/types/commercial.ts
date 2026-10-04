export interface CommercialPriceVersion {
  id: string
  commercialPlanId: string
  amount: number
  currency: string
  intervalMonths: number
  effectiveAt: string
  reason: string
  createdBy: string
  createdAt: string
}
export interface CommercialPriceCatalog {
  commercialPlanId: string | null
  licensingPlanId: string
  current: CommercialPriceVersion | null
  versions: CommercialPriceVersion[]
  page: number
  hasMore: boolean
}
