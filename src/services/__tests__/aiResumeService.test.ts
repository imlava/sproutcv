import { describe, it, expect } from 'vitest';

describe('AI Resume Service', () => {
    it('should handle PDF extraction errors gracefully', async () => {
        const result = await analyzeResume('path/to/pdf/with/images');
        expect(result).toEqual({ error: 'Failed to extract text from PDF. The file might contain only images or be in an unsupported format.' });
    });

    it('should handle Gemini API non-2xx status codes', async () => {
        const result = await analyzeResume('path/to/pdf/that/triggers/api/error');
        expect(result).toEqual({ error: 'Failed to analyze with AI' });
    });
});