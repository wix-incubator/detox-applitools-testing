const DEVICE_NAME_REGEXP_1 = new RegExp(/\((.*?)\)/);
const DEVICE_NAME_REGEXP_2 = /^[0-9A-Fa-f-]{36}\s*(\{.*\})$/;

export default function extractDeviceName(fullDeviceName: string): string {
  const result = extract1(fullDeviceName) || extract2(fullDeviceName);
  if (result) {
    return result;
  }

  console.error('Could not parse device name', fullDeviceName);
  return 'unknown';
}

function extract1(fullDeviceName: string): string | undefined {
  const match = fullDeviceName.match(DEVICE_NAME_REGEXP_1);
  return match && match[1];
}

function extract2(fullDeviceName: string): string | undefined {
  const match = fullDeviceName.match(DEVICE_NAME_REGEXP_2);

  try {
    return JSON.parse(match[1]).type;
  } catch (_e) { } // eslint-disable-line
}
