import { describe, it, expect } from 'vitest';

describe('Gemini API Integration', () => {
    it('should handle PDF extraction errors gracefully', async () => {
        const response = await callGeminiAPI('invalid-pdf-file.pdf');
        expect(response).toEqual({
            error: 'Failed to extract text from PDF. The file might contain only images or be in an unsupported format.'
        });
    });

    it('should handle API errors when analyzing with AI', async () => {
        const response = await analyzeResume('invalid-data');
        expect(response).toEqual({
            error: 'Failed to analyze with AI'
        });
    });

    it('should handle non-2xx status codes from the API', async () => {
        const response = await checkPaymentStatus('invalid-status-id');
        expect(response).toEqual({
            error: 'Edge Function returned a non-2xx status code'
        });
    });
});