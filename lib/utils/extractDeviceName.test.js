const extractDeviceName = require('./extractDeviceName');

const TEST_UUID = 'EB449DF0-39DC-457A-B2D7-25CE51BB1A2E';

describe('extractDeviceName', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error');
  });

  test.each([
    [`${TEST_UUID} (iPhone X)`, 'iPhone X'],
    [`${TEST_UUID} {"type": "iPhone 11"}`, 'iPhone 11'],
  ])('should parse %j to: %s', (input, expected) => {
    expect(extractDeviceName(input)).toBe(expected);
    expect(console.error).not.toHaveBeenCalled();
  });

  test.each([
    [''],
    ['booted ()'],
    [`${TEST_UUID} {}`],
    [`${TEST_UUID} {some: 42}}`],
  ])('should identify %j as unknown and log an error', (input) => {
    expect(extractDeviceName(input)).toBe('unknown');
    expect(console.error).toHaveBeenCalledWith(expect.any(String), input);
  });
});
