# Vercel MCP Integration

This directory contains the Model Control Protocol (MCP) server for automated Vercel deployment monitoring.

## Quick Setup

1. **Run the setup script:**
   ```bash
   chmod +x setup-vercel-mcp.sh
   ./setup-vercel-mcp.sh
   ```

2. **Set your Vercel token:**
   ```bash
   export VERCEL_TOKEN=your_token_from_vercel_dashboard
   ```

3. **Start using enhanced push:**
   ```bash
   git pushv  # New alias that includes Vercel monitoring
   ```

## What This Provides

### Automatic Deployment Monitoring
- **Git Integration**: `git pushv` automatically monitors deployments
- **Real-time Status**: Live deployment progress with emoji indicators
- **Smart Detection**: Only monitors main/production branch pushes
- **Timeout Handling**: Configurable monitoring duration

### MCP Tools Available
- `check_deployment_status` - Get current deployment info
- `monitor_deployment` - Watch deployment until completion
- `get_deployment_logs` - Retrieve build logs for debugging
- `list_recent_deployments` - Show deployment history

### GitHub Actions Integration
- Automatic monitoring in CI/CD pipeline
- Deployment status reports in Actions logs
- Failure notifications and debugging info

## Files

| File | Purpose |
|------|---------|
| `vercel-server.py` | Main MCP server with Vercel API integration |
| `setup-vercel-mcp.sh` | One-time setup script |
| `../push-with-vercel.sh` | Git push wrapper with monitoring |
| `pyproject.toml` | Python dependencies |
| `claude-mcp-config.json` | Claude Desktop integration config |

## Environment Variables

```bash
# Required
VERCEL_TOKEN=your_vercel_api_token

# Optional (for team accounts)  
VERCEL_TEAM_ID=your_vercel_team_id
```

## Usage Examples

### Basic Push with Monitoring
```bash
git pushv
# Pushes to origin main and monitors deployment
```

### Push to Specific Branch
```bash
git pushv origin production
# Pushes to production branch and monitors
```

### Manual Monitoring
```bash
cd mcp
python vercel-server.py  # Start MCP server
# Then use Claude Desktop with MCP tools
```

This integration ensures you always know the status of your deployments immediately after pushing code, with no manual checking required.