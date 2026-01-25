#!/bin/bash

# Security Fixes Deployment Script - January 2026
# Run this script from the project root directory

set -e

echo "🔒 SproutCV Security Fixes Deployment"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    echo "   or"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in to Supabase
echo "📋 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase. Running login..."
    supabase login
fi

echo ""
echo "Step 1/4: Applying database migration..."
echo "----------------------------------------"
read -p "Apply the security RLS migration? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo "✅ Migration applied"
else
    echo "⏭️  Skipped migration"
fi

echo ""
echo "Step 2/4: Deploying Edge Functions..."
echo "-------------------------------------"
read -p "Deploy all Edge Functions? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying gemini-analyze..."
    supabase functions deploy gemini-analyze --no-verify-jwt
    
    echo "Deploying dodo-webhook..."
    supabase functions deploy dodo-webhook --no-verify-jwt
    
    echo "Deploying create-payment-dynamic..."
    supabase functions deploy create-payment-dynamic
    
    echo "✅ All Edge Functions deployed"
else
    echo "⏭️  Skipped Edge Function deployment"
fi

echo ""
echo "Step 3/4: Setting Gemini API Key..."
echo "-----------------------------------"
read -p "Do you need to set the GEMINI_API_KEY secret? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Gemini API Key: " -s GEMINI_KEY
    echo
    supabase secrets set GEMINI_API_KEY="$GEMINI_KEY"
    echo "✅ Gemini API key set"
else
    echo "⏭️  Skipped API key setup"
fi

echo ""
echo "Step 4/4: Manual Steps Required"
echo "-------------------------------"
echo ""
echo "⚠️  Please complete these steps manually in Supabase Dashboard:"
echo ""
echo "1. Enable 'Leaked Password Protection':"
echo "   → Go to: https://supabase.com/dashboard"
echo "   → Select your project"
echo "   → Authentication → Settings → Security"
echo "   → Enable 'Leaked Password Protection'"
echo ""
echo "2. Remove VITE_GOOGLE_AI_API_KEY from your .env file"
echo "   (This is no longer needed as AI calls go through Edge Functions)"
echo ""
echo "======================================"
echo "🎉 Security deployment complete!"
echo ""
echo "Run 'npm run build' to verify everything works."
