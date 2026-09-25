import { UserProfile, UserSection } from './types';

export interface SectionMetadata {
  code: UserSection;
  name: string;
  shortName: string;
  badge: string;
  badgeColor: string;
  defaultPath: string;
  allowedPrefixes: string[];
  description: string;
}

export const SECTIONS_META: Record<UserSection, SectionMetadata> = {
  ALL: {
    code: 'ALL',
    name: 'Municipal Administration (All Sections)',
    shortName: 'Global Administrator',
    badge: '👑 ALL',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultPath: '/',
    allowedPrefixes: ['/'],
    description: 'Full municipal administrative privileges across all six enterprise sections and user management.',
  },
  A: {
    code: 'A',
    name: 'Section A: Market Management',
    shortName: 'Market Management',
    badge: '🏬 Section A',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultPath: '/market/map',
    allowedPrefixes: ['/market'],
    description: 'Market stalls, stallholder leasing, compliance monitoring, and electric utility ledgers.',
  },
  B: {
    code: 'B',
    name: 'Section B: Slaughterhouse Management',
    shortName: 'Slaughterhouse',
    badge: '🥩 Section B',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    defaultPath: '/slaughterhouse',
    allowedPrefixes: ['/slaughterhouse'],
    description: 'Livestock transaction tracking, meat inspection, ante-mortem/post-mortem logs, and corral sanitation.',
  },
  C: {
    code: 'C',
    name: 'Section C: Cemetery Management',
    shortName: 'Cemetery Management',
    badge: '⚰️ Section C',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultPath: '/cemetery/bookings',
    allowedPrefixes: ['/cemetery'],
    description: 'Public memorial cemetery plot mapping, burial bookings, and niche certification records.',
  },
  D: {
    code: 'D',
    name: 'Section D: Transport Terminal',
    shortName: 'Transport Terminal',
    badge: '🚐 Section D',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultPath: '/transport/todas',
    allowedPrefixes: ['/transport'],
    description: 'TODA associations, tricycle operator profiling, franchise verification, and terminal dispatch.',
  },
  E: {
    code: 'E',
    name: 'Section E: Administrative Services',
    shortName: 'Admin Services',
    badge: '🏢 Section E',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultPath: '/opif?section=E',
    allowedPrefixes: ['/opif'],
    description: 'Administrative support services, procurement, records management, and enterprise performance indicators.',
  },
  F: {
    code: 'F',
    name: 'Section F: Peace & Order (Market Guard)',
    shortName: 'Market Guard',
    badge: '🛡️ Section F',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultPath: '/csu',
    allowedPrefixes: ['/csu'],
    description: 'Daily security shift blotters, guard personnel deployment, incident logs, and tri-level verification sign-offs.',
  },
};

export interface AccessCheckResult {
  allowed: boolean;
  requiredSection?: UserSection;
  requiredRole?: 'Admin';
  reason?: string;
}

/**
 * Validates whether the logged in user can access a specific route in MEEDOSys.
 */
export function checkRouteAccess(user: UserProfile | null, pathname: string): AccessCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required. Please sign in to access MEEDOSys enterprise modules.',
    };
  }

  // Administrators have unrestricted access
  if (user.role === 'Admin' || user.section === 'ALL') {
    return { allowed: true };
  }

  // Dashboard root '/' is accessible to all authenticated staff
  if (pathname === '/' || pathname === '') {
    return { allowed: true };
  }

  // Central OPIF Master (including Section E: Admin Services) is exclusively under the Admin side
  if (pathname === '/opif' || pathname.startsWith('/opif')) {
    return {
      allowed: false,
      requiredRole: 'Admin',
      reason: 'Central OPIF (including Section E: Admin Services) is managed under the Administration module. Please access your department-specific OPIF Scorecard under your assigned section.',
    };
  }

  // Municipal Inventory & Supplies is exclusively under the Admin side
  if (pathname === '/inventory' || pathname.startsWith('/inventory')) {
    return {
      allowed: false,
      requiredRole: 'Admin',
      reason: 'Municipal Inventory & Supplies management is restricted to Municipal Administrators only. Departmental staff cannot access or modify municipal supply balances.',
    };
  }

  // Admin routes explicitly require Admin role
  if (pathname.startsWith('/admin')) {
    return {
      allowed: false,
      requiredRole: 'Admin',
      reason: 'System Administrator privilege required. Departmental User Management is restricted to Administrators.',
    };
  }

  // Map path to required Section
  let requiredSection: UserSection | null = null;
  if (pathname.startsWith('/market')) requiredSection = 'A';
  else if (pathname.startsWith('/slaughterhouse')) requiredSection = 'B';
  else if (pathname.startsWith('/cemetery')) requiredSection = 'C';
  else if (pathname.startsWith('/transport')) requiredSection = 'D';
  else if (pathname.startsWith('/csu')) requiredSection = 'F';

  // If path doesn't map to a specific restricted section, allow it
  if (!requiredSection) {
    return { allowed: true };
  }

  // Staff user matching their assigned section
  if (user.section === requiredSection) {
    return { allowed: true };
  }

  const currentSecName = SECTIONS_META[user.section]?.shortName || `Section ${user.section}`;
  const reqSecName = SECTIONS_META[requiredSection]?.name || `Section ${requiredSection}`;

  return {
    allowed: false,
    requiredSection,
    reason: `Departmental Silo Policy: Your account is assigned to ${currentSecName}. Access to ${reqSecName} is restricted to authorized section personnel.`,
  };
}
