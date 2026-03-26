#!/bin/bash
# Website cleanup script 

cd /Users/marston.ward/Documents/GitHub/website

echo "Cleaning up temporary files..."

# Remove temporary development files
rm -f check-deployment-status.py
rm -f configure-claude-vercel.sh
rm -f configure-vercel-token.sh 
rm -f push-with-vercel.sh
rm -f setup-git-vercel-mcp.sh
rm -f setup-vercel-mcp.sh
rm -f test-claude-vercel.sh
rm -f test-git-vercel-mcp.sh

# Remove temporary documentation
rm -f CLAUDE_VERCEL_INTEGRATION.md
rm -f GIT_VERCEL_MCP_COMPLETE.md
rm -f SECURITY_IMPLEMENTATION_PLAN.md
rm -f SECURITY_STATUS.md
rm -f VERCEL_MCP_READY.md
rm -f VERCEL_MCP_USAGE.md

# Remove .DS_Store files
find . -name ".DS_Store" -delete

echo "Cleanup complete!"
echo "Remaining documentation files:"
ls -1 *.md | head -10