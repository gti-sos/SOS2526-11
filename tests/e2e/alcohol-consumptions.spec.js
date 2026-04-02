import { test, expect } from '@playwright/test';

// Apuntamos a tu ruta del frontend
const BASE_URL = 'http://localhost:8080/alcohol-consumptions-per-capita';

test.describe('Alcohol Consumptions - Pruebas E2E (Requisitos Funcionales)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  // 1. Crear un recurso
  test('1. Crear un recurso nuevo', async ({ page }) => {
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');
    
    await page.fill('[data-testid="create-nation"]', 'TestPais');
    await page.fill('[data-testid="create-year"]', '2024');
    await page.fill('[data-testid="create-litre"]', '10.5');
    await page.fill('[data-testid="create-recorded"]', '5.5');
    await page.fill('[data-testid="create-unrecorded"]', '5.0');
    
    await page.click('[data-testid="create-submit"]');
    await page.waitForTimeout(300); // Esperamos a que la tabla se recargue
    
    // Verificamos que la fila de TestPais aparece en la tabla
    const resource = page.locator('[data-testid="list-row-TestPais-2024"]');
    await expect(resource).toBeVisible();
  });

  // 2. Listar y Cargar Iniciales
  test('2. Cargar datos iniciales y listar', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForTimeout(500);
    
    const list = page.locator('[data-testid="alcohol-rates-list"]');
    await expect(list).toBeVisible();
  });

  // 3. Borrar todos
  test('3. Borrar todos los recursos', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]'); // Aseguramos que hay datos
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="delete-all-resources"]');
    await page.waitForTimeout(300);
    
    const list = page.locator('[data-testid="alcohol-rates-list"]');
    await expect(list).not.toBeVisible();
  });

  // 4. Borrar concreto
  test('4. Borrar un recurso concreto', async ({ page }) => {
    // Creamos uno primero para borrarlo
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');
    await page.fill('[data-testid="create-nation"]', 'DeleteTest');
    await page.fill('[data-testid="create-year"]', '2025');
    await page.fill('[data-testid="create-litre"]', '10');
    await page.fill('[data-testid="create-recorded"]', '5');
    await page.fill('[data-testid="create-unrecorded"]', '5');
    await page.click('[data-testid="create-submit"]');
    await page.waitForTimeout(300);

    // Lo borramos usando la caja de borrado específico
    await page.fill('[data-testid="delete-country"]', 'DeleteTest');
    await page.fill('[data-testid="delete-year"]', '2025');
    await page.click('[data-testid="delete-specific-submit"]');
    await page.waitForTimeout(300);

    // Verificamos que ya no está
    const resource = page.locator('[data-testid="list-row-DeleteTest-2025"]');
    await expect(resource).not.toBeAttached();
  });

  // 5. Búsqueda por país
  test('5. Buscar por país', async ({ page }) => {
    await page.click('[data-testid="load-initial-data"]');
    await page.waitForTimeout(500);
    
    await page.fill('[data-testid="search-nation"]', 'Spain'); // Suponiendo que Spain está en tus datos base
    await page.click('[data-testid="search-submit"]');
    await page.waitForTimeout(300);
    
    const list = page.locator('[data-testid="alcohol-rates-list"]');
    await expect(list).toBeVisible();
  });

  // 6. Limpiar búsqueda
  test('6. Limpiar búsqueda', async ({ page }) => {
    await page.fill('[data-testid="search-year"]', '2020');
    await page.click('[data-testid="search-submit"]');
    await page.waitForTimeout(300);
    
    await page.click('[data-testid="search-clear"]');
    await page.waitForTimeout(300);
    
    const yearInput = page.locator('[data-testid="search-year"]');
    expect(await yearInput.inputValue()).toBe('');
  });

  // 7. Navegar a la vista de Editar
  test('7. Ir a la vista de editar dinámica', async ({ page }) => {
    // Creamos uno para editar
    await page.click('[data-testid="toggle-create-form"]');
    await page.waitForSelector('[data-testid="create-form"]');
    await page.fill('[data-testid="create-nation"]', 'EditTest');
    await page.fill('[data-testid="create-year"]', '2026');
    await page.fill('[data-testid="create-litre"]', '10');
    await page.fill('[data-testid="create-recorded"]', '5');
    await page.fill('[data-testid="create-unrecorded"]', '5');
    await page.click('[data-testid="create-submit"]');
    await page.waitForTimeout(300);

    // Hacemos click en editar
    await page.click('[data-testid="edit-btn-EditTest-2026"]');
    
    // Verificamos que la URL cambia a la carpeta dinámica
    await expect(page).toHaveURL(/.*\/alcohol-consumptions-per-capita\/EditTest\/2026/);
  });
});