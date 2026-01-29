import { Context } from 'hono';
import { Env } from '../types';

/**
 * Serve OpenAPI specification metadata
 * GET /openapi - Returns info about where to get the spec
 */
export async function openapiHandler(c: Context<{ Bindings: Env }>): Promise<Response> {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    openapi: '3.0.3',
    info: {
      title: 'CRX Review API',
      version: '1.0.0',
      description: 'REST API for Chrome Extension (CRX) analysis and parsing',
    },
    specUrl: 'https://raw.githubusercontent.com/privatelinkio/crxreview/main/api/openapi/openapi.yaml',
    specDownload: `${baseUrl}/openapi.yaml`,
    docsUrl: 'https://github.com/privatelinkio/crxreview/tree/main/api/openapi',
    endpoints: {
      health: `${baseUrl}/health`,
      openapi: `${baseUrl}/openapi`,
      upload: `${baseUrl}/api/v1/extensions/upload`,
      download: `${baseUrl}/api/v1/extensions/download`,
    },
    note: 'Download the full OpenAPI spec from specUrl above, or visit docsUrl for examples',
  });
}
