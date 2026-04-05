import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080/road-fatalities';

test.describe('Road Fatalities - Requisitos Funcionales', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.afterEach(async ({ request }) => {
    // Limpiar la base de datos después de cada test
    try {
      await request.delete('http://localhost:8080/api/v2/road-fatalities');
    } catch (err) {
      // Ignorar errores en la limpieza
      console.log('Error limpiando base de datos:', err);
    }
  });

  // REQUISITO 1: Crear recurso
  test('1. Crear un recurso', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    await page.fill('[data-testid="create-nation"]', 'testnation');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total-death"]', '500');
    await page.selectOption('[data-testid="create-income-level"]', 'middle');
    await page.selectOption('[data-testid="create-traffic-side"]', 'right');
    await page.fill('[data-testid="create-population-death-rate"]', '5.5');
    await page.fill('[data-testid="create-vehicle-death-rate"]', '10.2');
    await page.fill('[data-testid="create-distance-death-rate"]', '3.1');
    
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="table-row-testnation-2024"]');
    await expect(page.locator('[data-testid="table-row-testnation-2024"]')).toBeVisible();
  });

  // REQUISITO 2: Listar recursos
  test('2. Listar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible();
  });

  // REQUISITO 3: Borrar todos
  test('3. Borrar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });

    
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="delete-all-resources"]');
    
    await expect(page.locator('[data-testid="road-fatalities-table"]')).not.toBeAttached();
  });

  // REQUISITO 4: Borrar concreto
  test('4. Borrar un recurso concreto', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    // Creamos el recurso con todos los datos
    await page.fill('[data-testid="create-nation"]', 'deletetest');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total-death"]', '100');
    await page.selectOption('[data-testid="create-income-level"]', 'high');
    await page.selectOption('[data-testid="create-traffic-side"]', 'left');
    await page.fill('[data-testid="create-population-death-rate"]', '1.0');
    await page.fill('[data-testid="create-vehicle-death-rate"]', '2.5');
    await page.fill('[data-testid="create-distance-death-rate"]', '1.2');
    
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="table-row-deletetest-2024"]');

    // Lo borramos usando el formulario específico
    await page.fill('[data-testid="delete-nation"]', 'deletetest');
    await page.fill('[data-testid="delete-year"]', '2024');
    await page.click('[data-testid="delete-specific-submit"]');

    await expect(page.locator('[data-testid="table-row-deletetest-2024"]')).not.toBeAttached();
  });

  // REQUISITO 5: Editar en vista separada
  test('5. Editar en vista separada dinámica', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');

    // Creamos el recurso inicial con TODOS los datos
    await page.fill('[data-testid="create-nation"]', 'edittest');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-total-death"]', '200');
    await page.selectOption('[data-testid="create-income-level"]', 'low');
    await page.selectOption('[data-testid="create-traffic-side"]', 'right');
    await page.fill('[data-testid="create-population-death-rate"]', '2.5');
    await page.fill('[data-testid="create-vehicle-death-rate"]', '4.0');
    await page.fill('[data-testid="create-distance-death-rate"]', '2.1');
    
    await page.click('[data-testid="create-submit"]');

    await page.waitForSelector('[data-testid="edit-btn-edittest-2024"]');
    await page.click('[data-testid="edit-btn-edittest-2024"]');
    await expect(page).toHaveURL(/.*\/road-fatalities\/edittest\/2024/);
  });

  // REQUISITO 6: Buscar por país
  test('6. Buscar por país', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-nation"]', 'spain');
    await page.click('[data-testid="search-submit"]');
    
    // Esperar a que el mensaje de éxito aparezca o a que la tabla se actualice
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible();
  });

  // REQUISITO 7: Buscar por año
  test('7. Buscar por año', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2013');
    await page.click('[data-testid="search-submit"]');
    
    // Esperar a que el mensaje de éxito aparezca
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible();
  });

  // REQUISITO 8: Buscar por rango de años
  test('8. Buscar por rango de años', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-from"]', '2010');
    await page.fill('[data-testid="search-to"]', '2020');
    await page.click('[data-testid="search-submit"]');
    
    // Esperar a que el mensaje de éxito aparezca
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible();
  });

  // REQUISITO 9: Limpiar búsqueda
  test('9. Limpiar búsqueda', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 15000 });

    await page.fill('[data-testid="search-year"]', '2013');
    await page.click('[data-testid="search-submit"]');
    
    // Esperar a que la búsqueda se complete
    await page.waitForSelector('[data-testid="message"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 10000 });

    await page.click('[data-testid="search-clear"]');
    
    // Después de limpiar, la tabla debería recargarse con todos los datos
    await page.waitForSelector('[data-testid="road-fatalities-table"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="search-year"]')).toHaveValue('');
  });
});