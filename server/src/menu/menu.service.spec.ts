import { Test } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import axios, { AxiosError } from 'axios';


jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockCompletionsCreate = jest.fn();
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: { completions: { create: mockCompletionsCreate } },
    }));
});

const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDel = jest.fn();

// --- Test ---
describe('MenuService', () => {
    let service: MenuService;

    beforeEach(async () => {
        // Reset mock functions before each test
        mockedAxios.get.mockReset();
        mockCompletionsCreate.mockReset();
        mockCacheGet.mockReset();
        mockCacheSet.mockReset();
        mockCacheDel.mockReset();

        const module = await Test.createTestingModule({
            providers: [
                MenuService,
                { provide: ConfigService, useValue: { get: () => 'fake-api-key' } },
                { provide: CACHE_MANAGER, useValue: { get: mockCacheGet, set: mockCacheSet, del: mockCacheDel } },
            ],
        }).compile();

        service = module.get<MenuService>(MenuService);
    });

    // ========================================================================
    // == UNIT TEST 1: Successful Case (Basic) =============================
    // ========================================================================
    it('should return menu data when everything works (basic)', async () => {
        // Arrange: Setup mock responses
        mockCacheGet.mockResolvedValue(null);
        mockedAxios.get.mockResolvedValue({
            data: '<html><body>PÁTEK: Jídlo 1, 120 Kč</body></html>',
            headers: { 'content-type': 'text/html' },
            status: 200, statusText: 'OK', config: {} as any,
        });
        mockCompletionsCreate.mockResolvedValue({
            choices: [{ message: { tool_calls: [{ type: 'function', function: { name: 'save_menu_json', arguments: JSON.stringify({ restaurant_name: 'Test', menu_items: [{ name: 'Jídlo 1', price: 120 }], daily_menu: true }) } }] } }],
        });

        // Act: Call the function
        const result = await service.summarize('http://example.com');

        // Assert: Verify the result
        expect(result).toBeDefined();
        expect(result.daily_menu).toBe(true);
        expect(result.menu_items.length).toBeGreaterThan(0);
        expect(result.menu_items[0].name).toBe('Jídlo 1');
        expect(mockCacheSet).toHaveBeenCalled();
    });
    // == END OF TEST 1 =======================================================

}); 