export interface ContractRecurrence {
  id: string
  firstCycleOn: string
  nextCycleOn: string | null
  enabled: boolean
  billingScheduleId: string | null
  lastInvoiceId: string | null
  lastError: string | null
  createdAt: string
}
