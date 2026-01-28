export interface PrintableOrder {
    header: {
        tenantName: string;
        siteName: string;
        date: string; // ISO or Locale String
    };
    client: {
        name: string;
        phone: string;
        qrCodeValue: string; // The UUID
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
    };
}
