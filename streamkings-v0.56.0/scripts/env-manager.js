#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_FILES = {
  development: '.env.development',
  production: '.env.production',
  staging: '.env.staging',
  test: '.env.test'
};

const REQUIRED_VARS = [
  'NODE_ENV',
  'DATABASE_URL',
  'NEXT_PUBLIC_BACKEND_URL',
  'AWS_REGION',
  'JWT_SECRET'
];

function showHelp() {
  console.log(`
Environment Configuration Manager

Usage:
  node scripts/env-manager.js <command> [options]

Commands:
  switch <environment>    Switch to specified environment (dev, prod, staging, test)
  validate <environment>  Validate environment configuration
  list                   List available environments
  backup                 Create backup of current .env file
  restore <backup>       Restore from backup
  diff <env1> <env2>     Show differences between two environment files

Examples:
  node scripts/env-manager.js switch dev
  node scripts/env-manager.js validate production
  node scripts/env-manager.js list
  node scripts/env-manager.js backup
  node scripts/env-manager.js restore .env.backup.2024-01-01
  node scripts/env-manager.js diff development production
`);
}

function listEnvironments() {
  console.log('\nAvailable environments:');
  Object.keys(ENV_FILES).forEach(env => {
    const exists = fs.existsSync(ENV_FILES[env]);
    console.log(`  ${env}${exists ? ' ✓' : ' ✗'} - ${ENV_FILES[env]}`);
  });
  console.log('\nCurrent environment:');
  if (fs.existsSync('.env')) {
    const content = fs.readFileSync('.env', 'utf8');
    const nodeEnv = content.match(/NODE_ENV=(\w+)/)?.[1] || 'unknown';
    console.log(`  ${nodeEnv} (from .env)`);
  } else {
    console.log('  No .env file found');
  }
}

function switchEnvironment(targetEnv) {
  const envFile = ENV_FILES[targetEnv];
  
  if (!envFile) {
    console.error(`❌ Unknown environment: ${targetEnv}`);
    console.log('Available environments:', Object.keys(ENV_FILES).join(', '));
    return false;
  }

  if (!fs.existsSync(envFile)) {
    console.error(`❌ Environment file not found: ${envFile}`);
    console.log('Please create the environment file first.');
    return false;
  }

  // Backup current .env if it exists
  if (fs.existsSync('.env')) {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupName = `.env.backup.${timestamp}`;
    fs.copyFileSync('.env', backupName);
    console.log(`📦 Backed up current .env to ${backupName}`);
  }

  // Copy target environment to .env
  fs.copyFileSync(envFile, '.env');
  console.log(`✅ Switched to ${targetEnv} environment`);
  
  // Validate the new environment
  validateEnvironment(targetEnv);
  
  return true;
}

function validateEnvironment(envName) {
  const envFile = ENV_FILES[envName] || '.env';
  
  if (!fs.existsSync(envFile)) {
    console.error(`❌ Environment file not found: ${envFile}`);
    return false;
  }

  const content = fs.readFileSync(envFile, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });

  console.log(`\n🔍 Validating ${envName} environment:`);
  
  let isValid = true;
  REQUIRED_VARS.forEach(varName => {
    if (!vars[varName]) {
      console.log(`  ❌ Missing: ${varName}`);
      isValid = false;
    } else if (vars[varName].includes('your-') || vars[varName].includes('placeholder')) {
      console.log(`  ⚠️  Placeholder: ${varName} = ${vars[varName]}`);
    } else {
      console.log(`  ✅ ${varName}`);
    }
  });

  // Check for sensitive variables
  const sensitiveVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'JWT_SECRET'];
  sensitiveVars.forEach(varName => {
    if (vars[varName] && vars[varName].length < 10) {
      console.log(`  ⚠️  Weak: ${varName} (too short)`);
    }
  });

  if (isValid) {
    console.log(`\n✅ ${envName} environment is valid`);
  } else {
    console.log(`\n❌ ${envName} environment has issues`);
  }

  return isValid;
}

function createBackup() {
  if (!fs.existsSync('.env')) {
    console.error('❌ No .env file to backup');
    return false;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `.env.backup.${timestamp}`;
  
  fs.copyFileSync('.env', backupName);
  console.log(`✅ Created backup: ${backupName}`);
  return true;
}

function restoreBackup(backupName) {
  if (!fs.existsSync(backupName)) {
    console.error(`❌ Backup file not found: ${backupName}`);
    return false;
  }

  fs.copyFileSync(backupName, '.env');
  console.log(`✅ Restored from backup: ${backupName}`);
  return true;
}

function showDiff(env1, env2) {
  const file1 = ENV_FILES[env1] || env1;
  const file2 = ENV_FILES[env2] || env2;

  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    console.error('❌ One or both environment files not found');
    return false;
  }

  const content1 = fs.readFileSync(file1, 'utf8');
  const content2 = fs.readFileSync(file2, 'utf8');

  const vars1 = {};
  const vars2 = {};

  content1.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      vars1[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });

  content2.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      vars2[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });

  console.log(`\n📊 Differences between ${env1} and ${env2}:`);
  
  const allVars = new Set([...Object.keys(vars1), ...Object.keys(vars2)]);
  
  allVars.forEach(varName => {
    const val1 = vars1[varName];
    const val2 = vars2[varName];
    
    if (!val1) {
      console.log(`  + ${varName} = ${val2}`);
    } else if (!val2) {
      console.log(`  - ${varName} = ${val1}`);
    } else if (val1 !== val2) {
      console.log(`  ~ ${varName}:`);
      console.log(`    ${env1}: ${val1}`);
      console.log(`    ${env2}: ${val2}`);
    }
  });
}

// Main execution
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'switch':
    if (!args[0]) {
      console.error('❌ Please specify an environment to switch to');
      showHelp();
      process.exit(1);
    }
    switchEnvironment(args[0]);
    break;
    
  case 'validate':
    const envToValidate = args[0] || 'current';
    if (envToValidate === 'current') {
      validateEnvironment('current');
    } else {
      validateEnvironment(envToValidate);
    }
    break;
    
  case 'list':
    listEnvironments();
    break;
    
  case 'backup':
    createBackup();
    break;
    
  case 'restore':
    if (!args[0]) {
      console.error('❌ Please specify a backup file to restore from');
      showHelp();
      process.exit(1);
    }
    restoreBackup(args[0]);
    break;
    
  case 'diff':
    if (args.length < 2) {
      console.error('❌ Please specify two environments to compare');
      showHelp();
      process.exit(1);
    }
    showDiff(args[0], args[1]);
    break;
    
  default:
    showHelp();
    break;
} 