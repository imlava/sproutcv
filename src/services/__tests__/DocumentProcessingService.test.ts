import { describe, it, expect } from 'vitest';

describe('DocumentProcessingService', () => {
    it('should handle PDF extraction error for files with only images', async () => {
        const result = await processPDF('path/to/image-only.pdf');
        expect(result).toEqual({
            success: false,
            error: 'Failed to extract text from PDF. The file might contain only images or be in an unsupported format. Please try copying and pasting the text manually.'
        });
    });

    it('should handle PDF extraction error for unsupported formats', async () => {
        const result = await processPDF('path/to/unsupported-format.txt');
        expect(result).toEqual({
            success: false,
            error: 'Failed to extract text from PDF. The file might contain only images or be in an unsupported format. Please try copying and pasting the text manually.'
        });
    });
});