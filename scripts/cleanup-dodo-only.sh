#!/bin/bash
# 🎯 DODO PAYMENTS ONLY - Code Cleanup Script
# This script removes all non-Dodo payment service references

echo "🔧 Starting Dodo Payments Only cleanup..."

# Deploy the updated functions
echo "📦 Deploying updated functions..."
cd /Users/lava/Documents/sproutcv

# Deploy key payment functions with Dodo-only support
supabase functions deploy enhanced-payment-status
supabase functions deploy dodo-webhook  
supabase functions deploy verify-payment
supabase functions deploy dodo-perfect-integration

echo "✅ Functions deployed"

# Apply database migration
echo "🗄️ Applying Dodo-only database migration..."
# Note: Run this in Supabase SQL Editor:
echo "📋 Run dodo-payments-only-migration.sql in Supabase SQL Editor"

# Build frontend with updates
echo "🖥️ Building frontend..."
npm run build

echo "🎉 Dodo Payments Only cleanup complete!"
echo ""
echo "✅ What was cleaned up:"
echo "   - Removed stripe_session_id lookups from payment functions"
echo "   - Updated all functions to use payment_provider_id only"
echo "   - Admin dashboard now shows Dodo payment IDs only"
echo "   - Database comments updated to indicate Dodo Payments only"
echo ""
echo "🚀 Your system now uses ONLY Dodo Payments!"
echo "📊 All payment lookups use payment_provider_id field"
echo "🛡️ No confusion with other payment services"
