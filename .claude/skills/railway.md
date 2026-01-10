---
name: railway-deployment
description: Use this skill when the user wants to deploy to Railway, manage Railway services, check deployment status, manage environment variables, or work with Railway infrastructure. Keywords: deploy, railway, staging, production, environment variables, services, metrics.
---

# Railway Deployment Skill

You can help manage Railway deployments using the Railway CLI (`railway`).

## Authentication

Before using Railway commands, ensure the user is logged in:
```bash
railway login
```

## Common Commands

### Project Management
```bash
# Link current directory to a Railway project
railway link

# List all projects
railway list

# Open project in browser
railway open
```

### Deployment
```bash
# Deploy current directory
railway up

# Deploy with specific service
railway up --service <service-name>

# View deployment logs
railway logs

# View logs for specific service
railway logs --service <service-name>
```

### Environment Variables
```bash
# List all variables
railway variables

# Set a variable
railway variables set KEY=value

# Set multiple variables
railway variables set KEY1=value1 KEY2=value2

# Delete a variable
railway variables delete KEY
```

### Service Management
```bash
# List services in current project
railway service

# Run a command in the Railway environment
railway run <command>

# Open a shell in Railway environment
railway shell
```

### Environment Management
```bash
# List environments
railway environment

# Switch environment (e.g., staging, production)
railway environment <environment-name>
```

### Monitoring
```bash
# View deployment status
railway status

# View logs (follow mode)
railway logs -f

# Open metrics dashboard
railway open
```

## Sidra-Ai Specific

This project uses Railway for:
- **Staging environment**: For testing before production
- **Production environment**: Live application

When deploying:
1. Always deploy to staging first
2. Verify the deployment works
3. Then deploy to production

## Best Practices

1. **Never deploy directly to production** without testing on staging first
2. **Check logs** after each deployment: `railway logs -f`
3. **Use environment-specific variables** for secrets
4. **Link the project** before running commands: `railway link`
