/**
 * Jest global types
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function describe(name: string, fn: () => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function it(name: string, fn: () => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function expect(value: unknown): any;
}

export {};
