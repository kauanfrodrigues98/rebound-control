export interface ContractTerms {
  sourceRevisionId: string
  sourceVersion: number
  customerId: string
  contractId: string
  planId: string
  priceVersionId: string | null
  pricing: "catalog" | "custom"
  amount: number
  setupAmount: number
  currency: "BRL"
  intervalMonths: number
  dueDay: number
  allowedMethods: Array<"card" | "boleto" | "external">
  startsOn: string
  endsOn: string | null
  effectiveAt: string
  reason: string
  entitlements: Record<string, boolean | number | string>
}
export interface ContractRevision {
  id: string
  sourceVersion: number
  terms: ContractTerms
  status: "pending" | "synced"
  attempts: number
  billingVersionId: string | null
  syncedAt: string | null
  lastError: string | null
  createdAt: string
}
export interface ContractRevisions {
  versions: ContractRevision[]
  current: ContractRevision | null
  page: number
  hasMore: boolean
}
