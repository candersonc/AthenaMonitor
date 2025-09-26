# Athenahealth Performance Test

This project uses Playwright to simulate healthcare provider workflows in Athenahealth and measure performance timings. It's designed for internal network testing to troubleshoot firewalls, browsers, and identify performance bottlenecks.

## Available Tests

### 1. Basic Workflow Test (`athena-experience.spec.ts`)
- SSO login with practice and department selection
- Patient search with detailed timing
- Measures login duration and search response time

### 2. Complete Patient Scheduling Workflow (`athena-full-workflow.spec.ts`)
- **Comprehensive end-to-end workflow including:**
  - SSO authentication (practice + department selection)
  - Patient search with autocomplete handling
  - Patient menu navigation through complex iframe structure
  - Quickview access
  - Scheduling interface navigation
  - Appointment scheduling setup

**Performance Metrics Tracked:**
- Practice selection timing
- Department selection timing
- Patient search response time (from Enter press to results)
- Patient menu navigation time
- Quickview load time
- Scheduling access time
- Appointment scheduling setup time
- Total login process duration
- Complete workflow duration

## Setup
1. Run `./install.sh` (from the parent directory where you saved install.sh).
   - This will create the project directory, install dependencies, prompt for credentials, and set up all files.
   - Credentials are stored in `.env` (do not commit this file to version control).

## Running the Tests
1. Navigate to the project directory: `cd athena-performance-test`
2. Run specific tests:
   - **Basic workflow**: `npx playwright test tests/athena-experience.spec.ts`
   - **Complete scheduling workflow**: `npx playwright test tests/athena-full-workflow.spec.ts`
   - **All tests**: `./run.sh`

## Test Output
- **Console logs**: Real-time timing measurements for each workflow step
- **HTML report**: Open `playwright-report/index.html` for detailed results
- **JSON results**: Performance data in `results.json`

## Performance Thresholds
- **Login process**: < 15 seconds
- **Patient search**: < 3 seconds
- **Complete workflow**: < 60 seconds

## Options for Custom Execution
- Headed mode: `npx playwright test --headed`
- Specific browser: `npx playwright test --browser=firefox`
- Debug network: `DEBUG=pw:api,pw:browser npx playwright test`
- UI mode: `npx playwright test --ui`

## Troubleshooting
- **Selectors Fail**: Use `npx playwright test --ui` to inspect and update selectors
- **Network Issues**: Test connectivity with `curl -I $ATHENA_SANDBOX_URL`
- **Update Credentials**: Edit `.env` directly or re-run install.sh (backup first)
- **Dependencies**: Run `npm install` if issues occur
- **Iframe Navigation**: Tests handle complex iframe structures automatically
- **Viewport Issues**: Force-click handling implemented for dropdown menus

## Technical Features
- **SSO Authentication**: Handles Athenahealth's two-step Go button flow
- **Iframe Navigation**: Robust navigation through nested contentFrame() structures
- **Autocomplete Handling**: Letter-by-letter typing to trigger patient search dropdowns
- **Performance Assertions**: Configurable thresholds with detailed timing breakdown
- **Error Resilience**: Fallback selectors and timeout handling

For more Playwright docs: https://playwright.dev/
