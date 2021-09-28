import extractDeviceName from './extractDeviceName';

describe('extractDeviceName', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  test.each([
    ['EB449DF0-39DC-457A-B2D7-25CE51BB1A2E (iPhone X)', 'iPhone X'],
    ['EB449DF0-39DC-457A-B2D7-25CE51BB1A2E {"type": "iPhone 11"}', 'iPhone 11'],
  ])('should parse %j to: %s', (input, expected) => {
    expect(extractDeviceName(input)).toBe(expected);
    expect(console.error).not.toHaveBeenCalled();
  });

  test.each([
    [''],
    ['booted ()', 'unknown'],
    ['EB449DF0-39DC-457A-B2D7-25CE51BB1A2E {}', 'unknown'],
    ['EB449DF0-39DC-457A-B2D7-25CE51BB1A2E {something: 42}}'],
  ])('should identify %j as unknown and log an error', (input) => {
    expect(extractDeviceName(input)).toBe('unknown');
    expect(console.error).toHaveBeenCalledWith(expect.any(String), input);
  });
});
