#!/bin/bash

# AI Resume Analyzer Deployment Script
# This script automates the complete deployment process

echo "🚀 Starting AI Resume Analyzer Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Skipping Edge Function deployment."
    echo "   You can install it with: npm install -g supabase"
    SKIP_FUNCTIONS=true
else
    echo "✅ Supabase CLI ready"
    SKIP_FUNCTIONS=false
fi

# Deploy Edge Functions (if CLI available)
if [ "$SKIP_FUNCTIONS" = false ]; then
    echo "📤 Deploying Supabase Edge Functions..."

    # Check if we're logged in to Supabase
    if ! supabase projects list &> /dev/null; then
        echo "⚠️  Not logged in to Supabase. Skipping Edge Function deployment."
        echo "   You can login with: supabase login"
    else
        echo "  - Deploying gemini-analyze function..."
        if supabase functions deploy gemini-analyze --project-ref yucdpvnmcuokemhqpnvz; then
            echo "  ✅ gemini-analyze deployed successfully"
        else
            echo "  ⚠️  gemini-analyze deployment failed (continuing anyway)"
        fi

        echo "  - Deploying log-analytics function..."
        if supabase functions deploy log-analytics --project-ref yucdpvnmcuokemhqpnvz; then
            echo "  ✅ log-analytics deployed successfully"
        else
            echo "  ⚠️  log-analytics deployment failed (continuing anyway)"
        fi
    fi
fi

# Build the project
echo "🔨 Building production bundle..."
if npm run build; then
    echo "✅ Build successful"
    echo "📁 Production files ready in dist/ folder"
    echo ""
    echo "📊 Build Summary:"
    echo "  - Bundle size: $(du -h dist/assets/*.js | tail -1 | cut -f1)"
    echo "  - CSS size: $(du -h dist/assets/*.css | tail -1 | cut -f1)"
    echo "  - Files: $(find dist -type f | wc -l) files total"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Your automated hosting platform should deploy the dist/ folder automatically"
    echo "2. Ensure environment variables are set:"
    echo "   - VITE_SUPABASE_URL=https://yucdpvnmcuokemhqpnvz.supabase.co"
    echo "   - VITE_SUPABASE_ANON_KEY=your_anon_key"
    echo "3. Set GOOGLE_AI_API_KEY in Supabase Dashboard > Settings > Secrets"
    echo ""
    echo "🎉 AI Resume Analyzer ready for production!"
else
    echo "❌ Build failed"
    exit 1
fi
