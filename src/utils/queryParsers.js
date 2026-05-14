export function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

export function parsePositiveInteger(value, fieldName, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

export function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return undefined;
}
