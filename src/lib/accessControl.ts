const ADMIN_EMAILS = ['nuoai01@gmail.com'];

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

export function isTesterEmail(email?: string | null) {
  return isAdminEmail(email);
}
