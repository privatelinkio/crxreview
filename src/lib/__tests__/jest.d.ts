/**
 * Jest global types
 */

declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect(value: unknown): any;
}

export {};
