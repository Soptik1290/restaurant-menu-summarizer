// server/test/cache.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Cache } from '@nestjs/cache-manager';
import axios from 'axios';
import OpenAI from 'openai';
import { MenuService } from '../src/menu/menu.service';

// --- Mocking Externals (Axios, OpenAI) ---
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockCompletionsCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCompletionsCreate } },
  }));
});

// --- Caching Test Suite ---
describe('Caching (e2e)', () => {
  let app: INestApplication;
  let cacheManager: Cache;
  let cacheGetSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Reset externals once
    mockedAxios.get.mockReset();
    mockCompletionsCreate.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    cacheManager = moduleFixture.get<Cache>(Cache);
  });

  afterAll(async () => {
    await app.close();
  });

  // Setup spies and mock returns before each test
  beforeEach(() => {
    // Reset call counts
    mockedAxios.get.mockClear();
    mockCompletionsCreate.mockClear();

    // Spy on cacheManager methods and set default mock return values
    cacheGetSpy = jest.spyOn(cacheManager, 'get').mockResolvedValue(null); // Default: Cache miss
    cacheSetSpy = jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined); // Mock implementation
    cacheGetSpy.mockClear(); // Clear calls before each test
    cacheSetSpy.mockClear(); // Clear calls before each test
  });

  // Clear spies after each test
  afterEach(() => {
     jest.restoreAllMocks(); // Restore original implementations
  });

  // ========================================================================
  // == CACHING TEST ========================================================
  // ========================================================================
  it('/menu/summarize (POST) should hit cache on second identical request', async () => {
    const testUrl = 'http://cache-e2e-test.com/menu';
    const mockHtml = '<html><body>PONDĚLÍ: Cache E2E Jídlo, 75 Kč</body></html>';
    const mockAiResponseArgsString = JSON.stringify({
      restaurant_name: 'Cache E2E Test Rest',
      menu_items: [{ name: 'Cache E2E Jídlo', price: 75, category: 'main' }],
      daily_menu: true,
    });

    // Arrange: Setup mocks for the first request
    mockedAxios.get.mockResolvedValue({ data: mockHtml, headers: { 'content-type': 'text/html' }, status: 200, statusText: 'OK', config: {} as any });
    mockCompletionsCreate.mockResolvedValue({ choices: [{ message: { tool_calls: [{ type: 'function', function: { name: 'save_menu_json', arguments: mockAiResponseArgsString } }] } }] });

    // Act 1: First Request
    await request(app.getHttpServer())
      .post('/menu/summarize')
      .send({ url: testUrl })
      .expect(200);

    // Assert 1: Verify mocks after first request
    expect(mockCompletionsCreate).toHaveBeenCalledTimes(1);
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    expect(cacheGetSpy).toHaveBeenCalledTimes(1);

    // Arrange 2: Reset AI mock counter and setup cache hit
    mockCompletionsCreate.mockClear();
    // Define the actual data object that should be returned from cache
    const cachedData = {
        restaurant_name: 'Cache E2E Test Rest',
        menu_items: [{ name: 'Cache E2E Jídlo', price: 75, category: 'main' }],
        daily_menu: true,
        date: new Date().toISOString().split('T')[0],
        source_url: testUrl
    };
    // Tell the spy to return the cached data to simulate cache hit
    cacheGetSpy.mockResolvedValue(cachedData);

    // Act 2: Second Request (Identical)
    await request(app.getHttpServer())
      .post('/menu/summarize')
      .send({ url: testUrl })
      .expect(200)
      .expect((res) => {
        expect(res.body.restaurant_name).toEqual('Cache E2E Test Rest');
      });

    // Assert 2: Verify mocks after second request
    expect(mockCompletionsCreate).not.toHaveBeenCalled();
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    expect(cacheGetSpy).toHaveBeenCalledTimes(2);
  });
  // == END OF CACHING TEST ==================================================

});