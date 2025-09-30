#!/bin/sh
set -e


# Install dependencies
npm install

# Start the Vite dev server
exec npm run dev -- --host 0.0.0.0
