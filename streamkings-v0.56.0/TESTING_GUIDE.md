# Environment Configuration Testing Guide

This guide will help you verify that your environment configuration is working correctly and that your website is properly using the environment variables.

## 🧪 Quick Test

Run the automated test to check your setup:

```bash
npm run test:env
```

This will check all your environment files, scripts, and configurations.

## 🔍 Manual Testing Steps

### 1. Environment Validation

```bash
# Validate current environment
npm run env:validate

# List all environments
npm run env:list

# Switch to development
npm run env:switch development

# Switch to production
npm run env:switch production
```

### 2. Start Services

```bash
# Start development environment
npm run setup:dev

# Start production environment
npm run setup:prod

# Check if services are running
docker-compose ps
```

### 3. Browser Testing

1. **Open your browser** and go to `http://localhost:3000`
2. **Open Developer Tools** (F12)
3. **Check the Console** for environment logs

You should see logs like:
```
🌍 Solana Configuration: {
  rpcUrl: "https://api.devnet.solana.com",
  network: "devnet",
  isProduction: false,
  platformWallet: "snowhFdtUoXcJxjLFi75E4dqChyp3SSZboyooLmBhgb"
}
```

### 4. Environment-Specific Testing

#### Development Environment
- Should use **Devnet** Solana network
- Should use **localhost** URLs for APIs
- Should show **debug** logs
- Platform wallet should be development wallet

#### Production Environment
- Should use **Mainnet** Solana network
- Should use **production** URLs for APIs
- Should show **info** logs only
- Platform wallet should be production wallet

## 🔧 Testing Individual Components

### 1. API Configuration

Check that your API calls are using the correct URLs:

```javascript
// In browser console, check:
console.log('API Base URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('Stream Server URL:', process.env.NEXT_PUBLIC_STREAM_SERVER_URL);
```

### 2. Solana Configuration

Verify Solana network settings:

```javascript
// In browser console, check:
console.log('Solana RPC URL:', process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
console.log('Solana Network:', process.env.NEXT_PUBLIC_SOLANA_NETWORK);
console.log('Platform Wallet:', process.env.NEXT_PUBLIC_PLATFORM_WALLET);
```

### 3. Wallet Connection

1. **Connect your wallet** using the wallet button
2. **Check the network** - it should match your environment
3. **Verify transactions** work on the correct network

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Symptoms:**
- `undefined` values in console
- Default values being used instead of environment values

**Solutions:**
```bash
# Restart the development server
npm run dev

# Check if .env file exists
ls -la .env*

# Validate environment
npm run env:validate
```

#### 2. Wrong Network in Wallet

**Symptoms:**
- Wallet shows wrong network (devnet vs mainnet)
- Transactions fail

**Solutions:**
```bash
# Switch to correct environment
npm run env:switch development  # or production

# Restart services
npm run docker:stop
npm run setup:dev  # or setup:prod
```

#### 3. API Connection Issues

**Symptoms:**
- API calls fail
- 404 errors

**Solutions:**
```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Verify API URL in environment
npm run env:validate
```

#### 4. Docker Issues

**Symptoms:**
- Services won't start
- Port conflicts

**Solutions:**
```bash
# Stop all services
docker-compose down

# Remove containers
docker-compose down -v

# Rebuild and start
npm run setup:dev  # or setup:prod
```

## 📋 Testing Checklist

### Environment Files
- [ ] `.env.example` exists and has all variables
- [ ] `.env.development` exists and is configured
- [ ] `.env.production` exists and is configured
- [ ] `.env` file is created when switching environments

### Scripts
- [ ] `npm run env:switch` works
- [ ] `npm run env:validate` works
- [ ] `npm run env:list` shows all environments
- [ ] `npm run setup:dev` starts development services
- [ ] `npm run setup:prod` starts production services

### Frontend Integration
- [ ] Environment variables are loaded in browser
- [ ] Solana network is correct
- [ ] API URLs are correct
- [ ] Platform wallet is correct
- [ ] Debug logs show environment info

### Backend Integration
- [ ] Backend starts without errors
- [ ] Environment validation passes
- [ ] Database connection works
- [ ] AWS configuration is correct

### Wallet Integration
- [ ] Wallet connects to correct network
- [ ] Transactions work on correct network
- [ ] Platform wallet is correct for environment

## 🎯 Expected Results

### Development Environment
```
🌍 Solana Configuration: {
  rpcUrl: "https://api.devnet.solana.com",
  network: "devnet",
  isProduction: false,
  platformWallet: "snowhFdtUoXcJxjLFi75E4dqChyp3SSZboyooLmBhgb"
}

🌍 Environment Configuration:
  NODE_ENV: development
  DATABASE_URL: mysql://user:***@localhost:3307/street_kredit
  AWS_REGION: us-west-2
  FRONTEND_URL: http://localhost:3000
  LOG_LEVEL: debug
```

### Production Environment
```
🌍 Solana Configuration: {
  rpcUrl: "https://api.mainnet-beta.solana.com",
  network: "mainnet-beta",
  isProduction: true,
  platformWallet: "87wRiNDexEFEo7nrnciVQJPbjEkgdMuzdcYD5V8yqema"
}

🌍 Environment Configuration:
  NODE_ENV: production
  DATABASE_URL: mysql://user:***@your-production-db-host:3306/street_kredit
  AWS_REGION: us-west-2
  FRONTEND_URL: https://yourdomain.com
  LOG_LEVEL: info
```

## 🚀 Next Steps

After successful testing:

1. **Commit your environment files** (except `.env` with real secrets)
2. **Document any custom configurations** in your team
3. **Set up CI/CD** with environment variables
4. **Create staging environment** if needed
5. **Monitor logs** in production

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** in browser console and Docker
2. **Run the test script** to identify problems
3. **Validate environment** configuration
4. **Check the troubleshooting section** above
5. **Review the environment setup documentation** 