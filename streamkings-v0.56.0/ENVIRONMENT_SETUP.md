# Environment Configuration Management

This guide explains how to manage environment variables across different deployment environments (development, staging, production) for the Street Credit application.

## 🏗️ Architecture Overview

The application uses a multi-environment setup with:
- **Development**: Local development with hot reloading
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## 📁 Environment Files Structure

```
├── .env.example          # Template with all required variables
├── .env.development      # Development environment (safe to commit)
├── .env.production       # Production template (no real secrets)
├── .env.staging          # Staging environment (optional)
├── .env                  # Current active environment (gitignored)
└── scripts/env-manager.js # Environment management script
```

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Copy the example file and create your environments
cp .env.example .env.development
cp .env.example .env.production

# Edit the files with your actual values
# (Never commit real secrets to version control)
```

### 2. Switch Environments

```bash
# Switch to development
npm run env:switch development

# Switch to production
npm run env:switch production

# List available environments
npm run env:list
```

### 3. Start Services

```bash
# Start development environment
npm run setup:dev

# Start production environment
npm run setup:prod

# Stop all services
npm run docker:stop
```

## 🔧 Environment Management Commands

### Basic Commands

```bash
# Switch between environments
npm run env:switch <environment>

# Validate environment configuration
npm run env:validate <environment>

# List all available environments
npm run env:list

# Create backup of current .env
npm run env:backup

# Restore from backup
npm run env:restore <backup-file>

# Compare two environments
npm run env:diff <env1> <env2>
```

### Docker Commands

```bash
# Start development stack
npm run docker:dev

# Start production stack
npm run docker:prod

# Stop all services
npm run docker:stop

# View logs
npm run docker:logs
```

## 🔐 Security Best Practices

### 1. Never Commit Secrets

```bash
# ✅ Good - Safe to commit
NODE_ENV=development
NEXT_PUBLIC_BACKEND_URL=http://localhost:3006

# ❌ Bad - Never commit real secrets
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
JWT_SECRET=your-actual-secret-key-here
```

### 2. Use Placeholders in Templates

```bash
# ✅ Good - Use placeholders in .env.example and .env.production
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# ❌ Bad - Don't put real values in templates
AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
JWT_SECRET="your-secret-key-here"
```

### 3. Environment-Specific Secrets

Create separate files for real secrets:

```bash
# .env.secrets (gitignored)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-actual-production-secret-here

# .env.production (committed)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
JWT_SECRET=${JWT_SECRET}
```

## 🌍 Environment-Specific Configurations

### Development Environment

- **Database**: Local MySQL with test data
- **AWS**: Development bucket and credentials
- **Solana**: Devnet for testing
- **Logging**: Debug level
- **Features**: Debug mode enabled

### Production Environment

- **Database**: Production MySQL/RDS
- **AWS**: Production bucket and credentials
- **Solana**: Mainnet
- **Logging**: Info level
- **Features**: Analytics enabled, debug disabled

## 🔄 Workflow Examples

### Daily Development Workflow

```bash
# 1. Start development environment
npm run setup:dev

# 2. Make changes to code
# 3. Test locally
# 4. Stop services when done
npm run docker:stop
```

### Deployment to Production

```bash
# 1. Switch to production environment
npm run env:switch production

# 2. Validate production config
npm run env:validate production

# 3. Deploy to production
npm run setup:prod

# 4. Monitor logs
npm run docker:logs
```

### Testing Different Configurations

```bash
# 1. Create backup of current config
npm run env:backup

# 2. Switch to different environment
npm run env:switch staging

# 3. Test the configuration
npm run docker:dev

# 4. Compare with production
npm run env:diff staging production

# 5. Restore original config
npm run env:restore .env.backup.2024-01-01
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   npm run env:validate
   # Check the output for missing variables
   ```

2. **Docker Compose Issues**
   ```bash
   # Check if environment file is loaded
   docker-compose config

   # View service logs
   docker-compose logs <service-name>
   ```

3. **Database Connection Issues**
   ```bash
   # Check database is running
   docker-compose ps

   # Test database connection
   docker-compose exec db mysql -u user -p street_kredit
   ```

### Validation Checklist

Before deploying to production:

- [ ] All required environment variables are set
- [ ] No placeholder values remain
- [ ] Database connection string is correct
- [ ] AWS credentials are valid
- [ ] Solana network is set to mainnet
- [ ] JWT secret is strong and unique
- [ ] All services can start successfully

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development`, `production` |
| `DATABASE_URL` | Database connection string | `mysql://user:pass@host:3306/db` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:3006` |
| `AWS_REGION` | AWS region | `us-west-2` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `NEXT_PUBLIC_ENABLE_DEBUG_MODE` | Enable debug features | `false` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true` |

### Frontend Variables (NEXT_PUBLIC_*)

These variables are exposed to the browser:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_STREAM_SERVER_URL`
- `NEXT_PUBLIC_PLATFORM_WALLET`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_SOLANA_NETWORK`

## 🔄 CI/CD Integration

For automated deployments, use environment variables in your CI/CD platform:

```yaml
# GitHub Actions example
env:
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/concepts/components/prisma-schema/environment-variables)
- [AWS Environment Variables](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-environment.html) 