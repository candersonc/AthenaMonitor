#!/bin/bash

# This script runs the Playwright test, loading variables from .env

# Navigate to project dir if needed (assuming run from project root)

# Load .env variables
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  echo ".env file not found. Run install.sh first."
  exit 1
fi

# Run the Playwright test
npx playwright test tests/athena-experience.spec.ts
