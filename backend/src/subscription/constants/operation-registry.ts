import { OperationKey } from '../enums/operation-key.enum';
import { UsagePeriod } from '../enums/usage-period.enum';

export interface OperationRegistryEntry {
    key: OperationKey;
    label: string;
    description: string;
    type: 'capacity' | 'usage';
    periods: UsagePeriod[];
}

export const OPERATION_REGISTRY: OperationRegistryEntry[] = [
    {
        key: OperationKey.ORDERS_CREATE,
        label: 'Commandes créées',
        description: 'Volume de commandes validées',
        type: 'usage',
        periods: [UsagePeriod.DAILY, UsagePeriod.WEEKLY, UsagePeriod.MONTHLY],
    },
    {
        key: OperationKey.SITES_CAPACITY,
        label: 'Sites / agences',
        description: 'Nombre maximum de sites actifs',
        type: 'capacity',
        periods: [UsagePeriod.NONE],
    },
    {
        key: OperationKey.USERS_CAPACITY,
        label: 'Utilisateurs',
        description: 'Nombre maximum d\'utilisateurs invités',
        type: 'capacity',
        periods: [UsagePeriod.NONE],
    },
    {
        key: OperationKey.STORAGE_SLOTS_CAPACITY,
        label: 'Emplacements de stockage',
        description: 'Nombre maximum de slots configurés',
        type: 'capacity',
        periods: [UsagePeriod.NONE],
    },
];
