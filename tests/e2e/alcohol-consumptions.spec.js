import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080/alcohol-consumptions-per-capita';

test.describe('Alcohol Consumptions - Requisitos Funcionales', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/login');
    await page.waitForSelector('[data-testid="login-submit"]', { timeout: 10000 });
    await page.fill('[data-testid="login-username"]', 'admin');
    await page.fill('[data-testid="login-password"]', 'admin');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('**/alcohol-consumptions-per-capita', { timeout: 15000 });
  });

  test.afterEach(async ({ request }) => {
    // Limpiar la base de datos después de cada test
    try {
      const loginRes = await request.post('http://localhost:8080/api/v2/alcohol-consumptions-per-capita/login', {
        data: { username: 'admin', password: 'admin' }
      });
      if (loginRes.ok()) {
        const loginData = await loginRes.json();
        await request.delete('http://localhost:8080/api/v2/alcohol-consumptions-per-capita', {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
      }
    } catch (err) {
      console.log('Error limpiando base de datos:', err);
    }
  });

  // REQUISITO 1: Crear recurso
  test('1. Crear un recurso', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');
    
    await page.fill('[data-testid="create-nation"]', 'TestPais');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-litre"]', '10.5');
    await page.fill('[data-testid="create-recorded"]', '5.5');
    await page.fill('[data-testid="create-unrecorded"]', '5.0');
    await page.click('[data-testid="create-submit"]');
    
    // Esperamos inteligentemente a que la fila aparezca
    await page.waitForSelector('[data-testid="list-row-TestPais-2024"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="list-row-TestPais-2024"]')).toBeVisible();
  });

  // REQUISITO 2: Listar recursos
  test('2. Listar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="alcohol-rates-list"]')).toBeVisible();
  });

  // REQUISITO 3: Borrar todos
  test('3. Borrar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });

    await page.click('[data-testid="delete-all-resources"]');
    await expect(page.locator('[data-testid="alcohol-rates-list"]')).not.toBeAttached();
  });

  // REQUISITO 4: Borrar concreto
  test('4. Borrar un recurso concreto', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-nation"]', 'DeleteTest');
    await page.fill('[data-testid="create-year"]', '2025');
    await page.fill('[data-testid="create-litre"]', '10.0');
    await page.fill('[data-testid="create-recorded"]', '5.0');
    await page.fill('[data-testid="create-unrecorded"]', '5.0');
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="list-row-DeleteTest-2025"]');

    await page.fill('[data-testid="delete-country"]', 'DeleteTest');
    await page.fill('[data-testid="delete-year"]', '2025');
    await page.click('[data-testid="delete-specific-submit"]');

    await expect(page.locator('[data-testid="list-row-DeleteTest-2025"]')).not.toBeAttached();
  });

  // REQUISITO 5: Editar en vista separada
  test('5. Editar en vista separada dinámica', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-nation"]', 'EditTest');
    await page.fill('[data-testid="create-year"]', '2026');
    await page.fill('[data-testid="create-litre"]', '10.0');
    await page.fill('[data-testid="create-recorded"]', '5.0');
    await page.fill('[data-testid="create-unrecorded"]', '5.0');
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="edit-btn-EditTest-2026"]');
    await page.click('[data-testid="edit-btn-EditTest-2026"]');
    await expect(page).toHaveURL(/.*\/alcohol-consumptions-per-capita\/EditTest\/2026/);
  });

  // REQUISITO 6: Buscar por país
  test('6. Buscar por país', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });

    await page.fill('[data-testid="search-nation"]', 'Albania');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="alcohol-rates-list"]')).toBeVisible();
  });

  // REQUISITO 7: Buscar por año
  test('7. Buscar por año', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2016');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="alcohol-rates-list"]')).toBeVisible();
  });

  // REQUISITO 8: Buscar por rango de años
  test('8. Buscar por rango de años', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });

    await page.fill('[data-testid="search-from"]', '2010');
    await page.fill('[data-testid="search-to"]', '2020');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="alcohol-rates-list"]')).toBeVisible();
  });

  // REQUISITO 9: Limpiar búsqueda
  test('9. Limpiar búsqueda', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2016');
    await page.click('[data-testid="search-submit"]');
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 10000 });

    await page.click('[data-testid="search-clear"]');
    await page.waitForSelector('[data-testid="alcohol-rates-list"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="search-year"]')).toHaveValue('');
  });
});