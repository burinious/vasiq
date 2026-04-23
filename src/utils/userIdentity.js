function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getFallbackNameFromEmail(email, fallback = 'Student') {
  if (!email || typeof email !== 'string') {
    return fallback;
  }

  const localPart = email.split('@')[0]?.trim();
  if (!localPart) {
    return fallback;
  }

  const normalizedName = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizedName ? titleCase(normalizedName) : fallback;
}

export function getUserDisplayName(user, fallback = 'Student') {
  const values = [user?.displayName, user?.fullName, user?.name];
  const resolvedValue = values.find((value) => typeof value === 'string' && value.trim());

  if (resolvedValue) {
    return resolvedValue.trim();
  }

  return getFallbackNameFromEmail(user?.email, fallback);
}

export function getUserFirstName(user, fallback = 'Student') {
  return getUserDisplayName(user, fallback).split(' ')[0] || fallback;
}

export function getUserInitials(user, fallback = 'ST') {
  const displayName = getUserDisplayName(user, fallback);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || fallback;
}
