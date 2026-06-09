#!/bin/bash

# Real Estate Platform - Quick Start Script
# Run this script to set up and start the application

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Real Estate Premium Platform - Quick Start Setup         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found!"
    echo "  Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "  Node.js version: $NODE_VERSION"

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found!"
    echo "  Please install npm"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "  npm version: $NPM_VERSION"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 1: Installing Dependencies"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -d "node_modules" ]; then
    echo "✓ node_modules already exists"
    read -p "  Reinstall dependencies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install
    fi
else
    npm install
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 2: Environment Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f ".env" ]; then
    echo "✓ .env file already exists"
    read -p "  Recreate from template? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.example .env
        echo "✓ .env recreated from template"
    fi
else
    echo "✓ Creating .env from template..."
    cp .env.example .env
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 3: AWS Credentials Setup"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Please add your AWS credentials to .env file:"
echo ""
echo "  1. Open: .env"
echo "  2. Get credentials from AWS Console:"
echo "     - VITE_AWS_ACCESS_KEY_ID"
echo "     - VITE_AWS_SECRET_ACCESS_KEY"
echo "     - VITE_S3_BUCKET_NAME"
echo "     - VITE_AWS_REGION"
echo ""
echo "  3. Save the file"
echo ""

read -p "Have you filled in your AWS credentials? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "✗ Please fill in AWS credentials first"
    echo "  See ENV_SETUP.md for detailed instructions"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 4: Verifying Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check .env has values
if grep "your_" .env > /dev/null; then
    echo "✗ .env still has template values!"
    echo "  Please update .env with your real credentials"
    exit 1
fi

echo "✓ .env looks good"
echo "✓ npm dependencies installed"
echo "✓ Ready to start!"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STARTING DEVELOPMENT SERVER"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Opening browser in 3 seconds..."
echo ""
echo "Server will start at: http://localhost:5173"
echo ""
echo "Login with:"
echo "  Email: demo@example.com"
echo "  Password: password"
echo ""
echo "Press Ctrl+C to stop server"
echo ""

sleep 3

# Start dev server
npm run dev
