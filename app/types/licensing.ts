export interface LicenseListItem {
  licenseInstanceId: string;
  customerId: string;
  contractId: string;
  installationName: string;
  installationFingerprint: string;
  licenseKey?: string;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | string;
  version: number;
  issuedAt: string;
  expiresAt: string;
  gracePeriodUntil: string;
  lastCheckInAt?: string;
}

export interface LicensesResponse {
  licenses: LicenseListItem[];
}

export interface LicensePlan {
  id: string;
  name: string;
  description: string;
  cadence: 'monthly' | 'annual' | 'contract';
  featured: boolean;
  priceLabel: string;
  entitlements: Record<string, boolean | number | string>;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LicensePlansResponse {
  plans: LicensePlan[];
}

export interface ActivateLicenseResponse {
  licenseInstanceId: string;
  licenseKey: string;
  licenseToken: string;
  installationFingerprint: string;
  status: string;
  version: number;
  expiresAt: string;
  gracePeriodUntil: string;
  entitlements: Record<string, boolean | number | string>;
  signature: string;
}

export interface CurrentLicenseResponse {
  licenseInstanceId: string;
  licenseKey?: string;
  licenseToken?: string;
  installationFingerprint?: string;
  status: string;
  version: number;
  expiresAt: string;
  gracePeriodUntil: string;
  entitlements: Record<string, boolean | number | string>;
  signature: string;
}
