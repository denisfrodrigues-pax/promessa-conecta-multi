// Phone mask formatter
export const formatPhoneBR = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Escape HTML entities to prevent XSS
const escapeHtml = (text: string): string => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

// Highlight search term in text (XSS-safe)
export const highlightText = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim() || !text) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>');
};

// Clean phone number
export const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Check if phone is valid
export const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

// Generate WhatsApp URL
export const getWhatsAppUrl = (phone: string | null, message?: string): string => {
  const cleaned = cleanPhone(phone);
  const msg = encodeURIComponent(message || 'Olá! Sou da Igreja da Promessa. Estou entrando em contato :)');
  return `https://wa.me/55${cleaned}?text=${msg}`;
};
