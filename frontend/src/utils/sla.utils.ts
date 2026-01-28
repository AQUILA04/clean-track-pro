import { differenceInHours, isPast } from 'date-fns';

export type SLAStatus = 'danger' | 'warning' | 'normal';

/**
 * Calculates the SLA status based on the due date.
 * - 'danger': Past due
 * - 'warning': Due within 4 hours
 * - 'normal': Due in > 4 hours
 */
export const getSLAStatus = (dueDate: Date | string): SLAStatus => {
    const due = new Date(dueDate);
    const now = new Date();

    if (isPast(due)) {
        return 'danger';
    }

    const hoursUntilDue = differenceInHours(due, now);

    if (hoursUntilDue <= 4) {
        return 'warning';
    }

    return 'normal';
};
