export interface FinancialProfile {
  name: string
  document: string
  email: string
  allowedMethods: ('card' | 'boleto' | 'external')[]
  externalInstructions: string
  notificationsEnabled: boolean
}
export interface BillingInvoice {
  allowedMethods?: Array<"card" | "boleto" | "external">
  id: string
  number: string
  status: string
  currency: string
  total: number
  amountPaid: number
  amountDue: number
  dueAt: string | null
  issuedAt: string | null
  subtotal?: number
  discountAmount?: number
  taxAmount?: number
}
export interface Receipt {
  id: string
  number: string
  source: string
  amount: number
  allocatedAmount: number
  unallocatedAmount: number
  method: string | null
  paidAt: string
  reversedAt: string | null
}
export interface InvoiceDetails {
  invoice: BillingInvoice
  items: {
    id: string
    type: string
    description: string
    quantity: number
    unitAmount: number
    amount: number
  }[]
  payments: {
    id: string
    status: string
    amount: number
    method: string | null
    provider: string
    createdAt: string
  }[]
  receipts: Receipt[]
  fiscalDocuments: {
    id: string
    number: string
    reference: string
    documentUrl: string | null
    issuedAt: string
  }[]
}
export interface CheckoutState {
  paymentId: string
  invoiceId: string
  status: string
  checkoutUrl: string | null
  boleto: {
    number: string | null
    url: string | null
    expiresAt: number | null
  } | null
  receiptNumber: string | null
  requiresReconciliation: boolean
}
export interface FinancialSession {
  expiresAt: string
  customerName: string
  allowedMethods: FinancialProfile['allowedMethods']
  externalInstructions: string
}
export interface BillingOverview {
  account: { id: string; status: string; currency: string }
  profile: FinancialProfile | null
  invoices: BillingInvoice[]
  page: number
  hasMore: boolean
  notifications: {
    id: string
    kind: string
    invoiceId: string
    attemptCount: number
    sentAt: string | null
    suppressedAt: string | null
    errorCode: string | null
  }[]
  grants: {
    id: string
    expiresAt: string
    revokedAt: string | null
    createdAt: string
  }[]
}
