import { renderHook, act, waitFor } from '@testing-library/react';
import { OrderDraftProvider, useOrderDraft } from './order-draft.context';
import { ToastProvider } from '../components/ui/simple-toast';
import { OrdersService } from '../services/orders.service';
import { PrintingService } from '../services/printing.service';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { tenant_id: 'test-tenant', site_id: 'test-site' } } }),
}));

jest.mock('../services/tenant.service', () => ({
  TenantService: {
    getCurrentTenant: jest.fn().mockResolvedValue({ express_multiplier: 1.5, express_sla_hours: 24 })
  }
}));
jest.mock('../services/orders.service');
jest.mock('../services/printing.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <OrderDraftProvider>{children}</OrderDraftProvider>
  </ToastProvider>
);

describe('OrderDraftContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useOrderDraft(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.isExpress).toBe(false);
  });

  it('clearClient removes client without clearing items', () => {
    const { result } = renderHook(() => useOrderDraft(), { wrapper });

    act(() => {
      result.current.setClient('client-123', 'John Doe');
      result.current.addItem({
        articleId: 'article-1',
        articleName: 'Shirt',
        serviceId: 'service-1',
        serviceName: 'Wash',
        price: 10,
      });
    });

    act(() => {
      result.current.clearClient();
    });

    expect(result.current.clientId).toBeNull();
    expect(result.current.clientName).toBeNull();
    expect(result.current.items).toHaveLength(1);
  });

  it('validateOrder should create order and expose receipt preview', async () => {
    const { result } = renderHook(() => useOrderDraft(), { wrapper });

    // Add client and item
    act(() => {
      result.current.setClient('client-123', 'John Doe');
      result.current.addItem({
        articleId: 'article-1',
        articleName: 'Shirt',
        serviceId: 'service-1',
        serviceName: 'Wash',
        price: 10
      });
    });

    // Mock Order Creation Response
    (OrdersService.create as jest.Mock).mockResolvedValue({
      data: {
        id: 'order-uuid',
        items: [
          { id: 'item-uuid-1', article_type_id: 'article-1', service_definition_id: 'service-1' }
        ]
      }
    });

    // Execute Validate
    await act(async () => {
      await result.current.validateOrder();
    });

    // Verify OrdersService call
    expect(OrdersService.create).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'client-123',
      items: expect.arrayContaining([
        expect.objectContaining({ article_type_id: 'article-1', quantity: 1 })
      ])
    }));

    // Verify receipt preview payload (printing is user-triggered from modal)
    await waitFor(() => {
      expect(result.current.pendingReceipt).toEqual(expect.objectContaining({
        client: expect.objectContaining({ qrCodeValue: 'order-uuid' }),
        items: expect.arrayContaining([
          expect.objectContaining({ qrCodeValue: 'item-uuid-1' })
        ])
      }));
      expect(result.current.pendingStorageOrderId).toBe('order-uuid');
    });

    expect(PrintingService.printOrder).not.toHaveBeenCalled();
  });
});
