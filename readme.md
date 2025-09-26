# Athenahealth Performance Test

This project uses Playwright to simulate a common provider/MA workflow in athenahealth and measure performance timings. It's designed for internal network testing to troubleshoot firewalls, browsers, etc.

## Setup
1. Run `./install.sh` (from the parent directory where you saved install.sh).
   - This will create the project directory, install dependencies, prompt for credentials, and set up all files.
   - Credentials are stored in `.env` (do not commit this file to version control).

## Running the Test
1. Navigate to the project directory: `cd athena-performance-test`
2. Run `./run.sh`
   - This loads credentials from `.env` and executes the test.
   - Output: Console logs with timings (e.g., login duration, total workflow).
   - Results: HTML report (open `playwright-report/index.html`) and JSON (`results.json`).

## Options for run.sh
- Headed mode: `npx playwright test --headed`
- Specific browser: `npx playwright test --browser=firefox`
- Debug network: `DEBUG=pw:api,pw:browser npx playwright test`
- Update in run.sh or run directly for custom flags.

## Troubleshooting
- **Selectors Fail**: Inspect UI with `npx playwright test --ui` and update in `tests/athena-experience.spec.ts`.
- **Network Issues**: Use `curl -I $ATHENA_SANDBOX_URL` to test connectivity.
- **Update Creds**: Edit `.env` directly or re-run install.sh (but back up first).
- **Dependencies**: If issues, run `npm install` again.

## Customizing
- Add dashboard integration in the test script (e.g., fetch to your API).
- Adjust thresholds in assertions for performance expectations.

For more Playwright docs: https://playwright.dev/
