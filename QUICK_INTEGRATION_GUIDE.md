# Quick Integration Guide - Enhanced Services

## ✅ Deployment Complete!

All enhanced features have been deployed and are ready to use.

### What Was Done

1. ✅ **Environment Configuration** - Updated `.env.example` with Sentry DSN
2. ✅ **Edge Function Deployed** - `gemini-stream-analyzer` is live on Supabase
3. ✅ **Sentry Initialized** - Error tracking enabled in `src/main.tsx`
4. ✅ **Integration Helpers** - Created `src/integrations/enhancedServices.ts`
5. ✅ **Test Component** - Created `src/components/testing/QuickEnhancedTest.tsx`

---

## 🚀 How to Use

### Option 1: Quick Test (Recommended First)

Add the test component to any existing page:

```tsx
import { QuickEnhancedTest } from '@/components/testing/QuickEnhancedTest';

// In your component:
<QuickEnhancedTest />
```

This will let you:
- Test file uploads with OCR
- Test streaming analysis
- Check system health
- See all features working

### Option 2: Integrate into Existing Page

In `AIResumeAnalyzerPage.tsx`, replace existing functions:

#### Step 1: Add imports at the top

```tsx
import { 
  handleEnhancedFileUpload, 
  handleEnhancedAnalysis,
  useEnhancedAnalysis,
  getSystemHealth 
} from '@/integrations/enhancedServices';
import { StreamingProgress } from '@/components/analysis/StreamingProgress';
```

#### Step 2: Replace file upload handler

**OLD:**
```tsx
const handleFileUpload = async (acceptedFiles: File[]) => {
  // ... existing code with extractTextFromPDF
};
```

**NEW:**
```tsx
const handleFileUpload = async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  setIsProcessingFile(true);
  
  try {
    const text = await handleEnhancedFileUpload(
      file,
      (progress, stage) => {
        // Update progress UI
        console.log(`${stage}: ${progress}%`);
      },
      (error) => {
        toast({ 
          title: "Processing Error", 
          description: error,
          variant: "destructive" 
        });
      }
    );
    
    setResumeText(text);
    toast({ 
      title: "Success", 
      description: `Processed ${file.name} - ${text.split(/\s+/).length} words` 
    });
  } catch (error) {
    console.error('File processing failed:', error);
  }
  
  setIsProcessingFile(false);
};
```

#### Step 3: Replace analysis handler

**OLD:**
```tsx
const handleAnalyze = async () => {
  setIsAnalyzing(true);
  try {
    const result = await aiResumeService.analyzeResume({ ... });
    setAnalysis(result);
  } catch (error) {
    setError(error.message);
  }
  setIsAnalyzing(false);
};
```

**NEW (with streaming):**
```tsx
// Add state for streaming
const {
  isAnalyzing: streamingAnalyzing,
  progress,
  currentStage,
  message,
  partialResults,
  error: streamingError,
  callbacks,
  startAnalysis,
  reset,
} = useEnhancedAnalysis();

const handleAnalyze = async () => {
  startAnalysis();
  setAnalysis(null);
  
  try {
    const result = await handleEnhancedAnalysis(
      resumeText,
      jobDescription,
      user.id,
      {
        enableStreaming: true,  // Set to false for standard mode
        analysisType: analysisType,
        priority: 'high',
        ...callbacks,  // Streaming callbacks
      }
    );
    
    setAnalysis(result);
    toast({ 
      title: "Analysis Complete!", 
      description: `Overall Score: ${result.overall_score}/100` 
    });
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Analysis failed');
  }
};
```

#### Step 4: Add streaming progress UI

In your JSX, add before the results section:

```tsx
{streamingAnalyzing && (
  <StreamingProgress
    progress={progress}
    currentStage={currentStage}
    message={message}
    partialResults={partialResults}
    isComplete={false}
    error={streamingError}
  />
)}
```

---

## 🎯 What You Get

### Enhanced Document Processing
- **12+ file formats** (PDF, DOCX, PNG, JPG, etc.)
- **OCR support** for scanned documents
- **Web Workers** for non-blocking UI
- **Progress tracking** during extraction

### Streaming AI Analysis
- **Real-time updates** as analysis runs
- **Partial results** shown immediately
- **6 analysis stages** with progress
- **Time estimates** for completion

### Production Features
- **Circuit breaker** - prevents cascading failures
- **Request queue** - fair scheduling
- **Smart caching** - faster repeat requests
- **Error tracking** - Sentry monitoring
- **Type safety** - Zod validation

---

## 🧪 Testing

### 1. Test File Upload

Upload these file types to verify OCR works:
- Regular PDF (standard extraction)
- Scanned PDF (OCR fallback)
- PNG/JPG image of resume (OCR)
- DOCX, TXT, MD files

### 2. Test Streaming

Watch the browser console and UI for:
- Progress updates (0-100%)
- Stage changes (6 stages)
- Partial results appearing
- Time estimates

### 3. Test Error Handling

Try these scenarios:
- Upload invalid file (error message)
- Empty resume text (validation error)
- Trigger rate limit (queue message)
- Check circuit breaker status

### 4. Check Sentry (if configured)

Trigger an error and check Sentry dashboard for:
- Error capture
- Breadcrumbs
- Performance metrics

---

## 📊 Monitoring

### Check System Health

```tsx
import { getSystemHealth } from '@/integrations/enhancedServices';

const health = getSystemHealth();
console.log(health);
// {
//   isHealthy: true,
//   queue: { pending: 0, waiting: 0 },
//   circuitBreaker: { isOpen: false },
//   message: "✅ All systems operational"
// }
```

### View Queue Status

```tsx
import { aiService } from '@/services/ai/EnhancedAIService';

const status = aiService.getQueueStatus();
console.log(`${status.pending} active, ${status.size} waiting`);
```

### Circuit Breaker Status

```tsx
const cbStatus = aiService.getCircuitBreakerStatus();
if (cbStatus.isOpen) {
  console.warn('AI service degraded - automatic retry in 30s');
}
```

---

## 🔧 Configuration

### Optional: Enable Sentry

1. Create Sentry account: https://sentry.io
2. Create new project for React
3. Get DSN from project settings
4. Add to `.env`:
   ```bash
   VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   VITE_APP_VERSION=2.0.0
   ```
5. Restart dev server

### Edge Function Environment

Ensure these are set in Supabase dashboard:
- `GEMINI_API_KEY` - Your Google AI API key
- `SUPABASE_URL` - Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

---

## 🎨 UI Customization

The `StreamingProgress` component is fully customizable:

```tsx
<StreamingProgress
  progress={progress}              // 0-100
  currentStage={stage}            // Stage name
  message={message}               // Custom message
  partialResults={results}        // Partial data
  estimatedTimeRemaining={eta}    // Seconds
  isComplete={done}               // Boolean
  error={errorMsg}                // Error string
/>
```

Customize styling in `src/components/analysis/StreamingProgress.tsx`

---

## 📱 Mobile Support

All features work on mobile:
- ✅ File upload (camera or files)
- ✅ OCR processing
- ✅ Streaming (SSE supported)
- ✅ Responsive UI

---

## 🚨 Troubleshooting

### "Worker failed to load"
- Check `vite.config.ts` has `worker.format = 'es'`
- Restart dev server

### "Streaming disconnects"
- Check network timeout settings
- Verify Edge Function is deployed
- Check browser console for CORS errors

### "OCR is slow"
- Normal for large images (3-10s per page)
- Consider Google Cloud Vision for production

### "Circuit breaker opened"
- Wait 30 seconds, it will auto-retry
- Check Gemini API rate limits
- Verify API key is valid

---

## 📦 Files Reference

- **Integration Helper**: `src/integrations/enhancedServices.ts`
- **Test Component**: `src/components/testing/QuickEnhancedTest.tsx`
- **Streaming UI**: `src/components/analysis/StreamingProgress.tsx`
- **Document Service**: `src/services/DocumentProcessingService.ts`
- **AI Service**: `src/services/ai/EnhancedAIService.ts`
- **Type Schemas**: `src/types/ai-schemas.ts`
- **Edge Function**: `supabase/functions/gemini-stream-analyzer/index.ts`

---

## ✨ Next Steps

1. **Test locally** - Use `QuickEnhancedTest` component
2. **Integrate gradually** - Start with file upload, then add streaming
3. **Monitor errors** - Check Sentry if configured
4. **Optimize UX** - Customize progress UI for your brand
5. **Scale up** - All features production-ready!

---

**Ready to use!** Start with the test component to see everything working. 🚀
