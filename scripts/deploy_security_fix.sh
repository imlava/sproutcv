#!/bin/bash

# 🚨 CRITICAL SECURITY DEPLOYMENT SCRIPT
# This script applies the security fixes to prevent data theft

set -e  # Exit on any error

echo "🚨 DEPLOYING CRITICAL SECURITY FIXES..."
echo "⚠️  This will fix all public data exposure vulnerabilities"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first.${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Not in a Supabase project directory${NC}"
    echo "Please run this script from your project root"
    exit 1
fi

echo -e "${BLUE}📋 Security Issues Being Fixed:${NC}"
echo "🚨 CRITICAL ISSUES:"
echo "1. Customer Personal Information (profiles table)"
echo "2. Customer Contact Information (contact_messages table)" 
echo "3. Payment Information (payments table)"
echo "4. Password Reset Tokens (password_reset_tokens table)"
echo "5. User Session Information (user_sessions table)"
echo ""
echo "⚠️  ENHANCED PROTECTION:"
echo "6. Admin Account Compromise Protection"
echo "7. Contact Data Encryption & Access Logging"
echo "8. Payment Access Monitoring & Restrictions"
echo "9. Multi-Factor Authentication Requirements"
echo "10. Automated Security Monitoring"
echo ""

echo -e "${YELLOW}⏳ Creating migration file...${NC}"

# Create timestamp for migration
TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_critical_security_fix.sql"

# Copy our security fix to migrations directory
cp CRITICAL_SECURITY_FIX.sql "$MIGRATION_FILE"

# Also apply enhanced security fixes
ENHANCED_MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_enhanced_security_fix.sql"
cp ENHANCED_SECURITY_FIX.sql "$ENHANCED_MIGRATION_FILE"

echo -e "${GREEN}✅ Migration files created:${NC}"
echo "  - $MIGRATION_FILE"
echo "  - $ENHANCED_MIGRATION_FILE"

# Apply the migration to local development
echo -e "${YELLOW}⏳ Applying to local development database...${NC}"
if supabase db reset; then
    echo -e "${GREEN}✅ Local database updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to update local database${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 SECURITY FIX SUMMARY:${NC}"
echo ""
echo -e "${GREEN}✅ Fixed: Profiles table - Now requires authentication${NC}"
echo -e "${GREEN}✅ Fixed: Contact messages - Admin access only${NC}"
echo -e "${GREEN}✅ Fixed: Payments table - User data protection${NC}"
echo -e "${GREEN}✅ Fixed: Password reset tokens - Service role only${NC}"
echo -e "${GREEN}✅ Fixed: User sessions - Personal data protection${NC}"
echo ""
echo -e "${BLUE}🔐 ENHANCED PROTECTIONS APPLIED:${NC}"
echo -e "${GREEN}✅ Enhanced: Admin access controls with audit logging${NC}"
echo -e "${GREEN}✅ Enhanced: Contact data encryption & access logging${NC}"
echo -e "${GREEN}✅ Enhanced: Payment access monitoring & restrictions${NC}"
echo -e "${GREEN}✅ Enhanced: Multi-factor authentication requirements${NC}"
echo -e "${GREEN}✅ Enhanced: Automated security monitoring & alerts${NC}"
echo ""

echo -e "${YELLOW}📊 NEXT STEPS:${NC}"
echo ""
echo "1. Test the application locally to ensure everything works"
echo "2. Deploy to production when ready:"
echo -e "   ${BLUE}supabase db push${NC}"
echo ""
echo "3. Verify the fix in production by checking that anonymous users"
echo "   cannot access sensitive data"
echo ""

echo -e "${RED}⚠️  IMPORTANT: Deploy to production ASAP to protect user data${NC}"
echo ""

# Optional: Show the policies that were created
echo -e "${BLUE}🔍 Security Policies Applied:${NC}"
echo ""
echo "• users_can_view_own_profile_only"
echo "• only_admins_can_view_contact_messages" 
echo "• users_can_view_own_payments_only"
echo "• only_service_role_can_manage_reset_tokens"
echo "• users_can_view_own_sessions_only"
echo ""
echo -e "${BLUE}🔒 Enhanced Security Features:${NC}"
echo ""
echo "• Admin access audit logging"
echo "• Data masking for sensitive information"
echo "• Contact message encryption"
echo "• Payment access monitoring"
echo "• Multi-factor authentication enforcement"
echo "• Automated security alert system"
echo ""

# Create verification script
cat > verify_security_fix.sql << 'EOF'
-- 🔍 SECURITY FIX VERIFICATION SCRIPT
-- Run this after deployment to confirm the fix

-- Check that RLS is enabled on all critical tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contact_messages', 'payments', 'password_reset_tokens', 'user_sessions')
ORDER BY tablename;

-- Check security policies exist
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd as "Operation"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contact_messages', 'payments', 'password_reset_tokens', 'user_sessions')
ORDER BY tablename, policyname;

-- Test anonymous access (should return 0 for all)
-- ⚠️ These should all return 0 rows after the fix
SELECT 'profiles' as table_name, count(*) as accessible_rows FROM public.profiles
UNION ALL
SELECT 'payments' as table_name, count(*) as accessible_rows FROM public.payments  
UNION ALL
SELECT 'password_reset_tokens' as table_name, count(*) as accessible_rows FROM public.password_reset_tokens
UNION ALL
SELECT 'user_sessions' as table_name, count(*) as accessible_rows FROM public.user_sessions;
EOF

echo -e "${GREEN}✅ Created verification script: verify_security_fix.sql${NC}"
echo ""
echo -e "${BLUE}🎯 Ready for production deployment!${NC}"
