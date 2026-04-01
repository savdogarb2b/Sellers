import prisma from './prisma';

/**
 * Transliterate Cyrillic/Uzbek text to Latin
 */
function transliterate(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
  };

  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Generate a unique login from a name
 * E.g. "Demo Kompaniya" -> "demokompaniya", if taken -> "demokompaniya1", etc.
 */
export async function generateUniqueLogin(fullName) {
  const base = transliterate(fullName);
  if (!base) return 'user' + Date.now().toString(36);

  let login = base;
  let counter = 0;

  while (true) {
    const candidate = counter === 0 ? login : `${login}${counter}`;
    const email = `${candidate}@salescrm.uz`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) return email;
    counter++;
  }
}

/**
 * Generate a unique employee login from name within an org context  
 * E.g. "Ali Valiyev" -> "avaliyev@orgname.salescrm.uz" or "ali.valiyev"
 */
export async function generateEmployeeLogin(fullName, orgName) {
  const nameParts = fullName.trim().split(/\s+/);
  const orgSlug = transliterate(orgName || 'org');

  let bases = [];

  if (nameParts.length >= 2) {
    const firstName = transliterate(nameParts[0]);
    const lastName = transliterate(nameParts[nameParts.length - 1]);
    bases.push(`${firstName[0]}${lastName}`); // avaliyev
    bases.push(`${firstName}.${lastName}`);    // ali.valiyev
    bases.push(`${firstName}${lastName}`);     // alivaliyev
  } else {
    bases.push(transliterate(nameParts[0]));
  }

  for (const base of bases) {
    if (!base) continue;
    let counter = 0;
    while (counter < 100) {
      const candidate = counter === 0 ? base : `${base}${counter}`;
      const email = `${candidate}@${orgSlug}.uz`;
      const exists = await prisma.user.findUnique({ where: { email } });
      if (!exists) return email;
      counter++;
    }
  }

  // Fallback
  return `${transliterate(fullName)}${Date.now().toString(36).slice(-4)}@${orgSlug}.uz`;
}

/**
 * Generate a secure but memorable password
 * Format: Name2chars + random4digits + specialchar
 */
export function generatePassword(name) {
  const clean = transliterate(name);
  const prefix = clean.slice(0, 3).charAt(0).toUpperCase() + clean.slice(1, 3);
  const digits = Math.floor(1000 + Math.random() * 9000);
  const specials = ['!', '@', '#', '$'];
  const special = specials[Math.floor(Math.random() * specials.length)];
  return `${prefix}${digits}${special}`;
}
