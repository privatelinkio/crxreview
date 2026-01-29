# CRX Review API Test Suite

Comprehensive testing infrastructure for the CRX Review API using Vitest. This test suite provides confidence in the API's functionality across unit tests, integration tests, and middleware testing.

## Testing Philosophy

This test suite follows these core principles:

1. **Test Pyramid** - Many unit tests, fewer integration tests, minimal E2E tests
2. **Behavior Testing** - Test behavior and outcomes, not implementation details
3. **Isolation** - Tests are independent and can run in any order
4. **Determinism** - No flaky tests; results are always consistent
5. **Clarity** - Test names clearly describe what is being tested
6. **Completeness** - Both happy paths and edge cases are covered

## Test Structure

```
tests/
├── utils/
│   ├── mocks.ts          # Mock implementations for R2, KV, fetch
│   ├── fixtures.ts       # Test data and sample objects
│   └── helpers.ts        # Helper functions for test setup
├── services/
│   ├── storage.service.test.ts    # R2 storage operations
│   ├── session.service.test.ts    # KV session management
│   └── crx.service.test.ts        # CRX parsing logic
├── middleware/
│   ├── auth.test.ts              # Authentication/authorization
│   ├── cors.test.ts              # CORS headers
│   ├── errorHandler.test.ts      # Error formatting
│   └── rateLimiter.test.ts       # Rate limiting
├── handlers/
│   ├── upload.test.ts            # File upload endpoint
│   ├── download.test.ts          # Extension download endpoint
│   ├── search.test.ts            # Content search endpoint
│   ├── metadata.test.ts          # Session metadata endpoint
│   └── health.test.ts            # Health check endpoint
└── README.md             # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run unit tests only
```bash
npm run test:unit
```

Tests in `services/`, `middleware/`, and `utils/` directories.

### Run integration tests only
```bash
npm run test:integration
```

Tests in `handlers/` directory.

### Run tests in watch mode
```bash
npm run test:watch
```

Automatically re-run tests as you modify code.

### Run with coverage report
```bash
npm run test:coverage
```

Generates HTML coverage report in `coverage/` directory.

### Run tests with UI
```bash
npm run test:ui
```

Opens interactive test UI in browser.

### Run specific test file
```bash
vitest tests/services/storage.service.test.ts
```

### Run tests matching pattern
```bash
vitest -t "storage"
```

## Mock System

### R2 Storage Mock (`MockR2Bucket`)

Provides in-memory R2 bucket emulation with call tracking:

```typescript
import { MockR2Bucket } from '../utils/mocks';

const bucket = new MockR2Bucket();

// Simulate file upload
await bucket.put('key', data);

// Simulate file download
const file = await bucket.get('key');

// Track operations
const calls = bucket.getCallHistory('put');
bucket.clearCallHistory();

// Simulate errors
bucket.simulateError('key', new Error('Upload failed'));
```

Features:
- Full R2 API implementation
- Call tracking for assertions
- Error simulation
- Automatic cleanup
- ETag generation

### KV Namespace Mock (`MockKVNamespace`)

Provides in-memory KV namespace emulation:

```typescript
import { MockKVNamespace } from '../utils/mocks';

const kv = new MockKVNamespace();

// Store data
await kv.put('session:123', JSON.stringify(data));

// Retrieve data
const data = await kv.get('session:123', 'json');

// List keys
const result = await kv.list({ prefix: 'session:' });

// Track and verify
const calls = kv.getCallHistory('put');
```

Features:
- Supports JSON and text types
- Metadata storage
- TTL simulation
- Listing with prefix and pagination
- Call history tracking

### Fetch Mock (`MockFetcher`)

Simulates HTTP requests for download testing:

```typescript
import { MockFetcher } from '../utils/mocks';

const fetcher = new MockFetcher();

// Register response for URL
fetcher.registerResponse(
  'https://chromewebstore.google.com/detail/abc123',
  new MockFetchResponse(crxData, 200)
);

// Or use pattern matching
fetcher.registerResponse(
  /chromewebstore\.google\.com\/download/,
  (url) => new MockFetchResponse(crxData, 200)
);

const response = await fetcher.fetch('https://...');
```

## Test Fixtures

### Sample Data

Common test data is provided in `fixtures.ts`:

```typescript
import {
  SAMPLE_MANIFEST_V2,
  SAMPLE_MANIFEST_V3,
  SAMPLE_SESSION,
  SAMPLE_CRX_METADATA,
  SAMPLE_FILE_TREE,
  SAMPLE_SEARCH_RESULTS,
  SAMPLE_API_KEYS,
} from '../utils/fixtures';
```

### Creating Test Data

Use helper functions to generate test data:

```typescript
import {
  createTestSession,
  createValidCRXFile,
  generateSessionId,
  createMockContext,
} from '../utils/helpers';

// Create session with custom data
const session = createTestSession({
  data: { custom: 'value' }
});

// Generate unique IDs
const id = generateSessionId();

// Create mock Hono context
const context = createMockContext({
  req: {
    headers: { 'x-api-key': 'test-key' },
    body: { file: data }
  }
});
```

## Writing Tests

### BDD Style Test Names

```typescript
describe('Storage Service', () => {
  describe('putFile()', () => {
    it('should successfully upload a file to R2', async () => {
      // Arrange
      const bucket = new MockR2Bucket();
      const data = createValidCRXFile();

      // Act
      const result = await bucket.put('test.crx', data);

      // Assert
      expect(result.key).toBe('test.crx');
    });
  });
});
```

### Arrange-Act-Assert Pattern

All tests follow this structure:

1. **Arrange** - Set up test data and mocks
2. **Act** - Execute the code being tested
3. **Assert** - Verify the results

### Testing Success Paths

```typescript
it('should retrieve an existing file', async () => {
  // Arrange
  const bucket = new MockR2Bucket();
  await bucket.put('test.crx', data);

  // Act
  const result = await bucket.get('test.crx');

  // Assert
  expect(result).not.toBeNull();
  expect(result.key).toBe('test.crx');
});
```

### Testing Error Paths

```typescript
it('should throw error when upload fails', async () => {
  // Arrange
  const bucket = new MockR2Bucket();
  bucket.simulateError('test.crx', new Error('Upload failed'));

  // Act & Assert
  await expect(
    bucket.put('test.crx', data)
  ).rejects.toThrow('Upload failed');
});
```

### Testing Edge Cases

```typescript
it('should handle very large files', async () => {
  // Arrange
  const bucket = new MockR2Bucket();
  const largeData = new Uint8Array(52428800); // 50MB

  // Act
  const result = await bucket.put('large.crx', largeData);

  // Assert
  expect(result.metadata.size).toBe(52428800);
});
```

### Async Test Patterns

```typescript
// Using async/await
it('should process asynchronously', async () => {
  const result = await someAsyncOperation();
  expect(result).toBeDefined();
});

// Using promises
it('should handle promises', () => {
  return someAsyncOperation().then(result => {
    expect(result).toBeDefined();
  });
});
```

### Setup and Teardown

```typescript
describe('Session Service', () => {
  let kv: MockKVNamespace;

  beforeEach(() => {
    kv = new MockKVNamespace();
  });

  afterEach(() => {
    kv.clear();
  });

  it('should create session', async () => {
    // Test here
  });
});
```

## Coverage Requirements

The test suite aims for 80%+ coverage on:

- **Services** - Business logic layer
- **Middleware** - Request processing
- **Handlers** - API endpoints

Current coverage targets:
- Statements: 80%
- Functions: 80%
- Branches: 75%
- Lines: 80%

View coverage report:
```bash
npm run test:coverage
# Then open coverage/index.html
```

## Testing Services

### Storage Service Tests

Tests R2 bucket operations:
- File upload with metadata
- File retrieval and existence checks
- File deletion (single and bulk)
- File listing with filtering
- Error handling and timeouts
- Performance with large files

Run: `vitest tests/services/storage.service.test.ts`

### Session Service Tests

Tests KV namespace operations:
- Session creation with TTL
- Session retrieval and updates
- Session deletion (single and bulk)
- Session listing with pagination
- Data integrity and type handling
- Concurrent operations

Run: `vitest tests/services/session.service.test.ts`

### CRX Service Tests

Tests CRX file parsing:
- CRX2 and CRX3 format parsing
- Manifest extraction
- File tree generation
- Content searching
- File filtering
- Error handling for invalid formats

Run: `vitest tests/services/crx.service.test.ts`

## Testing Middleware

### Authentication Tests

Tests API key and bearer token validation:
- Valid and invalid API keys
- Bearer token extraction
- Multiple authentication methods
- Header handling (case-insensitivity)

Run: `vitest tests/middleware/auth.test.ts`

### CORS Tests

Tests CORS header addition and preflight:
- CORS headers on all requests
- OPTIONS preflight handling
- Origin validation
- Security headers

Run: `vitest tests/middleware/cors.test.ts`

### Error Handler Tests

Tests error formatting and response:
- ApiError formatting
- ValidationError from Zod
- Unknown error handling
- Request ID in responses
- Status code mapping

Run: `vitest tests/middleware/errorHandler.test.ts`

### Rate Limiter Tests

Tests rate limiting enforcement:
- Request counting per client
- Limit enforcement (429 responses)
- Rate limit headers
- Window reset
- Different limit types (IP, user, endpoint)

Run: `vitest tests/middleware/rateLimiter.test.ts`

## Testing Handlers

### Upload Handler Tests

Tests CRX file upload:
- Successful upload with metadata
- File validation
- Size limit enforcement
- Error handling

### Download Handler Tests

Tests extension download:
- Valid Chrome Web Store URL download
- Valid extension ID download
- Invalid input rejection
- Rate limit enforcement

### Search Handler Tests

Tests content searching:
- Text search across files
- Regex search with flags
- File pattern filtering
- Pagination

### Metadata Handler Tests

Tests session metadata retrieval:
- Session retrieval
- 404 for missing sessions
- Validation of input

### Health Handler Tests

Tests health check endpoint:
- Returns OK when healthy
- Service status reporting
- Proper response format
- No authentication required

## Assertions

Common assertion patterns:

```typescript
// Equality
expect(value).toBe(expected);
expect(object).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Nullability
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(count).toBeGreaterThan(0);
expect(count).toBeLessThan(100);
expect(count).toBeGreaterThanOrEqual(1);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');
expect(array).toEqual([1, 2, 3]);

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);
expect(text).toStartWith('prefix');

// Functions
expect(() => fn()).toThrow();
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg);

// Async
await expect(promise).resolves.toEqual(value);
await expect(promise).rejects.toThrow();
```

## Performance Testing

Tests include performance benchmarks:

```typescript
it('should process quickly', () => {
  const startTime = Date.now();

  // Perform operation

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(1000);
});
```

## Debugging Tests

### Run specific test
```bash
vitest tests/services/storage.service.test.ts
```

### Run tests matching pattern
```bash
vitest -t "should upload"
```

### Watch mode for single file
```bash
vitest --watch tests/services/storage.service.test.ts
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:debug"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console logging
```typescript
it('should work', () => {
  console.log('Debug output');
  expect(true).toBe(true);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Best Practices

1. **One assertion per test** when possible
2. **Clear test names** that describe the behavior
3. **Use fixtures** for common test data
4. **Mock external dependencies** (R2, KV, fetch)
5. **Test edge cases** (empty, null, very large)
6. **Clean up** in afterEach hooks
7. **Use beforeEach** for common setup
8. **Avoid test interdependencies** - tests should be independent
9. **Test behavior, not implementation**
10. **Keep tests fast** - mock slow operations

## Troubleshooting

### Tests are slow
- Check if you're mocking external calls
- Use `beforeEach` instead of creating mocks in tests
- Consider using test-only data instead of full files

### Tests are flaky
- Avoid relying on timing
- Use deterministic test data
- Mock random operations
- Clear mocks between tests

### Assertion failures
- Check the actual vs expected values carefully
- Use `.toEqual()` for objects, `.toBe()` for primitives
- Check error messages for clues

### Mock not working
- Ensure mock is created before test runs
- Check that code under test uses the mocked object
- Verify mock method is called

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Node.js Testing](https://nodejs.org/api/test.html)

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use BDD style names
3. Include happy path and error cases
4. Add fixtures if needed
5. Document any new helpers
6. Maintain 80%+ coverage
7. Run full test suite before committing

## Environment Variables

Create `.env.test` for test-specific configuration:

```
ENVIRONMENT=test
SESSION_TTL=1800
MAX_FILE_SIZE=52428800
RATE_LIMIT_DOWNLOAD=10
API_KEY_1=test-api-key-1
API_KEY_2=test-api-key-2
ALLOWED_ORIGINS=*
```

## Contact

For questions about testing strategy or implementation, consult:
- Test README (this file)
- Individual test files for examples
- Vitest documentation
