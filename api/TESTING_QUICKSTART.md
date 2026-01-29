# Testing Quick Start Guide

## 30-Second Setup

```bash
cd /Users/brent.langston/git/crxreview/api
npm install  # If not already installed
npm test     # Run all tests
```

## Common Commands

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode (re-run on file change)
npm run test:coverage      # Generate coverage report
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:ui            # Interactive test UI
```

### View Results
```bash
npm run test:coverage
# Open coverage/index.html in your browser
```

### Debug Tests
```bash
npm run test:debug  # Start debugger
# Then open chrome://inspect in Chrome
```

## File Structure

```
tests/
├── utils/
│   ├── mocks.ts        # Mock R2, KV, Fetch
│   ├── fixtures.ts     # Test data
│   └── helpers.ts      # Helper functions
├── services/
│   ├── storage.service.test.ts    # R2 tests
│   └── session.service.test.ts    # KV tests
├── middleware/
│   ├── auth.test.ts               # Auth tests
│   ├── cors.test.ts               # CORS tests
│   ├── errorHandler.test.ts       # Error handling
│   └── rateLimiter.test.ts        # Rate limiting
├── handlers/
│   ├── health.test.ts             # Health endpoint
│   ├── upload.test.ts             # Upload endpoint
│   └── search.test.ts             # Search endpoint
└── README.md           # Detailed guide
```

## Test Count by Category

| Category | Tests | Status |
|----------|-------|--------|
| Storage Service | 70+ | Complete |
| Session Service | 65+ | Complete |
| Auth Middleware | 45+ | Complete |
| CORS Middleware | 50+ | Complete |
| Error Handler | 45+ | Complete |
| Rate Limiter | 60+ | Complete |
| Health Handler | 35+ | Complete |
| Upload Handler | 60+ | Complete |
| Search Handler | 65+ | Complete |
| **Total** | **495+** | ✓ |

## Mocks Available

### MockR2Bucket
```typescript
import { MockR2Bucket } from './utils/mocks';

const bucket = new MockR2Bucket();
await bucket.put('key', data);
const file = await bucket.get('key');
await bucket.delete('key');
```

### MockKVNamespace
```typescript
import { MockKVNamespace } from './utils/mocks';

const kv = new MockKVNamespace();
await kv.put('key', JSON.stringify(data));
const value = await kv.get('key', 'json');
await kv.delete('key');
```

## Test Helpers

### Create Mock Context
```typescript
import { createMockContext } from './utils/helpers';

const context = createMockContext({
  req: {
    headers: { 'x-api-key': 'test-key' }
  }
});
```

### Generate Session ID
```typescript
import { generateSessionId } from './utils/helpers';

const id = generateSessionId();
// Returns: "123e4567-e89b-12d3-a456-426614174000"
```

### Create Valid CRX
```typescript
import { createValidCRXFile } from './utils/helpers';

const crxFile = createValidCRXFile();
```

### Clear Storage
```typescript
import { clearMockStorage } from './utils/helpers';

afterEach(() => {
  clearMockStorage(context);
});
```

## Writing Tests

### Basic Test
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    const result = doSomething();
    expect(result).toBe('expected');
  });
});
```

### Async Test
```typescript
it('should work async', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### With Setup/Teardown
```typescript
describe('Service', () => {
  let service;

  beforeEach(() => {
    service = new Service();
  });

  afterEach(() => {
    service.cleanup();
  });

  it('should work', () => {
    expect(service).toBeDefined();
  });
});
```

### Error Testing
```typescript
it('should throw error', async () => {
  await expect(
    riskyOperation()
  ).rejects.toThrow('Expected error');
});
```

## Coverage Target

- **Statements**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Lines**: 80%+

Check coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## Environment Variables

Create `.env.test` (already created):
```
ENVIRONMENT=test
SESSION_TTL=1800
MAX_FILE_SIZE=52428800
RATE_LIMIT_DOWNLOAD=10
API_KEY_1=test-api-key-1
API_KEY_2=test-api-key-2
ALLOWED_ORIGINS=*
```

## Common Test Patterns

### Testing Storage
```typescript
const bucket = new MockR2Bucket();

// Put file
await bucket.put('key', data);

// Verify storage
expect(bucket.has('key')).toBe(true);

// Get file
const result = await bucket.get('key');
expect(result).toBeDefined();

// Track calls
const calls = bucket.getCallHistory('put');
expect(calls).toHaveLength(1);
```

### Testing KV
```typescript
const kv = new MockKVNamespace();

// Store data
await kv.put('key', JSON.stringify(data));

// Retrieve
const value = await kv.get('key', 'json');
expect(value.field).toBe('expected');

// List with filter
const result = await kv.list({ prefix: 'session:' });
expect(result.keys.length).toBeGreaterThan(0);
```

### Testing Errors
```typescript
const bucket = new MockR2Bucket();

// Simulate error
bucket.simulateError('key', new Error('Upload failed'));

// Test error handling
await expect(
  bucket.put('key', data)
).rejects.toThrow('Upload failed');

// Clear errors
bucket.clearErrors();
```

## Debugging

### Enable Logging
```typescript
it('should work', () => {
  console.log('Debug info:', value);
  expect(true).toBe(true);
});
```

### Run Single Test
```bash
npm test tests/services/storage.service.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -t "should upload"
```

### Watch Mode
```bash
npm run test:watch
```

## Troubleshooting

### Tests Running Slowly
- Check if you're properly mocking external calls
- Verify mocks are created in beforeEach
- Consider using test-only data

### Tests Failing Randomly
- Ensure no race conditions
- Use deterministic test data
- Mock random operations
- Clear storage in afterEach

### Mock Not Working
- Verify mock is created before test
- Check code under test uses mocked object
- Confirm mock method is being called

## Next Steps

1. **Review Examples**: Look at existing test files for patterns
2. **Run Tests**: `npm test` to see tests execute
3. **Check Coverage**: `npm run test:coverage`
4. **Write Tests**: Use patterns from existing tests as templates
5. **Keep Updated**: Update tests when code changes

## Documentation

- **tests/README.md** - Comprehensive testing guide (400+ lines)
- **TESTING_IMPLEMENTATION.md** - Implementation details
- **TEST_SUITE_SUMMARY.md** - Complete overview
- **TESTING_QUICKSTART.md** - This file

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Tests | 495+ |
| Test Files | 9 |
| Utility Files | 3 |
| Configuration Files | 2 |
| Documentation Files | 4 |
| Mock Classes | 4 |
| Helper Functions | 20+ |
| Code Coverage Target | 80%+ |
| TypeScript Support | Yes |
| Watch Mode | Yes |
| UI Mode | Yes |
| Debug Support | Yes |

## Support

- Read tests/README.md for detailed guide
- Check existing test files for examples
- Review mock documentation in utils/mocks.ts
- Check fixture data in utils/fixtures.ts
- Use helper functions from utils/helpers.ts

## Commands Reference

```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:ui            # UI mode
npm run test:debug         # Debug mode
```

---

**Ready to test!** Start with `npm test` to verify the setup is working.
