# Production Testing Script for Windows PowerShell
# This script helps test the production setup locally

Write-Host "🚀 Starting Production Testing..." -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "[ERROR] .env.production file not found!" -ForegroundColor Red
    Write-Host "[WARNING] Please create .env.production with your production settings" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] ✅ Environment files found" -ForegroundColor Green

# Stop any running containers
Write-Host "[INFO] 🛑 Stopping any running containers..." -ForegroundColor Green
docker-compose down --remove-orphans

# Clean up old images (optional)
$rebuild = Read-Host "Do you want to rebuild all images? (y/n)"
if ($rebuild -eq "y" -or $rebuild -eq "Y") {
    Write-Host "[INFO] 🧹 Cleaning up old images..." -ForegroundColor Green
    docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans
}

# Build and start production services
Write-Host "[INFO] 🔨 Building production services..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml build

Write-Host "[INFO] 🚀 Starting production services..." -ForegroundColor Green
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
Write-Host "[INFO] ⏳ Waiting for services to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 30

# Check service health
Write-Host "[INFO] 🏥 Checking service health..." -ForegroundColor Green

# Check frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[INFO] ✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] ❌ Frontend is not responding" -ForegroundColor Red
}

# Check backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[INFO] ✅ Backend is running on http://localhost:3006" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] ❌ Backend is not responding" -ForegroundColor Red
}

# Check stream server
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[INFO] ✅ Stream server is running on http://localhost:4000" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] ❌ Stream server is not responding" -ForegroundColor Red
}

# Check database
try {
    docker-compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost | Out-Null
    Write-Host "[INFO] ✅ Database is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] ❌ Database is not responding" -ForegroundColor Red
}

# Check Elasticsearch
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9200" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[INFO] ✅ Elasticsearch is running on http://localhost:9200" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] ❌ Elasticsearch is not responding" -ForegroundColor Red
}

# Check Memcached
try {
    docker-compose -f docker-compose.prod.yml exec -T memcached memcached-tool localhost:11211 stats | Out-Null
    Write-Host "[INFO] ✅ Memcached is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] ❌ Memcached is not responding" -ForegroundColor Red
}

# Show running containers
Write-Host "[INFO] 📊 Container status:" -ForegroundColor Green
docker-compose -f docker-compose.prod.yml ps

Write-Host "[INFO] 🎉 Production testing setup complete!" -ForegroundColor Green
Write-Host "[WARNING] Remember to update your .env.production with real production values before actual deployment" -ForegroundColor Yellow
Write-Host "[INFO] You can now test your application at http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "[INFO] Useful commands:" -ForegroundColor Green
Write-Host "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
Write-Host "  Stop services: docker-compose -f docker-compose.prod.yml down"
Write-Host "  Restart services: docker-compose -f docker-compose.prod.yml restart"