#!/bin/bash
# ===========================================
# SproutCV Pre-Commit Secret Detection Hook
# ===========================================
# This script prevents committing secrets to the repository
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "🔍 Scanning for secrets..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Files being committed
FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$FILES" ]; then
    echo -e "${GREEN}✅ No files to check${NC}"
    exit 0
fi

FOUND_SECRETS=0

# Check for common secret patterns
check_pattern() {
    local pattern="$1"
    local description="$2"
    
    for file in $FILES; do
        # Skip binary files and certain paths
        if [[ "$file" == *.png ]] || [[ "$file" == *.jpg ]] || [[ "$file" == *.ico ]] || \
           [[ "$file" == *.woff* ]] || [[ "$file" == *.ttf ]] || [[ "$file" == *.eot ]] || \
           [[ "$file" == "bun.lockb" ]] || [[ "$file" == "package-lock.json" ]] || \
           [[ "$file" == *".env.example"* ]]; then
            continue
        fi
        
        if [ -f "$file" ]; then
            matches=$(grep -nE "$pattern" "$file" 2>/dev/null || true)
            if [ -n "$matches" ]; then
                echo -e "${RED}❌ Potential secret found in $file:${NC}"
                echo -e "${YELLOW}   Pattern: $description${NC}"
                echo "$matches" | head -3
                FOUND_SECRETS=1
            fi
        fi
    done
}

# JWT Tokens (very common in Supabase projects)
check_pattern 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' "JWT Token"

# API Keys with assignment
check_pattern '["\047][A-Za-z0-9_-]{30,}["\047]' "Long API Key String"

# Supabase URLs with keys
check_pattern 'supabase\.co.*eyJ' "Supabase URL with embedded key"

# Hardcoded URLs that might contain project IDs
check_pattern 'https://[a-z]{20,}\.supabase\.co' "Hardcoded Supabase URL"

# Environment variable assignments with actual values
check_pattern 'SUPABASE_.*=.*eyJ' "Supabase Key Assignment"
check_pattern 'API_KEY.*=.*[A-Za-z0-9_-]{20,}' "API Key Assignment"

# Check for .env files (should never be committed)
for file in $FILES; do
    if [[ "$file" == ".env" ]] || [[ "$file" == "env/.env" ]] || [[ "$file" =~ \.env\.[^e] ]]; then
        echo -e "${RED}❌ Environment file detected: $file${NC}"
        echo -e "${YELLOW}   Never commit .env files! Add to .gitignore${NC}"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}🚨 COMMIT BLOCKED: Secrets detected!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Please remove the secrets before committing."
    echo "If these are false positives, you can bypass with:"
    echo "  git commit --no-verify"
    echo ""
    echo "But be VERY CAREFUL - exposed secrets can compromise your app!"
    exit 1
fi

echo -e "${GREEN}✅ No secrets detected${NC}"
exit 0
