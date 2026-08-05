import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import {
  createProperty,
  updateProperty,
  uploadImage,
} from '../services/storageService';
import { motion } from 'motion/react';
import { Upload, X, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface AdminPageProps {
  onNavigate: (page: string) => void;
  editingProperty?: Property | null;
}

const amenitiesOptions = [
  'Swimming Pool',
  'Gym',
  'Covered Parking',
  'Garden',
  '24/7 Security',
  'Elevator',
  'Power Backup',
  'Club House',
  'Children Play Area',
  'Jogging Track',
  'CCTV',
  'Gated Community',
  'Vastu Compliant',
  'Fire Safety',
];

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigate,
  editingProperty,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    description: '',
    category: 'apartment' as Property['category'],
    status: 'buy' as Property['status'],
    bedrooms: 0,
    bathrooms: 1,
    areaSqft: '',
    featured: false,
    verified: false,
    yearBuilt: '',
    parking: 0,
    floors: '',
    furnished: false,
    videoUrl: '',
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    onDrop: async (files) => {
      setUploadingImages(true);
      try {
        const urls: string[] = [];
        for (const file of files) {
          const url = await uploadImage(file, formData.title);
          urls.push(url);
        }
        setUploadedImages([...uploadedImages, ...urls]);
        toast.success(`${urls.length} image(s) uploaded`);
      } catch (error) {
        toast.error('Failed to upload images');
      } finally {
        setUploadingImages(false);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || uploadedImages.length === 0) {
      toast.error('Please fill all required fields and upload at least one image');
      return;
    }

    setLoading(true);
    try {
      const propertyData: Omit<Property, 'id' | 'createdAt'> = {
        ...formData,
        price: parseInt(formData.price),
        areaSqft: parseInt(formData.areaSqft),
        images: uploadedImages,
        videos: [],
        amenities: selectedAmenities,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
        parking: formData.parking,
        floors: formData.floors ? parseInt(formData.floors) : undefined,
      };

      if (editingProperty) {
        await updateProperty(editingProperty.id, propertyData);
        toast.success('Property updated successfully');
      } else {
        await createProperty(propertyData);
        toast.success('Property created successfully');
      }

      onNavigate('manage-properties');
    } catch (error) {
      toast.error('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`h-12 w-12 rounded-full font-bold transition-all ${
              step === s
                ? 'bg-blue-600 text-white'
                : step > s
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step > s ? <Check size={24} /> : s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">List Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['buy', 'rent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, status: type });
                    setStep(2);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.status === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-lg mb-2 capitalize text-gray-900">
                    {type === 'buy' ? 'List for Sale' : 'List for Rent'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {type === 'buy'
                      ? 'Sell your property to buyers'
                      : 'Rent your property to tenants'}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Basic Info</h2>
            <input
              type="text"
              placeholder="Property Title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Property['category'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="land">Land</option>
            </select>
            <textarea
              placeholder="Location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <textarea
              placeholder="Description (min 100 chars)"
              required
              minLength={100}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 h-24"
            />
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {formData.status === 'buy' ? 'Pricing' : 'Rent Details'}
            </h2>
            <input
              type="number"
              placeholder={formData.status === 'buy' ? 'Sale Price' : 'Monthly Rent'}
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Back
              </button>
              <button type="button" onClick={() => setStep(4)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Bedrooms" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Bathrooms" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Area (sqft)" required value={formData.areaSqft} onChange={(e) => setFormData({ ...formData, areaSqft: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Parking" value={formData.parking} onChange={(e) => setFormData({ ...formData, parking: parseInt(e.target.value) })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Year Built" value={formData.yearBuilt} onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Floors" value={formData.floors} onChange={(e) => setFormData({ ...formData, floors: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.furnished} onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })} />
              <span>Furnished</span>
            </label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(3)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Back
              </button>
              <button type="button" onClick={() => setStep(5)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Amenities & Media */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Amenities</h2>
            <div className="grid grid-cols-2 gap-2">
              {amenitiesOptions.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images *
              </label>
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-600 transition-colors"
              >
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Drag images here or click to select</p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt={`Preview ${i}`} className="w-full h-24 object-cover rounded-lg" />
                      <button type="button" onClick={() => setUploadedImages(uploadedImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="url" placeholder="YouTube URL (optional)" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(4)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Back
              </button>
              <button type="button" onClick={() => setStep(6)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Review & Publish */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Flags & Publish</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.verified} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })} />
              <span>Verified</span>
            </label>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(5)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:bg-gray-400">
                {loading ? 'Publishing...' : 'Publish Property'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
