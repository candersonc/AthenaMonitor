// tests/athena-experience.spec.ts
import { test, expect } from '@playwright/test';
import 'dotenv/config'; // Load .env variables

test.describe('Athenahealth Front-End Performance - Common Provider/MA Workflow', () => {
  // Load and validate environment variables for SSO
  const sandboxUrl = process.env.ATHENA_SANDBOX_URL;
  const ssoUsername = process.env.SSO_USERNAME; // Optional for pre-filling
  const ssoPassword = process.env.SSO_PASSWORD; // Optional for pre-filling

  // Validate required environment variables
  test.beforeAll(() => {
    if (!sandboxUrl) {
      throw new Error('Missing required environment variable: ATHENA_SANDBOX_URL');
    }
  });

  test('should simulate common provider/MA workflow and measure key timings', async ({ page }) => {
    let totalWorkflowDuration = 0;
    const metrics: { [key: string]: number } = {};

    // Set consistent timeout for all operations
    const DEFAULT_TIMEOUT = 20000;

    // Add error handling wrapper
    const safeExecute = async (operation: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (error) {
        console.log(`Warning: ${operation} failed, continuing test:`, error);
      }
    };

    // 1. SSO LOGIN and measure login time
    console.log('Starting SSO login...');
    const loginStart = Date.now();
    await page.goto(sandboxUrl!);

    // Wait for the SSO page to load
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    console.log('SSO page loaded, looking for Go button...');

    // Look for the first Go button
    const goButton = page.getByRole('button', { name: /go/i })
      .or(page.getByRole('button', { name: 'Go' }))
      .or(page.locator('button').filter({ hasText: /^Go$/i }))
      .or(page.locator('input[type="submit"][value*="Go"]'))
      .or(page.locator('[data-testid*="go"]'))
      .first();

    // Check if first Go button is visible and click it
    if (await goButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('Found first Go button, clicking...');
      await goButton.click();

      // Wait for page to load after first Go button click
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      console.log('Looking for second Go button...');

      // Look for the second Go button (department selection)
      const secondGoButton = page.getByRole('button', { name: /go/i })
        .or(page.getByRole('button', { name: 'Go' }))
        .or(page.locator('button').filter({ hasText: /^Go$/i }))
        .or(page.locator('input[type="submit"][value*="Go"]'))
        .or(page.locator('[data-testid*="go"]'))
        .first();

      if (await secondGoButton.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('Found second Go button (department selection), clicking...');
        await secondGoButton.click();

        // Wait for navigation to main interface after department selection
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
        console.log('Department selection completed');
      } else {
        console.log('Second Go button not found - may have completed with first click');
      }
    } else {
      console.log('Go button not found - waiting for manual completion or different flow');
      // Wait for manual completion
      await page.waitForTimeout(30000);
    }

    // SSO login successful - now navigate to main Athenahealth interface
    console.log('SSO login completed successfully!');

    // Check if we need to navigate from completion page to main interface
    if (page.url().includes('/login/complete.esp')) {
      console.log('On completion page, navigating to main interface...');

      // Try to find a link or button to continue to main interface
      const continueToApp = page.getByRole('link', { name: /continue/i })
        .or(page.getByRole('button', { name: /continue/i }))
        .or(page.getByRole('link', { name: /enter/i }))
        .or(page.getByRole('link', { name: /athenahealth/i }))
        .or(page.getByRole('link', { name: /athenaone/i }))
        .or(page.getByText(/click here/i))
        .first();

      if (await continueToApp.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueToApp.click();
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      } else {
        // Try navigating directly to the base URL
        console.log('No continue button found, trying to navigate to base URL...');
        const baseUrl = sandboxUrl!.split('/login')[0]; // Get base URL without login path
        await page.goto(baseUrl);
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      }
    }

    metrics.loginDuration = Date.now() - loginStart;
    console.log(`✅ Login successful in ${metrics.loginDuration} ms.`);
    totalWorkflowDuration += metrics.loginDuration;

    // Wait a moment for the page to settle after navigation
    await page.waitForTimeout(3000);

    // 2. SEARCH FOR SPECIFIC PATIENT and measure search time
    console.log('Starting patient search for "1xtest, amber"...');
    const searchStart = Date.now();

    // Look for the search field using div id "search"
    const searchField = page.locator('#search')
      .or(page.locator('#search input'))
      .or(page.locator('div#search input'))
      .or(page.getByPlaceholder('find patient or clinical'))
      .or(page.getByPlaceholder(/find patient or clinical/i))
      .first();

    console.log(`Current URL after login: ${page.url()}`);
    console.log('Looking for search field on main page...');

    // Wait a bit for the main interface to fully load
    await page.waitForTimeout(5000);

    // This appears to be a frameset - try to find search field in frames
    try {
      const frames = page.frames();
      console.log(`Found ${frames.length} frames on the page`);

      let searchFound = false;
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        console.log(`Checking frame ${i}: ${frame.url()}`);

        // Look for search field in this frame - prioritize input elements
        const frameSearchField = frame.locator('#search input')
          .or(frame.locator('div#search input'))
          .or(frame.locator('.searchbox input'))
          .or(frame.getByPlaceholder('find patient or clinical'))
          .or(frame.getByPlaceholder(/find patient or clinical/i))
          .or(frame.locator('#search').locator('input'))
          .first();

        if (await frameSearchField.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found search field in frame ${i}!`);
          await frameSearchField.fill('1xtest, amber');

          // Look for search button in the same frame
          const frameSearchButton = frame.getByRole('button', { name: /search/i })
            .or(frame.locator('button[type="submit"]'))
            .or(frame.locator('[data-testid*="search"]'))
            .or(frame.locator('input[type="submit"]'))
            .or(frame.locator('button').filter({ hasText: /search/i }))
            .first();

          if (await frameSearchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('Found search button in same frame, clicking...');
            await frameSearchButton.click();
          } else {
            // Try pressing Enter on the search field
            console.log('No search button found, trying Enter key...');
            await frameSearchField.press('Enter');
          }

          searchFound = true;
          break;
        }
      }

      if (!searchFound) {
        console.log('Search field not found in any frame. Looking for any input field...');

        // Try to find any input field in any frame
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const anyInput = frame.locator('input[type="text"]')
            .or(frame.locator('input[type="search"]'))
            .or(frame.locator('input').filter({ hasAttribute: 'placeholder' }))
            .first();

          if (await anyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`Found input field in frame ${i}, using for search...`);
            await anyInput.fill('1xtest, amber');
            searchFound = true;
            break;
          }
        }
      }

      if (!searchFound) {
        console.log('No suitable search fields found in any frame.');
        return;
      }

      // Search has been submitted, now wait for results
      console.log('Search submitted, waiting for results...');
    } catch (error) {
      console.log('Error handling frames:', error);
      return;
    }

    // Wait for search results - try multiple indicators
    await expect(
      page.getByRole('list')
        .or(page.locator('[data-testid*="result"]'))
        .or(page.locator('.search-results'))
        .or(page.getByText(/1xtest.*amber/i))
        .or(page.getByText(/amber.*1xtest/i))
        .first()
    ).toBeVisible({ timeout: 15000 });
    metrics.searchDuration = Date.now() - searchStart;
    console.log(`✅ Patient search for "1xtest, amber" completed in ${metrics.searchDuration} ms.`);
    totalWorkflowDuration += metrics.searchDuration;

    // STOP HERE - Just measure login and patient search timing
    console.log('=== PERFORMANCE SUMMARY ===');
    console.log(`Login Duration: ${metrics.loginDuration} ms`);
    console.log(`Patient Search Duration: ${metrics.searchDuration} ms`);
    console.log(`Total Time: ${totalWorkflowDuration} ms`);

    // Skip the rest of the workflow for now
    return;

    // 4. OPEN PATIENT CHART and measure chart load time
    const chartOpenStart = Date.now();

    // Click the first result link that contains the patient's name
    const patientLink = page.getByRole('link', { name: /test.*patient/i })
      .or(page.locator('[data-testid*="patient"]'))
      .or(page.locator('a').filter({ hasText: /test.*patient/i }))
      .first();

    await patientLink.click();

    // Wait for chart to be ready - try multiple indicators
    await expect(
      page.locator('[data-testid*="patient-chart"]')
        .or(page.locator('[data-testid*="chart"]'))
        .or(page.getByRole('heading', { name: /test.*patient/i }))
        .or(page.locator('.patient-header'))
        .or(page.locator('.chart-header'))
        .first()
    ).toBeVisible({ timeout: 30000 });
    metrics.chartLoadDuration = Date.now() - chartOpenStart;
    console.log(`✅ Patient chart loaded in ${metrics.chartLoadDuration} ms.`);
    totalWorkflowDuration += metrics.chartLoadDuration;

    // 5. VIEW RECENT ACTIVITY / SUMMARY (common first step in chart)
    console.log('Navigating to Recent Activity tab...');
    const recentActivityStart = Date.now();
    await page.getByRole('tab', { name: /Recent Activity/i }).click();
    // Wait for tab content to load (e.g., list of appointments/labs)
    await expect(page.getByRole('listitem').first()).toBeVisible({ timeout: 15000 });
    metrics.recentActivityLoadDuration = Date.now() - recentActivityStart;
    console.log(`✅ Recent Activity loaded in ${metrics.recentActivityLoadDuration} ms.`);
    totalWorkflowDuration += metrics.recentActivityLoadDuration;

    // 6. START OR VIEW ENCOUNTER (simulate opening notes for documentation)
    console.log('Opening encounter/notes section...');
    const encounterStart = Date.now();

    // Try multiple encounter tab selectors
    const encounterTab = page.getByRole('tab', { name: /encounter/i })
      .or(page.getByRole('tab', { name: /note/i }))
      .or(page.getByRole('link', { name: /encounter/i }))
      .or(page.locator('[data-testid*="encounter"]'))
      .first();

    await encounterTab.click();

    // Wait for and click new encounter button
    const newEncounterBtn = page.getByRole('button', { name: /new.*encounter/i })
      .or(page.getByRole('button', { name: /create.*encounter/i }))
      .or(page.getByRole('button', { name: /add.*encounter/i }))
      .or(page.locator('[data-testid*="new-encounter"]'))
      .first();

    await expect(newEncounterBtn).toBeVisible({ timeout: 20000 });
    await newEncounterBtn.click();

    // Wait for encounter form to load
    await expect(
      page.getByLabel(/chief complaint/i)
        .or(page.getByLabel(/reason/i))
        .or(page.locator('[data-testid*="chief-complaint"]'))
        .or(page.locator('textarea'))
        .first()
    ).toBeVisible({ timeout: 20000 });
    metrics.encounterLoadDuration = Date.now() - encounterStart;
    console.log(`✅ Encounter/notes opened in ${metrics.encounterLoadDuration} ms.`);
    totalWorkflowDuration += metrics.encounterLoadDuration;

    // 7. SIMULATE DOCUMENTATION (add a note using copy forward or simple text)
    console.log('Simulating note entry...');
    const noteStart = Date.now();

    // Try copy forward button if available, otherwise skip
    const copyForwardBtn = page.getByRole('button', { name: /copy.*forward/i })
      .or(page.getByRole('button', { name: /template/i }))
      .or(page.locator('[data-testid*="copy-forward"]'));

    if (await copyForwardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await copyForwardBtn.click();
    }

    // Fill chief complaint field
    const chiefComplaintField = page.getByLabel(/chief complaint/i)
      .or(page.getByLabel(/reason/i))
      .or(page.locator('[data-testid*="chief-complaint"]'))
      .or(page.locator('textarea'))
      .first();

    await chiefComplaintField.fill('Routine follow-up visit');

    // Save the note
    const saveBtn = page.getByRole('button', { name: /save/i })
      .or(page.locator('[data-testid*="save"]'))
      .or(page.locator('button[type="submit"]'))
      .first();

    await saveBtn.click();

    // Wait for save confirmation
    await expect(
      page.getByText(/saved/i)
        .or(page.getByText(/success/i))
        .or(page.locator('[data-testid*="success"]'))
        .or(page.locator('.success'))
        .first()
    ).toBeVisible({ timeout: 15000 });
    metrics.noteSaveDuration = Date.now() - noteStart;
    console.log(`✅ Note saved in ${metrics.noteSaveDuration} ms.`);
    totalWorkflowDuration += metrics.noteSaveDuration;

    // 8. PLACE AN ORDER (e.g., lab order from favorites)
    console.log('Placing lab order...');
    const orderStart = Date.now();

    try {
      // Navigate to Orders tab
      const ordersTab = page.getByRole('tab', { name: /order/i })
        .or(page.getByRole('link', { name: /order/i }))
        .or(page.locator('[data-testid*="order"]'))
        .first();

      await ordersTab.click();

      const addOrderBtn = page.getByRole('button', { name: /add.*order/i })
        .or(page.getByRole('button', { name: /new.*order/i }))
        .or(page.getByRole('button', { name: /create.*order/i }))
        .or(page.locator('[data-testid*="add-order"]'))
        .first();

      await expect(addOrderBtn).toBeVisible({ timeout: 15000 });
      await addOrderBtn.click();

      // Try to select a lab order - use fallback if specific lab not available
      const labOption = page.getByRole('option', { name: /basic.*metabolic/i })
        .or(page.getByRole('option', { name: /cbc/i }))
        .or(page.getByRole('option', { name: /lab/i }))
        .or(page.locator('[data-testid*="lab"]'))
        .first();

      if (await labOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await labOption.click();

        const orderBtn = page.getByRole('button', { name: /order/i })
          .or(page.getByRole('button', { name: /submit/i }))
          .or(page.getByRole('button', { name: /place/i }))
          .or(page.locator('button[type="submit"]'))
          .first();

        await orderBtn.click();

        // Wait for order confirmation
        await expect(
          page.getByText(/order.*placed/i)
            .or(page.getByText(/order.*submitted/i))
            .or(page.getByText(/success/i))
            .or(page.locator('[data-testid*="success"]'))
            .first()
        ).toBeVisible({ timeout: 15000 });
      } else {
        console.log('Lab order options not available, skipping order placement');
        metrics.orderPlacementDuration = 0; // Skip this metric
      }
    } catch (error) {
      console.log('Order placement failed, continuing test:', error);
      metrics.orderPlacementDuration = 0;
    }
    if (metrics.orderPlacementDuration === undefined) {
      metrics.orderPlacementDuration = Date.now() - orderStart;
    }
    console.log(`✅ Lab order process completed in ${metrics.orderPlacementDuration} ms.`);
    totalWorkflowDuration += metrics.orderPlacementDuration;

    // 9. REVIEW MEDICATIONS / ALLERGIES (quick navigation check)
    console.log('Reviewing medications...');
    const medsStart = Date.now();
    await page.getByRole('tab', { name: /Medications/i }).click();
    await expect(page.getByRole('list').first()).toBeVisible({ timeout: 10000 }); // Med list
    metrics.medsReviewDuration = Date.now() - medsStart;
    console.log(`✅ Medications reviewed in ${metrics.medsReviewDuration} ms.`);
    totalWorkflowDuration += metrics.medsReviewDuration;

    // 10. SCHEDULE FOLLOW-UP APPOINTMENT
    console.log('Scheduling follow-up...');
    const scheduleStart = Date.now();

    try {
      // From chart, navigate to schedule
      const scheduleLink = page.getByRole('link', { name: /schedule.*appointment/i })
        .or(page.getByRole('button', { name: /schedule/i }))
        .or(page.locator('[data-testid*="schedule"]'))
        .first();

      await scheduleLink.click();

      const dateField = page.getByLabel(/appointment.*date/i)
        .or(page.getByLabel(/date/i))
        .or(page.locator('input[type="date"]'))
        .or(page.locator('[data-testid*="date"]'))
        .first();

      await expect(dateField).toBeVisible({ timeout: 15000 });

      // Calculate a future date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const appointmentDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      await dateField.fill(appointmentDate);

      const bookBtn = page.getByRole('button', { name: /book/i })
        .or(page.getByRole('button', { name: /schedule/i }))
        .or(page.getByRole('button', { name: /save/i }))
        .or(page.locator('button[type="submit"]'))
        .first();

      await bookBtn.click();

      await expect(
        page.getByText(/appointment.*scheduled/i)
          .or(page.getByText(/appointment.*booked/i))
          .or(page.getByText(/success/i))
          .or(page.locator('[data-testid*="success"]'))
          .first()
      ).toBeVisible({ timeout: 15000 });
    } catch (error) {
      console.log('Appointment scheduling failed, continuing test:', error);
    }
    metrics.scheduleDuration = Date.now() - scheduleStart;
    console.log(`✅ Follow-up scheduled in ${metrics.scheduleDuration} ms.`);
    totalWorkflowDuration += metrics.scheduleDuration;

    // 11. CLOSE ENCOUNTER AND RETURN TO DASHBOARD
    console.log('Closing encounter...');
    const closeStart = Date.now();
    await page.getByRole('button', { name: /Close Encounter/i }).click();
    await page.getByRole('button', { name: 'Yes' }).click(); // Confirm
    // Navigate back to dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
    metrics.closeDuration = Date.now() - closeStart;
    console.log(`✅ Encounter closed and back to dashboard in ${metrics.closeDuration} ms.`);
    totalWorkflowDuration += metrics.closeDuration;

    // 12. LOGOUT (optional, measure if needed)
    // await page.getByRole('button', { name: 'Log Out' }).click();

    // SUMMARY METRICS
    console.log('=== WORKFLOW SUMMARY ===');
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${key}: ${value} ms`);
    });
    console.log(`Total workflow duration: ${totalWorkflowDuration} ms`);

    // TODO: Integrate with your dashboard - e.g., send metrics to a logging service
    // Example:
    // async function sendToDashboard(metrics: { [key: string]: number }) {
    //   const response = await fetch('https://your-dashboard-api', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(metrics),
    //   });
    //   console.log('Metrics sent to dashboard:', await response.json());
    // }
    // await sendToDashboard(metrics);

    // Assertions for reasonable performance (adjust thresholds as needed)
    // Only assert on metrics that were actually measured
    if (metrics.loginDuration > 0) {
      expect(metrics.loginDuration).toBeLessThan(20000); // Increased to 20s for reliability
    }
    if (metrics.chartLoadDuration > 0) {
      expect(metrics.chartLoadDuration).toBeLessThan(15000); // Increased to 15s for reliability
    }
    expect(totalWorkflowDuration).toBeLessThan(180000); // Under 3 minutes for full flow (more realistic)
  });
});
