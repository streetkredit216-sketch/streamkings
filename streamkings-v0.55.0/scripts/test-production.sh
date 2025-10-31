#!/bin/bash

# Production Testing Script
# This script helps test the production setup locally

set -e

echo "🚀 Starting Production Testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_warning "Please create .env.production with your production settings"
    exit 1
fi

print_status "✅ Environment files found"

# Stop any running containers
print_status "🛑 Stopping any running containers..."
docker-compose down --remove-orphans

# Clean up old images (optional)
read -p "Do you want to rebuild all images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "🧹 Cleaning up old images..."
    docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans
fi

# Build and start production services
print_status "🔨 Building production services..."
docker-compose -f docker-compose.prod.yml build

print_status "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
print_status "🏥 Checking service health..."

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend is running on http://localhost:3000"
else
    print_error "❌ Frontend is not responding"
fi

# Check backend
if curl -f http://localhost:3006 > /dev/null 2>&1; then
    print_status "✅ Backend is running on http://localhost:3006"
else
    print_error "❌ Backend is not responding"
fi

# Check stream server
if curl -f http://localhost:4000 > /dev/null 2>&1; then
    print_status "✅ Stream server is running on http://localhost:4000"
else
    print_error "❌ Stream server is not responding"
fi

# Check database
if docker-compose -f docker-compose.prod.yml exec -T db mysqladmin ping -h localhost > /dev/null 2>&1; then
    print_status "✅ Database is running"
else
    print_error "❌ Database is not responding"
fi

# Check Elasticsearch
if curl -f http://localhost:9200 > /dev/null 2>&1; then
    print_status "✅ Elasticsearch is running on http://localhost:9200"
else
    print_error "❌ Elasticsearch is not responding"
fi

# Check Memcached
if docker-compose -f docker-compose.prod.yml exec -T memcached memcached-tool localhost:11211 stats > /dev/null 2>&1; then
    print_status "✅ Memcached is running"
else
    print_error "❌ Memcached is not responding"
fi

# Show running containers
print_status "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

print_status "🎉 Production testing setup complete!"
print_warning "Remember to update your .env.production with real production values before actual deployment"
print_status "You can now test your application at http://localhost:3000"

echo
print_status "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"