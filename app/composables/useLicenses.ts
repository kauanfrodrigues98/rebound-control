import type {
  ActivateLicenseResponse,
  CurrentLicenseResponse,
  LicenseListItem,
  LicensePlan,
  LicensePlansResponse,
  LicensesResponse,
} from '~/types/licensing';

export interface LicenseActivationPayload {
  customerId: string;
  contractId: string;
  installationName: string;
  expiresAt: string;
  planId?: string;
  entitlements?: Record<string, boolean | number | string>;
}

export interface LicenseReissuePayload {
  expiresAt: string;
  planId?: string;
  entitlements?: Record<string, boolean | number | string>;
}

export interface LicensePlanPayload {
  id: string;
  name: string;
  description: string;
  cadence: LicensePlan['cadence'];
  featured: boolean;
  priceLabel: string;
  entitlements: Record<string, boolean | number | string>;
  active: boolean;
  sortOrder: number;
}

export function useLicenses() {
  const listPlans = (includeArchived = false) =>
    useFetch<LicensePlansResponse>('/api/plans', {
      query: { includeArchived },
      default: () => ({ plans: [] }),
    });

  const createPlan = (payload: LicensePlanPayload) =>
    $fetch<LicensePlan>('/api/plans', {
      method: 'POST',
      body: payload,
    });

  const updatePlan = (planId: string, payload: LicensePlanPayload) =>
    $fetch<LicensePlan>(`/api/plans/${planId}`, {
      method: 'PUT',
      body: payload,
    });

  const archivePlan = (planId: string) =>
    $fetch<LicensePlan>(`/api/plans/${planId}`, {
      method: 'DELETE',
    });

  const listLicenses = () =>
    useFetch<LicensesResponse>('/api/licenses', {
      default: () => ({ licenses: [] }),
    });

  const activateLicense = (payload: LicenseActivationPayload) =>
    $fetch<ActivateLicenseResponse>('/api/licenses', {
      method: 'POST',
      body: payload,
    });

  const getCurrentLicense = (licenseInstanceId: string) =>
    $fetch<CurrentLicenseResponse>(
      `/api/licenses/${licenseInstanceId}/current`,
    );

  const reissueLicense = (
    licenseInstanceId: string,
    payload: LicenseReissuePayload,
  ) =>
    $fetch<CurrentLicenseResponse>(
      `/api/licenses/${licenseInstanceId}/reissue`,
      {
        method: 'POST',
        body: payload,
      },
    );

  const getLicenseHealth = (license: LicenseListItem) => {
    const now = Date.now();
    const expiresAt = new Date(license.expiresAt).getTime();
    const gracePeriodUntil = new Date(license.gracePeriodUntil).getTime();

    if (license.status !== 'active') {
      return 'blocked';
    }

    if (expiresAt < now && gracePeriodUntil >= now) {
      return 'grace';
    }

    if (expiresAt < now) {
      return 'expired';
    }

    return 'healthy';
  };

  return {
    activateLicense,
    archivePlan,
    createPlan,
    getCurrentLicense,
    getLicenseHealth,
    listLicenses,
    listPlans,
    reissueLicense,
    updatePlan,
  };
}
