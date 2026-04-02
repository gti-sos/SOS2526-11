import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080/literacy-rates';

test.describe('Literacy Rates - Requisitos Funcionales', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  // REQUISITO 1: Crear recurso
  test('1. Crear un recurso', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-country"]', 'TestPais');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total"]', '95.5');
    await page.fill('[data-testid="create-male"]', '96.0');
    await page.fill('[data-testid="create-female"]', '95.0');
    await page.fill('[data-testid="create-gender-gap"]', '1.0');
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="table-row-TestPais-2024"]');
    await expect(page.locator('[data-testid="table-row-TestPais-2024"]')).toBeVisible();
  });

  // REQUISITO 2: Listar recursos
  test('2. Listar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    // Wait for the success message first, then the table
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="literacy-rates-table"]')).toBeVisible();
  });

  // REQUISITO 3: Borrar todos
  test('3. Borrar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });

    await page.click('[data-testid="delete-all-resources"]');
    await expect(page.locator('[data-testid="literacy-rates-table"]')).not.toBeAttached();
  });

  // REQUISITO 4: Borrar concreto
  test('4. Borrar un recurso concreto', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-country"]', 'DeleteTest');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total"]', '90.0');
    await page.fill('[data-testid="create-male"]', '91.0');
    await page.fill('[data-testid="create-female"]', '89.0');
    await page.fill('[data-testid="create-gender-gap"]', '2.0');
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="table-row-DeleteTest-2024"]');

    await page.fill('[data-testid="delete-country"]', 'DeleteTest');
    await page.fill('[data-testid="delete-year"]', '2024');
    await page.click('[data-testid="delete-specific-submit"]');

    await expect(page.locator('[data-testid="table-row-DeleteTest-2024"]')).not.toBeAttached();
  });

  // REQUISITO 5: Editar en vista separada
  test('5. Editar en vista separada dinámica', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-country"]', 'EditTest');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total"]', '85.0');
    await page.fill('[data-testid="create-male"]', '86.0');
    await page.fill('[data-testid="create-female"]', '84.0');
    await page.fill('[data-testid="create-gender-gap"]', '2.0');
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="edit-btn-EditTest-2024"]');
    await page.click('[data-testid="edit-btn-EditTest-2024"]');
    await expect(page).toHaveURL(/.*\/literacy-rates\/EditTest\/2024/);
  });

  // REQUISITO 6: Buscar por país
  test('6. Buscar por país', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-country"]', 'Spain');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="literacy-rates-table"]')).toBeVisible();
  });

  // REQUISITO 7: Buscar por año
  test('7. Buscar por año', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2020');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="literacy-rates-table"]')).toBeVisible();
  });

  // REQUISITO 8: Buscar por rango de años
  test('8. Buscar por rango de años', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-from"]', '2010');
    await page.fill('[data-testid="search-to"]', '2020');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="literacy-rates-table"]')).toBeVisible();
  });

  // REQUISITO 9: Limpiar búsqueda
  test('9. Limpiar búsqueda', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2020');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="literacy-rates-table"]', { timeout: 10000 });

    await page.click('[data-testid="search-clear"]');
    await expect(page.locator('[data-testid="search-year"]')).toHaveValue('');
  });
});