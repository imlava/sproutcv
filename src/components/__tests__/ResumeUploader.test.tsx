import { render, screen, fireEvent } from '@testing-library/react';
import ResumeUploader from '../ResumeUploader';
import * as documentService from '../../services/DocumentProcessingService';

jest.mock('../../services/DocumentProcessingService');

describe('ResumeUploader', () => {
    test('displays error message when PDF extraction fails', async () => {
        documentService.uploadPDF.mockRejectedValueOnce(new Error('Failed to extract text from PDF. The file might contain only images or be in an unsupported format.'));

        render(<ResumeUploader />);

        const uploadButton = screen.getByText(/upload/i);
        fireEvent.click(uploadButton);

        const errorMessage = await screen.findByText(/Failed to extract text from PDF/i);
        expect(errorMessage).toBeInTheDocument();
    });
});