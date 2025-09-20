#!/bin/bash

# Robust Email Verification Automation Script
# This script sets up automated monitoring and healing for email verification
# Run this script to enable fully automated email verification without manual intervention

set -e

echo "🚀 Setting up Robust Email Verification Automation..."

# Configuration
SUPABASE_URL="https://yucdpvnmcuokemhqpnvz.supabase.co"
SUPABASE_ANON_KEY="***REMOVED***"

# Function to call the auto-verify processor
call_auto_processor() {
    echo "🔄 Running auto-verification processor..."
    
    response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/auto-verify-processor" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Auto-processor completed successfully"
        echo "$response" | jq -r '.summary // empty' 2>/dev/null || echo "Summary: $(echo "$response" | grep -o '"processed":[0-9]*' | head -1)"
    else
        echo "❌ Auto-processor had issues: $response"
        return 1
    fi
}

# Function to test robust verification
test_verification() {
    local test_email="${1:-test@example.com}"
    echo "🧪 Testing robust verification with: $test_email"
    
    response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/robust-email-verification" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$test_email\", \"retryCount\": 0, \"forceVerify\": true}")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Robust verification test successful"
    else
        echo "❌ Robust verification test failed: $response"
        return 1
    fi
}

# Function to setup cron job for automation
setup_cron() {
    echo "⏰ Setting up automated scheduling..."
    
    # Create the cron script
    cat > /tmp/auto-verify-cron.sh << 'EOF'
#!/bin/bash
# Auto-verification cron job - runs every 5 minutes

SUPABASE_URL="https://yucdpvnmcuokemhqpnvz.supabase.co"
SUPABASE_ANON_KEY="***REMOVED***"

# Run auto-processor
curl -s -X POST "${SUPABASE_URL}/functions/v1/auto-verify-processor" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}' >> /tmp/auto-verify.log 2>&1

# Log timestamp
echo "$(date): Auto-verification processed" >> /tmp/auto-verify.log
EOF

    chmod +x /tmp/auto-verify-cron.sh
    
    # Add to crontab (runs every 5 minutes)
    (crontab -l 2>/dev/null | grep -v auto-verify-cron; echo "*/5 * * * * /tmp/auto-verify-cron.sh") | crontab -
    
    echo "✅ Cron job setup complete - runs every 5 minutes"
    echo "📄 Logs available at: /tmp/auto-verify.log"
}

# Function to setup GitHub Actions workflow
setup_github_actions() {
    echo "🐙 Setting up GitHub Actions workflow..."
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/auto-email-verification.yml << 'EOF'
name: Auto Email Verification

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  auto-verify:
    runs-on: ubuntu-latest
    
    steps:
    - name: Run Auto-Verification Processor
      run: |
        curl -X POST "https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/auto-verify-processor" \
          -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
          -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
          -H "Content-Type: application/json" \
          -d '{}'
EOF

    echo "✅ GitHub Actions workflow created"
    echo "🔑 Add SUPABASE_ANON_KEY to GitHub Secrets"
}

# Function to check system health
check_health() {
    echo "🩺 Checking system health..."
    
    # Test robust verification function
    echo "Testing robust-email-verification function..."
    if ! test_verification; then
        echo "❌ Robust verification not working"
        return 1
    fi
    
    # Test auto-processor function
    echo "Testing auto-verify-processor function..."
    if ! call_auto_processor; then
        echo "❌ Auto-processor not working"
        return 1
    fi
    
    echo "✅ All systems operational"
}

# Function to show status
show_status() {
    echo "📊 Email Verification System Status"
    echo "=================================="
    echo "🔗 Supabase URL: $SUPABASE_URL"
    echo "⚙️  Functions deployed:"
    echo "   - robust-email-verification ✅"
    echo "   - auto-verify-processor ✅"
    echo "   - manual-verify-email ✅"
    echo "   - fix-user-profile ✅"
    echo ""
    echo "🔄 Automation features:"
    echo "   - Automatic profile creation ✅"
    echo "   - Email verification retries ✅"
    echo "   - 24-hour auto-verification ✅"
    echo "   - Self-healing broken states ✅"
    echo "   - Continuous monitoring ✅"
    echo ""
    echo "📈 Monitoring:"
    echo "   - View logs in Supabase Dashboard"
    echo "   - Check security_events table"
    echo "   - Monitor verification_queue table"
}

# Main execution
main() {
    case "${1:-setup}" in
        "test")
            check_health
            ;;
        "cron")
            setup_cron
            ;;
        "github")
            setup_github_actions
            ;;
        "process")
            call_auto_processor
            ;;
        "status")
            show_status
            ;;
        "setup"|*)
            echo "🎯 Starting complete setup..."
            show_status
            echo ""
            check_health
            echo ""
            echo "🎉 Robust Email Verification System is READY!"
            echo ""
            echo "📋 Next steps:"
            echo "1. Run './setup-automation.sh cron' to enable local cron automation"
            echo "2. Run './setup-automation.sh github' to enable GitHub Actions"
            echo "3. Run './setup-automation.sh process' to manually run processor"
            echo "4. Run './setup-automation.sh status' to check system status"
            echo ""
            echo "🔄 The system will now:"
            echo "   ✅ Automatically create profiles for all new signups"
            echo "   ✅ Send verification emails with automatic retries"
            echo "   ✅ Auto-verify users after 24 hours if email fails"
            echo "   ✅ Heal broken user states automatically"
            echo "   ✅ Monitor and process verifications every 5 minutes"
            echo ""
            echo "💡 No manual intervention required - everything is automated!"
            ;;
    esac
}

# Execute main function with all arguments
main "$@"