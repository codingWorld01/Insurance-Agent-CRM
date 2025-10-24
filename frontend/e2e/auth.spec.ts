import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");
  });

  test("should display login page for unauthenticated users", async ({
    page,
  }) => {
    // Should redirect to login page
    await expect(page).toHaveURL("/login");

    // Check login form elements
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show validation errors for invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should show error for invalid email format", async ({ page }) => {
    await page.goto("/login");

    // Enter invalid email
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show email format error
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in valid credentials (using default seeded credentials)
    await page.getByLabel(/email/i).fill("agent@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Should show dashboard content
    await expect(
      page.getByRole("heading", { name: /dashboard/i })
    ).toBeVisible();
    await expect(page.getByText(/total leads/i)).toBeVisible();
    await expect(page.getByText(/total clients/i)).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("agent@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");

    // Click logout button
    await page.getByRole("button", { name: /logout/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL("/login");
  });

  test("should redirect authenticated users from login page", async ({
    page,
  }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("agent@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL("/dashboard");

    // Try to go back to login page
    await page.goto("/login");

    // Should redirect back to dashboard
    await expect(page).toHaveURL("/dashboard");
  });
});
