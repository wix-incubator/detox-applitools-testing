const DEVICE_NAME_REGEXP_1 = new RegExp(/\((.*?)\)/);
const DEVICE_NAME_REGEXP_2 = /^[0-9A-Fa-f-]{36}\s*(\{.*\})$/;

/**
 * @param {String} fullDeviceName
 */
function extractDeviceName(fullDeviceName) {
  const result = extract1(fullDeviceName) || extract2(fullDeviceName);
  if (result) {
    return result;
  }

  console.error('Could not parse device name', fullDeviceName);
  return 'unknown';
}

/**
 * @param {String} fullDeviceName
 */
function extract1(fullDeviceName) {
  const match = fullDeviceName.match(DEVICE_NAME_REGEXP_1);
  return match && match[1];
}

/**
 * @param {String} fullDeviceName
 */
function extract2(fullDeviceName) {
  const match = fullDeviceName.match(DEVICE_NAME_REGEXP_2);
  const rawJson = match && match[1];

  try {
    return JSON.parse(rawJson).type;
  } catch {
    return undefined;
  }
}

module.exports = extractDeviceName;
