import { Property, Inquiry } from '../types';
import {
  getJsonFromS3,
  uploadJsonToS3,
} from '../utils/s3Helper';

/**
 * Storage Service - Always uses S3 with Dual Folder Structure
 * 
 * Folder Logic:
 * - VITE_IS_PRODUCTION=false -> Uses VITE_S3_FOLDER_DUMMY
 * - VITE_IS_PRODUCTION=true -> Uses VITE_S3_FOLDER_PROD
 * 
 * All data is persisted directly to AWS S3
 */

// The S3 helper applies this selected folder to every object path.
const getS3FolderPath = (): string => {
  const isProd = import.meta.env.VITE_IS_PRODUCTION === 'true';
  return isProd
    ? import.meta.env.VITE_S3_FOLDER_PROD || 'properties'
    : import.meta.env.VITE_S3_FOLDER_DUMMY || 'dummy-properties';
};

// Get all properties from correct S3 folder
export const getAllProperties = async (): Promise<Property[]> => {
  try {
    const filePath = 'properties.json';
    
    console.log(`📂 Loading properties from: ${filePath}`);
    
    const properties = await getJsonFromS3<Property[]>(filePath);
    return properties || [];
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
    const filteredProperties = properties.filter((p) => p.id !== id);

    await uploadJsonToS3(filteredProperties, 'properties.json');
  } catch (error) {
    console.error('Error deleting property:', error);
    throw new Error('Failed to delete property');
  }
};

// Save property (alias for createProperty)
export const saveProperty = async (
  property: Omit<Property, 'id' | 'createdAt'>
): Promise<Property> => {
  return createProperty(property);
};

// Get all inquiries/leads
export const getAllInquiries = async (): Promise<Inquiry[]> => {
  try {
    const inquiries = await getJsonFromS3<Inquiry[]>('leads.json');
    return inquiries || [];
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }
};

// Create new inquiry
export const createInquiry = async (
  inquiry: Omit<Inquiry, 'id' | 'createdAt'>
): Promise<Inquiry> => {
  try {
    const inquiries = await getAllInquiries();

    const newInquiry: Inquiry = {
      ...inquiry,
      id: `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedInquiries = [...inquiries, newInquiry];
    
    await uploadJsonToS3(updatedInquiries, 'leads.json');

    return newInquiry;
  } catch (error) {
    console.error('Error creating inquiry:', error);
    throw new Error('Failed to create inquiry');
  }
};

// Update inquiry
export const updateInquiry = async (
  id: string,
  updates: Partial<Inquiry>
): Promise<Inquiry> => {
  try {
    const inquiries = await getAllInquiries();
    const index = inquiries.findIndex((i) => i.id === id);

    if (index === -1) {
      throw new Error('Inquiry not found');
    }

    const updatedInquiry: Inquiry = {
      ...inquiries[index],
      ...updates,
    };

    inquiries[index] = updatedInquiry;
    
    await uploadJsonToS3(inquiries, 'leads.json');

    return updatedInquiry;
  } catch (error) {
    console.error('Error updating inquiry:', error);
    throw new Error('Failed to update inquiry');
  }
};

// Delete inquiry
export const deleteInquiry = async (id: string): Promise<void> => {
  try {
    const inquiries = await getAllInquiries();
    const filteredInquiries = inquiries.filter((i) => i.id !== id);

    await uploadJsonToS3(filteredInquiries, 'leads.json');
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    throw new Error('Failed to delete inquiry');
  }
};

export default {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  saveProperty,
  getAllInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getS3FolderPath,
};
