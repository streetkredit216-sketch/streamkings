#!/bin/bash

# Create necessary directories
mkdir -p backend/src
mkdir -p backend/prisma
mkdir -p nginx
mkdir -p uploads

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Create environment files
cp .env.example .env

# Return to root directory
cd ..

# Create necessary directories for Docker volumes
mkdir -p mysql_data
mkdir -p elasticsearch_data

# Build Docker images
docker-compose build

echo "Setup completed successfully!"
echo "To start the development environment, run: docker-compose up -d" 