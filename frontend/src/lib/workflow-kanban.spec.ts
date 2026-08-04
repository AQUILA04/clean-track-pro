import {
    getKanbanColumn,
    getTargetStatusForColumn,
    groupOrdersByColumn,
    isExpressOrder,
    orderNeedsReceptionSlot,
    type WorkflowOrder,
} from './workflow-kanban';

describe('workflow-kanban helpers', () => {
    it('maps statuses to columns', () => {
        expect(getKanbanColumn('CREATED')).toBe('to_process');
        expect(getKanbanColumn('IN_PROGRESS')).toBe('in_progress');
        expect(getKanbanColumn('READY')).toBe('ready');
        expect(getKanbanColumn('STORED')).toBe('ready');
        expect(getKanbanColumn('DELIVERED')).toBeNull();
    });

    it('allows only forward transitions', () => {
        expect(getTargetStatusForColumn('CREATED', 'in_progress')).toBe('IN_PROGRESS');
        expect(getTargetStatusForColumn('IN_PROGRESS', 'ready')).toBe('READY');
        expect(getTargetStatusForColumn('CREATED', 'ready')).toBeNull();
        expect(getTargetStatusForColumn('READY', 'in_progress')).toBeNull();
        expect(getTargetStatusForColumn('IN_PROGRESS', 'in_progress')).toBeNull();
    });

    it('groups orders by column', () => {
        const orders = [
            { id: '1', status: 'CREATED' },
            { id: '2', status: 'IN_PROGRESS' },
            { id: '3', status: 'READY' },
            { id: '4', status: 'STORED' },
            { id: '5', status: 'DELIVERED' },
        ] as WorkflowOrder[];

        const grouped = groupOrdersByColumn(orders);
        expect(grouped.to_process.map((o) => o.id)).toEqual(['1']);
        expect(grouped.in_progress.map((o) => o.id)).toEqual(['2']);
        expect(grouped.ready.map((o) => o.id)).toEqual(['3', '4']);
    });

    it('detects express and missing reception slot', () => {
        expect(isExpressOrder({ service_level: 'EXPRESS' })).toBe(true);
        expect(isExpressOrder({ service_level: 'NORMAL' })).toBe(false);
        expect(orderNeedsReceptionSlot({ status: 'CREATED', slot_label: null })).toBe(true);
        expect(orderNeedsReceptionSlot({ status: 'CREATED', slot_label: 'A-01' })).toBe(false);
        expect(orderNeedsReceptionSlot({ status: 'IN_PROGRESS', slot_label: null })).toBe(false);
    });
});
