import { Property, Inquiry } from '../types';
import {
  uploadToS3,
  getJsonFromS3,
  uploadJsonToS3,
  deleteFromS3,
} from '../utils/s3Helper';

/**
 * Storage Service - Always uses S3
 * All data is persisted directly to AWS S3
 * Selects the production or dummy folder from VITE_IS_PRODUCTION.
 */

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'untitled-property';
};

const sanitizeFileName = (value: string): string =>
  value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'image';

// Get all properties
export const getAllProperties = async (): Promise<Property[]> => {
  try {
    return await getJsonFromS3<Property[]>('properties.json');
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
};

// Get property by ID
export const getPropertyById = async (
  id: string
): Promise<Property | null> => {
  try {
    const properties = await getAllProperties();
    return properties.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
};

// Create new property
export const createProperty = async (
  property: Omit<Property, 'id' | 'createdAt'>
): Promise<Property> => {
  try {
    const properties = await getAllProperties();

    const newProperty: Property = {
      ...property,
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedProperties = [...properties, newProperty];
    await uploadJsonToS3(updatedProperties, 'properties.json');

    return newProperty;
  } catch (error) {
    console.error('Error creating property:', error);
    throw new Error('Failed to create property');
  }
};

// Update property
export const updateProperty = async (
  id: string,
  updates: Partial<Property>
): Promise<Property> => {
  try {
    const properties = await getAllProperties();
    const index = properties.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Property not found');
    }

    const updatedProperty: Property = {
      ...properties[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    properties[index] = updatedProperty;
    await uploadJsonToS3(properties, 'properties.json');

    return updatedProperty;
  } catch (error) {
    console.error('Error updating property:', error);
    throw new Error('Failed to update property');
  }
};

// Delete property
export const deleteProperty = async (id: string): Promise<void> => {
  try {
    const properties = await getAllProperties();
    const property = properties.find((p) => p.id === id);

    if (!property) {
      throw new Error('Property not found');
    }

    // Delete associated images
    for (const imagePath of property.images) {
      await deleteImage(imagePath);
    }

    // Delete brochure if exists
    if (property.brochure) {
      await deleteImage(property.brochure);
    }

    const filteredProperties = properties.filter((p) => p.id !== id);
    await uploadJsonToS3(filteredProperties, 'properties.json');
  } catch (error) {
    console.error('Error deleting property:', error);
    throw new Error('Failed to delete property');
  }
};

// Upload image
export const uploadImage = async (
  file: File,
  propertyName: string = 'untitled-property'
): Promise<string> => {
  try {
    const fileName = `assets/${slugify(propertyName)}/${Date.now()}_${sanitizeFileName(file.name)}`;
    return await uploadToS3(file, fileName);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Delete image
export const deleteImage = async (path: string): Promise<void> => {
  try {
    await deleteFromS3(path);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// Get all leads
export const getAllLeads = async (): Promise<Inquiry[]> => {
  try {
    return await getJsonFromS3<Inquiry[]>('leads.json');
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
};

// Create lead
export const createLead = async (
  data: Omit<Inquiry, 'id' | 'createdAt' | 'status'>
): Promise<Inquiry> => {
  try {
    const leads = await getAllLeads();

    const newLead: Inquiry = {
      ...data,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedLeads = [...leads, newLead];
    await uploadJsonToS3(updatedLeads, 'leads.json');

    return newLead;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw new Error('Failed to create lead');
  }
};

// Update lead status
export const updateLeadStatus = async (
  id: string,
  status: 'pending' | 'contacted' | 'closed'
): Promise<Inquiry> => {
  try {
    const leads = await getAllLeads();
    const index = leads.findIndex((l) => l.id === id);

    if (index === -1) {
      throw new Error('Lead not found');
    }

    const updatedLead: Inquiry = {
      ...leads[index],
      status,
    };

    leads[index] = updatedLead;
    await uploadJsonToS3(leads, 'leads.json');

    return updatedLead;
  } catch (error) {
    console.error('Error updating lead:', error);
    throw new Error('Failed to update lead');
  }
};
