import { SlotType } from '@/services/storage.service';

const slotTypeLabels: Record<SlotType, string> = {
    [SlotType.RECEPTION]: 'réception',
    [SlotType.DELIVERY]: 'livraison',
};

const orderStatusLabels: Record<string, string> = {
    CREATED: 'créée',
    IN_PROGRESS: 'en traitement',
    READY: 'prête',
    STORED: 'rangée (livraison)',
    DELIVERED: 'livrée',
    CANCELLED: 'annulée',
};

export function getExpectedSlotTypeForStatus(status: string): SlotType | null {
    if (status === 'CREATED') return SlotType.RECEPTION;
    if (status === 'READY' || status === 'STORED') return SlotType.DELIVERY;
    return null;
}

export function getStorageMismatchMessage(
    slotName: string,
    actualSlotType: SlotType,
    expectedSlotType: SlotType,
    orderStatus?: string,
): string {
    const actual = slotTypeLabels[actualSlotType];
    const expected = slotTypeLabels[expectedSlotType];
    const statusLabel = orderStatus ? orderStatusLabels[orderStatus] ?? orderStatus.toLowerCase() : null;

    let hint = '';
    if (orderStatus === 'CREATED') {
        hint = 'Rangez cette commande dans un rayon de réception (ex. A-01, A-02).';
    } else if (orderStatus === 'READY') {
        hint = 'Après traitement, rangez-la dans un rayon de livraison (ex. B-01, B-02).';
    } else if (orderStatus === 'IN_PROGRESS') {
        hint = 'Terminez le traitement et marquez la commande comme prête avant le rangement livraison.';
    }

    const statusPart = statusLabel ? ` (statut : ${statusLabel})` : '';

    return `Le rayon ${slotName} est un rayon de ${actual}, pas de ${expected}${statusPart}. ${hint}`.trim();
}

export function getStorageStatusBlockedMessage(orderStatus: string): string {
    const statusLabel = orderStatusLabels[orderStatus] ?? orderStatus.toLowerCase();

    if (orderStatus === 'IN_PROGRESS') {
        return `Impossible de ranger une commande en traitement. Marquez-la d'abord comme prête.`;
    }
    if (orderStatus === 'DELIVERED' || orderStatus === 'CANCELLED') {
        return `Impossible de ranger une commande ${statusLabel}.`;
    }

    return `Le statut « ${statusLabel} » ne permet pas de ranger cette commande pour le moment.`;
}
