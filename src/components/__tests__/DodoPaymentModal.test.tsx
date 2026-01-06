import { render, screen, waitFor } from '@testing-library/react';
import DodoPaymentModal from '../DodoPaymentModal';
import { fetchPaymentStatus } from '../../services/paymentService';

jest.mock('../../services/paymentService');

describe('DodoPaymentModal', () => {
    it('handles 404 error on payment status check', async () => {
        fetchPaymentStatus.mockRejectedValueOnce(new Error('FunctionsHttpError: Edge Function returned a non-2xx status code'));

        render(<DodoPaymentModal />);

        await waitFor(() => {
            expect(screen.getByText(/Status check error/i)).toBeInTheDocument();
        });
    });
});