#!/bin/bash

# AI Resume Analyzer Deployment Script
# This script automates the complete deployment process

echo "🚀 Starting AI Resume Analyzer Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install: npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"

# Deploy Edge Functions
echo "📤 Deploying Supabase Edge Functions..."

echo "  - Deploying gemini-analyze function..."
supabase functions deploy gemini-analyze --project-ref yucdpvnmcuokemhqpnvz

echo "  - Deploying log-analytics function..."
supabase functions deploy log-analytics --project-ref yucdpvnmcuokemhqpnvz

echo "✅ Edge Functions deployed successfully"

# Build the project
echo "🔨 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "📁 Production files ready in dist/ folder"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Upload dist/ folder contents to your hosting platform"
    echo "2. Set environment variables:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "3. Ensure GOOGLE_AI_API_KEY is set in Supabase secrets"
    echo ""
    echo "🎉 AI Resume Analyzer ready for production!"
else
    echo "❌ Build failed"
    exit 1
fi
