// tests/athena-experience.spec.ts
import { test, expect } from '@playwright/test';
import 'dotenv/config'; // Load .env variables

test.describe('Athenahealth Front-End Performance - Common Provider/MA Workflow', () => {
  // Load credentials securely from environment variables
  const username = process.env.ATHENA_SANDBOX_USER!;
  const password = process.env.ATHENA_SANDBOX_PASS!;
  const sandboxUrl = process.env.ATHENA_SANDBOX_URL!;

  test('should simulate common provider/MA workflow and measure key timings', async ({ page }) => {
    let totalWorkflowDuration = 0;
    const metrics: { [key: string]: number } = {};

    // 1. LOGIN and measure login time
    console.log('Starting login...');
    const loginStart = Date.now();
    await page.goto(sandboxUrl);
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Wait for the main dashboard to confirm login was successful
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30000 });
    metrics.loginDuration = Date.now() - loginStart;
    console.log(`✅ Login successful in ${metrics.loginDuration} ms.`);
    totalWorkflowDuration += metrics.loginDuration;

    // 2. NAVIGATE TO WORKFLOW DASHBOARD or CLINICAL INBOX (common starting point for tasks)
    console.log('Navigating to Workflow Dashboard...');
    const dashboardStart = Date.now();
    // Assuming a navigation link or tab; adjust selector based on UI inspection
    await page.getByRole('link', { name: /Workflow Dashboard/i }).click();
    // Wait for dashboard elements to load (e.g., task list or patient tasks)
    await expect(page.getByRole('heading', { name: /Workflow Dashboard/i })).toBeVisible({ timeout: 20000 });
    metrics.dashboardLoadDuration = Date.now() - dashboardStart;
    console.log(`✅ Workflow Dashboard loaded in ${metrics.dashboardLoadDuration} ms.`);
    totalWorkflowDuration += metrics.dashboardLoadDuration;

    // 3. SEARCH FOR TEST PATIENT and measure search time
    console.log('Starting patient search...');
    const searchStart = Date.now();
    await page.getByPlaceholder('Search for patient').fill('Test, Patient');
    await page.getByRole('button', { name: 'Search' }).click();
    // Wait for search results
    await expect(page.getByRole('list')).toBeVisible({ timeout: 15000 }); // Assuming results in a list
    metrics.searchDuration = Date.now() - searchStart;
    console.log(`✅ Patient search completed in ${metrics.searchDuration} ms.`);
    totalWorkflowDuration += metrics.searchDuration;

    // 4. OPEN PATIENT CHART and measure chart load time
    const chartOpenStart = Date.now();
    // Click the first result link that contains the patient's name
    await page.getByRole('link', { name: /Test, Patient/ }).first().click();
    // Wait for chart to be "ready" (e.g., patient summary header)
    await expect(page.locator('.patient-chart-summary-header')).toBeVisible({ timeout: 30000 });
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
    // Assuming navigation to Encounters or Notes tab
    await page.getByRole('tab', { name: /Encounters/i }).click();
    await expect(page.getByRole('button', { name: /New Encounter/i })).toBeVisible({ timeout: 20000 });
    // Click to start a new encounter or open existing
    await page.getByRole('button', { name: /New Encounter/i }).click();
    // Wait for encounter form to load
    await expect(page.getByLabel(/Chief Complaint/i)).toBeVisible({ timeout: 20000 });
    metrics.encounterLoadDuration = Date.now() - encounterStart;
    console.log(`✅ Encounter/notes opened in ${metrics.encounterLoadDuration} ms.`);
    totalWorkflowDuration += metrics.encounterLoadDuration;

    // 7. SIMULATE DOCUMENTATION (add a note using copy forward or simple text)
    console.log('Simulating note entry...');
    const noteStart = Date.now();
    // Use a macro or simple fill; simulate with copy forward if available
    await page.getByRole('button', { name: /Copy Forward/i }).click();
    await page.getByLabel(/Chief Complaint/i).fill('Routine follow-up visit');
    // Save the note
    await page.getByRole('button', { name: 'Save' }).click();
    // Wait for save confirmation
    await expect(page.getByText(/Saved successfully/i)).toBeVisible({ timeout: 10000 });
    metrics.noteSaveDuration = Date.now() - noteStart;
    console.log(`✅ Note saved in ${metrics.noteSaveDuration} ms.`);
    totalWorkflowDuration += metrics.noteSaveDuration;

    // 8. PLACE AN ORDER (e.g., lab order from favorites)
    console.log('Placing lab order...');
    const orderStart = Date.now();
    // Navigate to Orders tab
    await page.getByRole('tab', { name: /Orders/i }).click();
    await expect(page.getByRole('button', { name: /Add Order/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Add Order/i }).click();
    // Select a favorite lab (simulate selection)
    await page.getByRole('option', { name: /Basic Metabolic Panel/i }).click(); // Assuming dropdown
    await page.getByRole('button', { name: 'Order' }).click();
    // Wait for order confirmation
    await expect(page.getByText(/Order placed/i)).toBeVisible({ timeout: 15000 });
    metrics.orderPlacementDuration = Date.now() - orderStart;
    console.log(`✅ Lab order placed in ${metrics.orderPlacementDuration} ms.`);
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
    // From chart, navigate to schedule
    await page.getByRole('link', { name: /Schedule Appointment/i }).click();
    await expect(page.getByLabel(/Appointment Date/i)).toBeVisible({ timeout: 15000 });
    await page.getByLabel(/Appointment Date/i).fill('2025-10-01');
    await page.getByRole('button', { name: 'Book' }).click();
    await expect(page.getByText(/Appointment scheduled/i)).toBeVisible({ timeout: 10000 });
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
    expect(metrics.loginDuration).toBeLessThan(15000);
    expect(metrics.chartLoadDuration).toBeLessThan(10000);
    expect(totalWorkflowDuration).toBeLessThan(120000); // Under 2 minutes for full flow
  });
});
