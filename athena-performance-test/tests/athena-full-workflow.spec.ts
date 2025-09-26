// tests/athena-full-workflow.spec.ts
import { test, expect } from '@playwright/test';
import 'dotenv/config'; // Load .env variables

test.describe('Athena Patient Scheduling Workflow', () => {
  // Load and validate environment variables for SSO
  const sandboxUrl = process.env.ATHENA_SANDBOX_URL;

  // Validate required environment variables
  test.beforeAll(() => {
    if (!sandboxUrl) {
      throw new Error('Missing required environment variable: ATHENA_SANDBOX_URL');
    }
  });

  test('should measure patient scheduling workflow performance', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds
    let totalWorkflowDuration = 0;
    const metrics: { [key: string]: number } = {};

    // 1. INITIAL SSO LOGIN
    console.log('Starting SSO login...');
    const initialLoginStart = Date.now();
    await page.goto(sandboxUrl!);

    // Wait for page load
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });

    // Select practice (based on codegen output)
    await page.locator('div').filter({ hasText: 'Practice WA - CHAS - 11411WA' }).first().click();
    await page.getByRole('button', { name: 'Go' }).click();

    metrics.practiceSelectionDuration = Date.now() - initialLoginStart;
    console.log(`✅ Practice selection completed in ${metrics.practiceSelectionDuration} ms`);
    totalWorkflowDuration += metrics.practiceSelectionDuration;

    // 2. DEPARTMENT SELECTION
    console.log('Starting department selection...');
    const deptSelectionStart = Date.now();

    await page.getByRole('button', { name: 'Go' }).click();

    // Wait for main interface to load
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    metrics.departmentSelectionDuration = Date.now() - deptSelectionStart;
    console.log(`✅ Department selection completed in ${metrics.departmentSelectionDuration} ms`);
    totalWorkflowDuration += metrics.departmentSelectionDuration;

    // Calculate total login time
    metrics.totalLoginDuration = metrics.practiceSelectionDuration + metrics.departmentSelectionDuration;
    console.log(`✅ Complete login process took ${metrics.totalLoginDuration} ms`);

    // 3. PATIENT SEARCH (using better selectors from codegen)
    console.log('Starting patient search...');

    // Wait for frames to load
    await page.waitForTimeout(3000);

    // Use the exact selector from codegen for search field
    const searchField = page.locator('#GlobalNav').contentFrame().locator('#searchinput');
    await expect(searchField).toBeVisible({ timeout: 10000 });

    // Type patient ID letter by letter to trigger autocomplete
    await searchField.click();
    await searchField.clear();
    console.log('Typing patient ID letter by letter...');
    await searchField.type('903430', { delay: 150 });

    // Start timing from when Enter is pressed
    console.log('Pressing Enter to search...');
    const searchStart = Date.now();
    await searchField.press('Enter');

    // Wait for search results to load
    await page.waitForTimeout(2000);

    metrics.patientSearchDuration = Date.now() - searchStart;
    console.log(`✅ Patient search response time: ${metrics.patientSearchDuration} ms`);
    totalWorkflowDuration += metrics.patientSearchDuration;

    // 4. PATIENT MENU NAVIGATION
    console.log('Opening patient menu...');
    const menuStart = Date.now();

    // Wait longer for patient page to fully load after search
    await page.waitForTimeout(5000);

    // Click dropdown trigger (from codegen) - try with force if needed
    const dropdownTrigger = page.locator('#GlobalWrapper').contentFrame()
      .locator('#frameContent').contentFrame()
      .locator('iframe[name="frMain"]').contentFrame()
      .locator('.drop-down-popup-trigger').first();

    console.log('Looking for dropdown trigger...');
    await expect(dropdownTrigger).toBeVisible({ timeout: 15000 });

    console.log('Clicking dropdown trigger...');
    // Try clicking with force to handle viewport issues
    await dropdownTrigger.click({ force: true });

    // Wait for menu to appear
    await page.waitForTimeout(1000);

    metrics.patientMenuDuration = Date.now() - menuStart;
    console.log(`✅ Patient menu opened in ${metrics.patientMenuDuration} ms`);
    totalWorkflowDuration += metrics.patientMenuDuration;

    // 5. QUICKVIEW ACCESS
    console.log('Accessing Quickview...');
    const quickviewStart = Date.now();

    const quickviewOption = page.locator('#GlobalWrapper').contentFrame()
      .locator('#frameContent').contentFrame()
      .locator('iframe[name="frMain"]').contentFrame()
      .getByText('Quickview');

    await expect(quickviewOption).toBeVisible({ timeout: 5000 });
    await quickviewOption.click();

    // Wait for quickview to load
    await page.waitForTimeout(2000);

    metrics.quickviewDuration = Date.now() - quickviewStart;
    console.log(`✅ Quickview loaded in ${metrics.quickviewDuration} ms`);
    totalWorkflowDuration += metrics.quickviewDuration;

    // 6. SCHEDULING ACCESS
    console.log('Accessing Scheduling...');
    const schedulingStart = Date.now();

    const schedulingOption = page.locator('#GlobalWrapper').contentFrame()
      .locator('#frameContent').contentFrame()
      .locator('iframe[name="frMain"]').contentFrame()
      .getByText('Scheduling', { exact: true });

    await expect(schedulingOption).toBeVisible({ timeout: 5000 });
    await schedulingOption.click();

    // Wait for scheduling interface
    await page.waitForTimeout(2000);

    metrics.schedulingAccessDuration = Date.now() - schedulingStart;
    console.log(`✅ Scheduling interface loaded in ${metrics.schedulingAccessDuration} ms`);
    totalWorkflowDuration += metrics.schedulingAccessDuration;

    // 7. SCHEDULE APPOINTMENT
    console.log('Opening Schedule Appointment...');
    const appointmentStart = Date.now();

    const scheduleAppointment = page.locator('#GlobalWrapper').contentFrame()
      .locator('#frameContent').contentFrame()
      .locator('iframe[name="frMain"]').contentFrame()
      .getByText('Schedule Appointment');

    await expect(scheduleAppointment).toBeVisible({ timeout: 5000 });
    await scheduleAppointment.click();

    // Wait for appointment scheduling interface
    await page.waitForTimeout(3000);

    metrics.appointmentSchedulingDuration = Date.now() - appointmentStart;
    console.log(`✅ Appointment scheduling opened in ${metrics.appointmentSchedulingDuration} ms`);
    totalWorkflowDuration += metrics.appointmentSchedulingDuration;

    // PERFORMANCE SUMMARY
    console.log('\n=== COMPLETE WORKFLOW PERFORMANCE SUMMARY ===');
    console.log(`1. Practice Selection: ${metrics.practiceSelectionDuration} ms`);
    console.log(`2. Department Selection: ${metrics.departmentSelectionDuration} ms`);
    console.log(`3. Patient Search Response: ${metrics.patientSearchDuration} ms`);
    console.log(`4. Patient Menu: ${metrics.patientMenuDuration} ms`);
    console.log(`5. Quickview Load: ${metrics.quickviewDuration} ms`);
    console.log(`6. Scheduling Access: ${metrics.schedulingAccessDuration} ms`);
    console.log(`7. Appointment Scheduling: ${metrics.appointmentSchedulingDuration} ms`);
    console.log(`---`);
    console.log(`Total Login Process: ${metrics.totalLoginDuration} ms`);
    console.log(`Total Workflow Time: ${totalWorkflowDuration} ms`);

    // Brief pause to ensure final state is stable
    await page.waitForTimeout(2000);

    // Performance assertions
    expect(metrics.totalLoginDuration).toBeLessThan(15000); // Under 15 seconds for login
    expect(metrics.patientSearchDuration).toBeLessThan(3000); // Under 3 seconds for search
    expect(totalWorkflowDuration).toBeLessThan(60000); // Under 1 minute for complete workflow
  });
});