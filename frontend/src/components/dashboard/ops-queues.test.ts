import {
    computeOccupancyRate,
    deriveOpsQueues,
    normalizeOrdersResponse,
} from './ops-queues';

describe('deriveOpsQueues', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const recent = new Date().toISOString();

    it('counts process / store / deliver queues', () => {
        const result = deriveOpsQueues([
            { id: '1', status: 'CREATED', created_at: recent },
            { id: '2', status: 'CREATED', created_at: recent },
            { id: '3', status: 'READY', created_at: recent },
            { id: '4', status: 'STORED', created_at: recent },
            { id: '5', status: 'DELIVERED', created_at: recent },
        ]);

        expect(result.toProcess).toBe(2);
        expect(result.toStore).toBe(1);
        expect(result.toDeliver).toBe(1);
        expect(result.delayed).toBe(0);
        expect(result.recent).toHaveLength(4);
    });

    it('counts delayed active orders older than 24h', () => {
        const result = deriveOpsQueues([
            { id: '1', status: 'IN_PROGRESS', created_at: old },
            { id: '2', status: 'READY', created_at: recent },
        ]);

        expect(result.delayed).toBe(1);
        expect(result.toStore).toBe(1);
    });
});

describe('normalizeOrdersResponse', () => {
    it('handles array and { data } payloads', () => {
        expect(normalizeOrdersResponse([{ id: '1', status: 'CREATED' }])).toHaveLength(1);
        expect(normalizeOrdersResponse({ data: [{ id: '2', status: 'READY' }] })).toHaveLength(1);
        expect(normalizeOrdersResponse(null)).toEqual([]);
    });
});

describe('computeOccupancyRate', () => {
    it('computes occupied percentage', () => {
        expect(
            computeOccupancyRate([
                { status: 'OCCUPIED' },
                { status: 'FREE' },
                { status: 'OCCUPIED' },
                { status: 'FREE' },
            ]),
        ).toEqual({ rate: 50, occupied: 2, total: 4 });
    });

    it('returns 0 when no slots', () => {
        expect(computeOccupancyRate([])).toEqual({ rate: 0, occupied: 0, total: 0 });
    });
});
