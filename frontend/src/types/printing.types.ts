export interface PrintableOrder {
    header: {
        tenantName: string;
        siteName: string;
        date: string; // ISO or Locale String
        logoUrl?: string | null;
        address?: string | null;
        legalId?: string | null;
        vatNumber?: string | null;
    };
    client: {
        name: string;
        phone: string;
        qrCodeValue: string; // The UUID (QR content)
        reference?: string | null; // Human-readable REF-…
    };
    items: Array<{
        label: string;
        service: string;
        price: number;
        qrCodeValue: string; // Item UUID
    }>;
    totals: {
        totalPrice: number;
        currency: string;
        dueDate: string;
        amountPaid?: number;
        balanceDue?: number;
    };
}
