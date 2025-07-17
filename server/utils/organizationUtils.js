const { prisma } = require('../config/db');

/**
 * Convert organization name to URL-friendly slug
 * @param {string} name - Organization name
 * @returns {string} URL-friendly slug
 */
const nameToSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

/**
 * Convert slug back to organization name format
 * @param {string} slug - URL slug
 * @returns {string} Formatted name
 */
const slugToName = (slug) => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Find organization by name or slug
 * @param {string} nameOrSlug - Organization name or slug
 * @returns {Object|null} Organization object or null
 */
const findOrganizationByNameOrSlug = async (nameOrSlug) => {
  try {
    // If the identifier is a number, find by ID first
    if (!isNaN(nameOrSlug)) {
      const organizationById = await prisma.organization.findUnique({
        where: { id: parseInt(nameOrSlug, 10) },
      });
      if (organizationById) {
        return organizationById;
      }
    }

    // First try to find by exact name
    let organization = await prisma.organization.findFirst({
      where: {
        name: {
          equals: nameOrSlug,
          mode: 'insensitive'
        }
      }
    });

    // If not found, try to find by slug
    if (!organization) {
      const possibleName = slugToName(nameOrSlug);
      organization = await prisma.organization.findFirst({
        where: {
          name: {
            equals: possibleName,
            mode: 'insensitive'
          }
        }
      });
    }

    // If still not found, try fuzzy matching
    if (!organization) {
      const searchTerm = nameOrSlug.replace(/-/g, ' ');
      organization = await prisma.organization.findFirst({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      });
    }

    return organization;
  } catch (error) {
    console.error('Error finding organization:', error);
    return null;
  }
};

/**
 * Get organization slug for URLs
 * @param {string} name - Organization name
 * @returns {string} URL slug
 */
const getOrganizationSlug = (name) => {
  return nameToSlug(name);
};

/**
 * Middleware to resolve organization by name/slug
 * @param {string} paramName - The parameter name (default: 'orgName')
 * @returns {Function} Express middleware
 */
const resolveOrganization = (paramName = 'orgName') => {
  return async (req, res, next) => {
    try {
      const nameOrSlug = req.params[paramName];
      
      if (!nameOrSlug) {
        return res.status(400).json({
          success: false,
          message: 'Organization name is required'
        });
      }

      const organization = await findOrganizationByNameOrSlug(nameOrSlug);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      // Add organization to request
      req.organization = organization;
      req.organizationId = organization.id;
      
      next();
    } catch (error) {
      console.error('Error resolving organization:', error);
      return res.status(500).json({
        success: false,
        message: 'Error resolving organization'
      });
    }
  };
};

module.exports = {
  nameToSlug,
  slugToName,
  findOrganizationByNameOrSlug,
  getOrganizationSlug,
  resolveOrganization
};