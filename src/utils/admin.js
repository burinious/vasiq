const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email) {
  return Boolean(email) && adminEmails.includes(email.trim().toLowerCase());
}

export function isSeededDemoEmail(email) {
  if (!email) return false;

  return /^(demo|campus|vuser)\d{2}@vasiq\.app$/i.test(email.trim());
}

export function getRoleFromProfile(profile) {
  return profile?.role || 'member';
}

export function isAdminUser({ email, profile }) {
  return isAdminEmail(email) || getRoleFromProfile(profile) === 'admin';
}

export function isModeratorUser({ email, profile }) {
  return isAdminUser({ email, profile }) || getRoleFromProfile(profile) === 'moderator';
}
