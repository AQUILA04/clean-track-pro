import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { OrdersService } from '@/services/orders.service';
import { format, subDays } from 'date-fns';

// Mock OrdersService
jest.mock('@/services/orders.service', () => ({
    OrdersService: {
        getDashboardStats: jest.fn()
    }
}));

describe('DashboardPage', () => {
    const mockStats = {
        ordersToday: 10,
        revenueToday: 1000,
        pendingOrders: 5
    };

    beforeEach(() => {
        (OrdersService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders dashboard with initial "Today" stats', async () => {
        render(<DashboardPage />);

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await waitFor(() => {
            expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        });

        // Verify initial call
        const expectedEnd = format(new Date(), 'yyyy-MM-dd');
        const expectedStart = format(new Date(), 'yyyy-MM-dd');
        expect(OrdersService.getDashboardStats).toHaveBeenCalledWith(expectedStart, expectedEnd, timezone);

        expect(screen.getByText('Orders (Today)')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();

        // Check active button
        const todayButton = screen.getByText('Today');
        expect(todayButton).toHaveClass('bg-[#1A5AD7]');
    });

    it('fetches data for "Last 7 Days" when clicked', async () => {
        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        });

        const last7DaysButton = screen.getByText('Last 7 Days');
        fireEvent.click(last7DaysButton);

        const expectedEnd = format(new Date(), 'yyyy-MM-dd');
        const expectedStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await waitFor(() => {
            expect(OrdersService.getDashboardStats).toHaveBeenCalledWith(expectedStart, expectedEnd, timezone);
        });

        expect(last7DaysButton).toHaveClass('bg-[#1A5AD7]');
    });

    it('fetches data for "Last 30 Days" when clicked', async () => {
        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        });

        const last30DaysButton = screen.getByText('Last 30 Days');
        fireEvent.click(last30DaysButton);

        const expectedEnd = format(new Date(), 'yyyy-MM-dd');
        const expectedStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await waitFor(() => {
            expect(OrdersService.getDashboardStats).toHaveBeenCalledWith(expectedStart, expectedEnd, timezone);
        });
    });

    it('verifies timezone is valid before API call', async () => {
        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        });

        // Verify timezone was passed and is a non-empty string
        const callArgs = (OrdersService.getDashboardStats as jest.Mock).mock.calls[0];
        const timezone = callArgs[2];

        expect(timezone).toBeTruthy();
        expect(typeof timezone).toBe('string');
        expect(timezone.length).toBeGreaterThan(0);
    });

    it('displays error message when API call fails', async () => {
        const errorMessage = 'Failed to load dashboard statistics. Please try again later.';
        (OrdersService.getDashboardStats as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });
});
