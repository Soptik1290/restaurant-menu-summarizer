import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Cache } from '@nestjs/cache-manager';
import axios, { AxiosError } from 'axios';
import OpenAI from 'openai';
import { MenuService } from '../src/menu/menu.service';

// --- Mocking Externals ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockCompletionsCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCompletionsCreate } },
  }));
});

// Mock CacheManager methods (these will be assigned to the overridden provider in some approaches, or spied on)
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDel = jest.fn();

// --- Integration Test ---
describe('MenuController (e2e)', () => {
  let app: INestApplication;
  let menuService: MenuService;
  let cacheManager: Cache;
  let cacheSetSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Reset externals once
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockCompletionsCreate.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockCacheDel.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    menuService = moduleFixture.get<MenuService>(MenuService);
    cacheManager = moduleFixture.get<Cache>(Cache);

  });

  afterAll(async () => {
    await app.close();
  });

  // Setup spies and mock returns before each test
  beforeEach(() => {
    // Reset call counts for mocks that should be checked per test
    mockedAxios.get.mockClear();
    mockCompletionsCreate.mockClear();

    // Mock cacheManager.get before request
    // Use jest.spyOn to mock the 'get' method on the actual cacheManager instance
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

    // Create spy for the 'set' method on the actual cacheManager instance
    cacheSetSpy = jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);
    cacheSetSpy.mockClear();
  });

  // Clear spies after each test
  afterEach(() => {
     jest.restoreAllMocks();
  });


  // --- Integration Test Case ---
  it('/menu/summarize (POST) - basic success case', async () => {
    const testUrl = 'http://fake-test.com/menu';
    const mockHtml = '<html><body>PÁTEK: Test Jídlo, 99 Kč</body></html>';
    // Important: 'arguments' must be a STRING containing valid JSON
    const mockAiResponseArgsString = JSON.stringify({
      restaurant_name: 'E2E Test Rest',
      menu_items: [{ name: 'Test Jídlo', price: 99, category: 'main' }],
      daily_menu: true,
    });
    const expectedDate = new Date().toISOString().split('T')[0];

    // Arrange: Setup external mocks (axios, OpenAI)
    mockedAxios.get.mockResolvedValue({ data: mockHtml, headers: { 'content-type': 'text/html' }, status: 200, statusText: 'OK', config: {} as any });
    // Simplest valid mock structure:
    mockCompletionsCreate.mockResolvedValue({
      choices: [{
        message: {
          tool_calls: [{
            type: 'function' as const,
            function: {
              name: 'save_menu_json',
              arguments: mockAiResponseArgsString
            }
          }]
        }
      }]
    });

    // Act & Assert: Send HTTP request
    await request(app.getHttpServer())
      .post('/menu/summarize')
      .send({ url: testUrl })
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
        expect(res.body.restaurant_name).toEqual('E2E Test Rest');
        expect(res.body.daily_menu).toEqual(true);
        // Important: Check if menu_items is an array with length > 0 before accessing [0]
        expect(res.body.menu_items).toBeInstanceOf(Array);
        expect(res.body.menu_items.length).toBeGreaterThan(0);
        expect(res.body.menu_items[0].name).toEqual('Test Jídlo');
      });

    // Assert separately: Verify that our SPY on cacheManager.set was called
    expect(cacheSetSpy).toHaveBeenCalled();
  });

  // --- Invalid URL Test ---
  it('/menu/summarize (POST) - invalid URL format', async () => {
    return request(app.getHttpServer())
      .post('/menu/summarize')
      .send({ url: 'not-a-valid-url' })
      .expect(400);
  });

});