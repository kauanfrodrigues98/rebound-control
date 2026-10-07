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
  deployment: LicensePlan['deployment'];
  featured: boolean;
  priceLabel: string;
  entitlements: Record<string, boolean | number | string>;
  active: boolean;
  sortOrder: number;
}

export function useLicenses() {
  const toast = useToast();
  async function requestOperation<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error: unknown) {
      toast.add({
        title: 'Não foi possível concluir a operação de licenciamento',
        description: 'Confira os dados, sua permissão e a disponibilidade do serviço.',
        color: 'error',
        icon: 'i-lucide-circle-alert',
        duration: 8000,
      });
      throw error;
    }
  }

  const listPlans = (includeArchived = false) =>
    useFetch<LicensePlansResponse>('/api/plans', {
      query: { includeArchived },
      default: () => ({ plans: [] }),
    });

  const createPlan = (payload: LicensePlanPayload) =>
    requestOperation(() => $fetch<LicensePlan>('/api/plans', {
      method: 'POST',
      body: payload,
    }));

  const updatePlan = (planId: string, payload: LicensePlanPayload) =>
    requestOperation(() => $fetch<LicensePlan>(`/api/plans/${planId}`, {
      method: 'PUT',
      body: payload,
    }));

  const archivePlan = (planId: string) =>
    requestOperation(() => $fetch<LicensePlan>(`/api/plans/${planId}`, {
      method: 'DELETE',
    }));

  const listLicenses = () =>
    useFetch<LicensesResponse>('/api/licenses', {
      default: () => ({ licenses: [] }),
    });

  const activateLicense = (payload: LicenseActivationPayload) =>
    requestOperation(() => $fetch<ActivateLicenseResponse>('/api/licenses', {
      method: 'POST',
      body: payload,
    }));

  const getCurrentLicense = (licenseInstanceId: string) =>
    requestOperation(() => $fetch<CurrentLicenseResponse>(
      `/api/licenses/${licenseInstanceId}/current`,
    ));

  const reissueLicense = (
    licenseInstanceId: string,
    payload: LicenseReissuePayload,
  ) =>
    requestOperation(() => $fetch<CurrentLicenseResponse>(
      `/api/licenses/${licenseInstanceId}/reissue`,
      {
        method: 'POST',
        body: payload,
      },
    ));

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
