import axios from 'axios';
import { PrintableOrder } from '../types/printing.types';

export class PrintingService {
    private static getProxyUrl(): string {
        return process.env.NEXT_PUBLIC_PRINT_PROXY_URL || 'http://localhost:8080';
    }

    static async printOrder(order: PrintableOrder): Promise<void> {
        const url = `${this.getProxyUrl()}/print-order`;
        try {
            await axios.post(url, order);
        } catch (error) {
            // Log the error for debugging
            console.error('PrintingService Error:', error);

            // Re-throw to allow caller (UI) to handle it (show Toast)
            // We could enhance the error here if needed, but Axios errors are usually descriptive enough for "Network Error"
            throw error;
        }
    }
}
