import { renderHook, act, waitFor } from '@testing-library/react';
import { OrderDraftProvider, useOrderDraft } from './order-draft.context';
import { ToastProvider } from '../components/ui/simple-toast';
import { OrdersService } from '../services/orders.service';
import { PrintingService } from '../services/printing.service';

jest.mock('next-auth/react', () => {
  // Stable reference — a new session object each render retriggers the tenant/site effect.
  const mockSession = { data: { user: { tenant_id: 'test-tenant', site_id: 'test-site' } } };
  return { useSession: () => mockSession };
});

jest.mock('../services/tenant.service', () => ({
  TenantService: {
    getCurrentTenant: jest.fn().mockResolvedValue({
      express_multiplier: 1.5,
      express_sla_hours: 24,
      currency: 'XOF',
      name: 'Test Tenant',
    }),
  },
}));
jest.mock('../services/site.service', () => ({
  SiteService: {
    getById: jest.fn().mockResolvedValue({ id: 'test-site', name: 'Test Site' }),
  },
}));
jest.mock('../services/orders.service', () => ({
  OrdersService: {
    create: jest.fn(),
  },
}));
jest.mock('../services/printing.service', () => ({
  PrintingService: {
    printOrder: jest.fn(),
  },
}));

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

  it('initializes with default values', async () => {
    const { result } = renderHook(() => useOrderDraft(), { wrapper });
    await waitFor(() => {
      expect(result.current.tenantConfig).toBeDefined();
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.isExpress).toBe(false);
  });

  it('clearClient removes client without clearing items', async () => {
    const { result } = renderHook(() => useOrderDraft(), { wrapper });
    await waitFor(() => {
      expect(result.current.tenantConfig).toBeDefined();
    });

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
    await waitFor(() => {
      expect(result.current.tenantConfig).toBeDefined();
    });

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

    (OrdersService.create as jest.Mock).mockResolvedValue({
      data: {
        id: 'order-uuid',
        items: [
          { id: 'item-uuid-1', article_type_id: 'article-1', service_definition_id: 'service-1' },
        ],
      },
    });

    await act(async () => {
      await result.current.validateOrder();
    });

    expect(OrdersService.create).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'client-123',
      items: expect.arrayContaining([
        expect.objectContaining({ article_type_id: 'article-1', quantity: 1 }),
      ]),
    }));

    await waitFor(() => {
      expect(result.current.pendingReceipt).toEqual(expect.objectContaining({
        client: expect.objectContaining({ qrCodeValue: 'order-uuid' }),
        items: expect.arrayContaining([
          expect.objectContaining({ qrCodeValue: 'item-uuid-1' }),
        ]),
      }));
      expect(result.current.pendingStorageOrderId).toBe('order-uuid');
    });

    expect(PrintingService.printOrder).not.toHaveBeenCalled();
  });
});
