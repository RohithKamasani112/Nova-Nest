import { BillingDoc, BillingDocType, Bill, Inquiry, Property } from '../types';
import {
  uploadToS3,
  getJsonFromS3,
  uploadJsonToS3,
  uploadTextToS3,
  deleteFromS3,
} from '../utils/s3Helper';
import { buildSitemapXml } from '../utils/sitemap';

/**
 * Regenerate sitemap.xml from the current property set and push it to S3.
 * Called after every create/update/delete so the sitemap auto-updates as soon
 * as the client changes listings — no rebuild/redeploy required. Best-effort:
 * any failure here is logged and swallowed so it never blocks a property save.
 */
const regenerateSitemap = async (properties: Property[]): Promise<void> => {
  try {
    const xml = buildSitemapXml(properties);
    await uploadTextToS3(xml, 'sitemap.xml', 'application/xml');
  } catch (error) {
    console.warn('Sitemap regeneration skipped:', error);
  }
};

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
      isActive: property.isActive ?? true,
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedProperties = [...properties, newProperty];
    await uploadJsonToS3(updatedProperties, 'properties.json');
    void regenerateSitemap(updatedProperties);

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
    void regenerateSitemap(properties);

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

    const filteredProperties = properties.filter((p) => p.id !== id);
    await uploadJsonToS3(filteredProperties, 'properties.json');
    void regenerateSitemap(filteredProperties);

    for (const imagePath of property.images || []) {
      await deleteImage(imagePath);
    }

    if (property.brochure) {
      await deleteImage(property.brochure);
    }
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

// LEGACY bills (the old single generic "payment receipt" flow). Read-only —
// nothing writes to invoices/bills.json anymore, but existing records stay
// listed/downloadable in the admin's Past Documents history.
export const getAllBills = async (): Promise<Bill[]> => {
  try {
    return await getJsonFromS3<Bill[]>('invoices/bills.json');
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
};

// Billing documents (Sale Booking Confirmation, Commission GST Invoice,
// Service Invoice) — the 4-template generator's storage, independent of the
// legacy bills.json above. Everything lives under invoices/ — the metadata
// list plus one PDF per document.

const DOC_NUMBER_PREFIX: Record<BillingDocType, string> = {
  sale_booking: 'SALE',
  commission: 'COMM',
  service: 'SERV',
};

export const getAllBillingDocs = async (): Promise<BillingDoc[]> => {
  try {
    return await getJsonFromS3<BillingDoc[]>('invoices/documents.json');
  } catch (error) {
    console.error('Error fetching billing documents:', error);
    return [];
  }
};

// Sequential per-type, per-year document numbers (e.g. "NN-SALE-2026-014"),
// derived by scanning the existing document list rather than a separate
// counter file/table — same scan-and-increment trade-off the rest of this
// storage layer already accepts (single-admin tool, no concurrent-write
// locking). Scoping the sequence per docType (unlike the old shared-per-year
// receipt counter) is what actually fixes the old duplicate-number bug: two
// different document types generated back-to-back can no longer collide.
export const getNextDocNumber = async (docType: BillingDocType): Promise<string> => {
  const docs = await getAllBillingDocs();
  const year = new Date().getFullYear();
  const prefix = `NN-${DOC_NUMBER_PREFIX[docType]}-${year}-`;
  const usedNumbers = docs
    .map((doc) => doc.docNumber)
    .filter((docNumber) => docNumber.startsWith(prefix))
    .map((docNumber) => parseInt(docNumber.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

// Uploads the generated PDF Blob to invoices/{docNumber}.pdf and returns its URL.
export const uploadBillingDocPdf = async (pdfBlob: Blob, docNumber: string): Promise<string> =>
  uploadToS3(pdfBlob, `invoices/${docNumber}.pdf`);

// Saves the document record once its PDF is already uploaded (pdfUrl included in `doc`).
export const createBillingDoc = async (doc: Omit<BillingDoc, 'id' | 'createdAt'>): Promise<BillingDoc> => {
  try {
    const docs = await getAllBillingDocs();
    const newDoc = {
      ...doc,
      id: doc.docNumber,
      createdAt: new Date().toISOString(),
    } as BillingDoc;
    await uploadJsonToS3([...docs, newDoc], 'invoices/documents.json');
    return newDoc;
  } catch (error) {
    console.error('Error creating billing document:', error);
    throw new Error('Failed to create billing document');
  }
};
