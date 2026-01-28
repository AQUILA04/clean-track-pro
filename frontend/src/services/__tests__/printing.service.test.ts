import axios from 'axios';
import { PrintingService } from '../printing.service';
import { PrintableOrder } from '../../types/printing.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PrintingService', () => {
    const mockOrder: PrintableOrder = {
        header: {
            tenantName: 'CleanTrack',
            siteName: 'Main St',
            date: '2023-11-20T10:00:00Z'
        },
        client: {
            name: 'John Doe',
            phone: '1234567890',
            qrCodeValue: 'order-123'
        },
        items: [
            {
                label: 'Shirt',
                service: 'Wash',
                price: 10,
                qrCodeValue: 'item-1'
            }
        ],
        totals: {
            totalPrice: 10,
            currency: 'XOF',
            dueDate: '2023-11-23T10:00:00Z'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_PRINT_PROXY_URL = 'http://localhost:8090';
    });

    it('should send a POST request with the correct payload to the proxy', async () => {
        mockedAxios.post.mockResolvedValueOnce({ status: 200 });

        await PrintingService.printOrder(mockOrder);

        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:8090/print-order', mockOrder);
    });

    it('should throw an error if the request fails', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

        await expect(PrintingService.printOrder(mockOrder)).rejects.toThrow('Network Error');
    });

    it('should use basic fallback URL if env var is missing', async () => {
        delete process.env.NEXT_PUBLIC_PRINT_PROXY_URL;
        mockedAxios.post.mockResolvedValueOnce({ status: 200 });

        await PrintingService.printOrder(mockOrder);

        // Assuming default is http://localhost:8080 as per dev notes if checking explicitly
        // Or if we implemented a fallback.
        // Let's assume we implement a fallback to 8080 as per dev notes.
        expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:8080/print-order', mockOrder);
    });
});
