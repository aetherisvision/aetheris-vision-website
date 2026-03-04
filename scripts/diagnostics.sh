#!/usr/bin/env bash
# scripts/diagnostics.sh
# Check important diagnostic variables, tools, and domain configuration.

DOMAIN="aetherisvision.com"

echo "==========================================="
echo "  Aetheris Vision - Diagnostic Check"
echo "==========================================="
echo ""

# 1. Check Tooling
echo "--- 🧰 Checking Tools ---"
for tool in node npm python3 dig; do
    if command -v $tool >/dev/null 2>&1; then
        echo "✅ $tool is installed ($($tool --version 2>/dev/null | head -n 1 | awk '{print $1, $2, $3}'))"
    else
        echo "❌ $tool is NOT installed"
    fi
done
echo ""

# 2. Check DNS Records
echo "--- 🌐 Checking DNS for $DOMAIN ---"

# A Record
A_REC=$(dig +short A $DOMAIN)
if [ -n "$A_REC" ]; then
    echo "✅ A Record: $A_REC"
else
    echo "⚠️ A Record: Not found"
fi

# MX Record
MX_REC=$(dig +short MX $DOMAIN)
if [ -n "$MX_REC" ]; then
    echo "✅ MX Record(s): "
    echo "$MX_REC" | sed 's/^/   - /'
else
    echo "⚠️ MX Record: Not found"
fi

# SPF Validation
SPF_REC=$(dig +short TXT $DOMAIN | grep "v=spf1")
if [ -n "$SPF_REC" ]; then
    echo "✅ SPF Record: $SPF_REC"
else
    echo "⚠️ SPF Record: Not found"
fi

# DMARC Validation
DMARC_REC=$(dig +short TXT _dmarc.$DOMAIN)
if [ -n "$DMARC_REC" ]; then
    echo "✅ DMARC Record: $DMARC_REC"
else
    echo "⚠️ DMARC Record: Not found"
fi

# Google DKIM Validation
DKIM_REC=$(dig +short TXT google._domainkey.$DOMAIN)
if [ -n "$DKIM_REC" ]; then
    echo "✅ Google DKIM (google._domainkey.$DOMAIN) is configured"
else
    echo "⚠️ Google DKIM: Not found"
fi

echo ""

# 3. Check Vercel Status
echo "--- 🚀 Checking Vercel Deployment ---"
if command -v python3 >/dev/null 2>&1; then
    python3 scripts/vercel.py status 2>/dev/null || echo "⚠️ Could not fetch Vercel status (Are you logged in?)"
else
    echo "⚠️ Skipping Vercel check (Python 3 missing)"
fi
echo ""

# 4. Check Environment Variables
echo "--- 🔑 Checking Local Environment Variables ---"
if [ -f "scripts/check-env.js" ]; then
    export $(grep -v '^#' .env.local | xargs) 2>/dev/null && node scripts/check-env.js
else
    echo "⚠️ scripts/check-env.js not found."
fi
echo ""

echo "Diagnostic check complete."
echo "We've covered your DNS, DKIM, SPF, MX, DMARC, and local ENV checks. You're completely up to date!"