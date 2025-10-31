#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Environment Configuration...\n');

// Test 1: Check if .env file exists
console.log('1. Checking .env file:');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file exists');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`   📊 Found ${lines.length} environment variables`);
  
  // Check for key variables
  const keyVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_BACKEND_URL',
    'NEXT_PUBLIC_PLATFORM_WALLET',
    'NEXT_PUBLIC_SOLANA_RPC_URL',
    'NEXT_PUBLIC_SOLANA_NETWORK'
  ];
  
  keyVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    console.log(`   ${hasVar ? '✅' : '❌'} ${varName}`);
  });
} else {
  console.log('   ❌ .env file not found');
}

// Test 2: Check environment files
console.log('\n2. Checking environment files:');
const envFiles = [
  '.env.development',
  '.env.production',
  '.env.example'
];

envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 3: Check Docker Compose files
console.log('\n3. Checking Docker Compose files:');
const composeFiles = [
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'docker-compose.prod.yml'
];

composeFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 4: Check package.json scripts
console.log('\n4. Checking package.json scripts:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const envScripts = [
    'env:switch',
    'env:validate',
    'env:list',
    'docker:dev',
    'docker:prod',
    'setup:dev',
    'setup:prod'
  ];
  
  envScripts.forEach(script => {
    const hasScript = scripts[script];
    console.log(`   ${hasScript ? '✅' : '❌'} npm run ${script}`);
  });
}

// Test 5: Check if env-manager script exists
console.log('\n5. Checking environment management script:');
const scriptExists = fs.existsSync('scripts/env-manager.js');
console.log(`   ${scriptExists ? '✅' : '❌'} scripts/env-manager.js`);

// Test 6: Validate current environment
console.log('\n6. Current environment validation:');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const nodeEnv = envContent.match(/NODE_ENV=(\w+)/)?.[1] || 'unknown';
  console.log(`   🌍 Current NODE_ENV: ${nodeEnv}`);
  
  // Check for production indicators
  const isProduction = nodeEnv === 'production';
  const hasProductionWallet = envContent.includes('87wRiNDexEFEo7nrnciVQJPbjEkgdMuzdcYD5V8yqema');
  const hasMainnetRPC = envContent.includes('mainnet-beta');
  
  if (isProduction) {
    console.log('   ⚠️  Production environment detected');
    console.log(`   ${hasProductionWallet ? '✅' : '❌'} Production wallet configured`);
    console.log(`   ${hasMainnetRPC ? '✅' : '❌'} Mainnet RPC configured`);
  } else {
    console.log('   🔧 Development environment detected');
  }
}

console.log('\n🎯 Environment Test Complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run env:validate');
console.log('2. Run: npm run setup:dev (for development)');
console.log('3. Run: npm run setup:prod (for production)');
console.log('4. Check browser console for environment logs'); 