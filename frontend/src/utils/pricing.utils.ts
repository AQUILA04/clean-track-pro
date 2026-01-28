import { addHours, nextMonday, setHours, setMinutes, isBefore, startOfHour } from 'date-fns';

export const STANDARD_SLA_HOURS = 48;

export interface PricingItem {
    price: number;
    quantity: number;
}

export interface TenantConfig {
    express_multiplier?: number;
    express_sla_hours?: number;
}

/**
 * Calculates the total order price, applying express multiplier if active.
 * 
 * @param items List of items with price and quantity
 * @param isExpress Whether express mode is active
 * @param config Tenant configuration containing multiplier
 * @returns Total price rounded to 2 decimal places
 */
export const calculateOrderTotal = (
    items: PricingItem[],
    isExpress: boolean,
    config: TenantConfig
): number => {
    const baseTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!isExpress) {
        return parseFloat(baseTotal.toFixed(2)); // Round to 2 decimals
    }

    // Default multiplier to 1.0 (no change) if not configured
    const multiplier = config.express_multiplier && config.express_multiplier > 0
        ? parseFloat(config.express_multiplier.toString())
        : 1.0;

    const total = baseTotal * multiplier;
    return parseFloat(total.toFixed(2));
};

/**
 * Calculates the due date based on express mode SLA.
 * 
 * @param isExpress Whether express mode is active
 * @param config Tenant configuration containing SLA hours
 * @param fromDate Optional starting date (defaults to now)
 * @returns Calculated Due Date
 */
export const calculateDueDate = (
    isExpress: boolean,
    config: TenantConfig,
    fromDate: Date = new Date()
): Date => {
    // Default standard SLA: 48 hours? Or maybe 72? 
    // Story doesn't strictly specify standard SLA, let's assume +48h for now as per AC3 hint 
    // "The due_date reverts to the standard calculation (e.g., +48h...)"
    // "The due_date reverts to the standard calculation (e.g., +48h...)"

    const slaHours = isExpress
        ? (config.express_sla_hours || 24)
        : STANDARD_SLA_HOURS;

    let dueDate = addHours(fromDate, slaHours);

    // Basic business hour logic (optional but good for MVP):
    // If due date falls on Sunday (0), move to Monday 9am?
    // For now, keep it simple as per AC3: "rounded to next open hour if necessary, or just simple addition for MVP"
    // We will do simple addition but ensure we don't return seconds/millis precision if not needed.

    return dueDate;
};
