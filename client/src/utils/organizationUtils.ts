/**
 * Convert organization name to URL-friendly slug
 * @param name - Organization name
 * @returns URL-friendly slug
 */
export const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Convert slug back to organization name format
 * @param slug - URL slug
 * @returns Formatted name
 */
export const slugToName = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Get organization slug for URLs from the current user's organization
 * @returns Organization slug or null if not available
 */
export const getCurrentOrganizationSlug = (): string | null => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    
    const userData = JSON.parse(userString);
    const orgName = userData.organization?.name;
    
    if (!orgName) return null;
    
    return nameToSlug(orgName);
  } catch (error) {
    console.error('Error getting organization slug:', error);
    return null;
  }
};

/**
 * Get organization name from current user
 * @returns Organization name or null if not available
 */
export const getCurrentOrganizationName = (): string | null => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    
    const userData = JSON.parse(userString);
    return userData.organization?.name || null;
  } catch (error) {
    console.error('Error getting organization name:', error);
    return null;
  }
};

/**
 * Build organization API URL using organization name instead of ID
 * @param endpoint - The API endpoint (e.g., 'departments', 'users')
 * @param organizationName - Optional organization name, defaults to current user's organization
 * @returns Complete API URL with organization name
 */
export const buildOrganizationApiUrl = (endpoint: string, organizationName?: string): string => {
  const orgName = organizationName || getCurrentOrganizationName();
  
  if (!orgName) {
    throw new Error('Organization name not available');
  }
  
  const slug = nameToSlug(orgName);
  return `/api/organizations/${slug}/${endpoint}`;
};

/**
 * Get organization slug from organization ID (for backward compatibility)
 * This would typically involve a lookup, but for now we'll use the current user's org
 * @param organizationId - Organization ID (legacy parameter)
 * @returns Organization slug
 */
export const getOrganizationSlugFromId = (_organizationId: string): string => {
  // For now, we'll just return the current user's organization slug
  // In a full implementation, this would lookup the organization by ID
  const slug = getCurrentOrganizationSlug();
  if (!slug) {
    throw new Error('Cannot determine organization slug');
  }
  return slug;
};