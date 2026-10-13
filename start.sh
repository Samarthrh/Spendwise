#!/bin/bash

# =========================================================
# SpendWise All-in-One Launcher Script
# =========================================================

echo "================================================="
echo "   🚀 Starting SpendWise Financial Application   "
echo "================================================="

# Determine project directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Cleanup background processes on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Shutting down SpendWise services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "1. Starting Backend API on http://localhost:5001..."
(cd "$DIR/backend" && npm start) &

echo "2. Starting Frontend Application on http://localhost:3000..."
(cd "$DIR/frontend" && npm run dev) &

echo ""
echo "✨ SpendWise is running!"
echo "🌐 Open Frontend: http://localhost:3000"
echo "⚡ Backend API:   http://localhost:5001"
echo ""
echo "👉 Press Ctrl+C at any time to stop both servers."
echo "================================================="

wait
