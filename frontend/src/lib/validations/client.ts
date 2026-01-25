import { z } from 'zod';

// Basic E.164 regex (simple version)
const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const clientSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(phoneRegex, 'Phone must be in E.164 format (e.g., +1234567890)'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
