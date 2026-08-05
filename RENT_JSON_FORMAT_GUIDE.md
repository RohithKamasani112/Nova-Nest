# 🏠 RENT PROPERTY JSON FORMAT GUIDE

## Complete JSON Structure for S3 Rent Postings

### Using This Guide
Copy this structure, fill in your values, and upload to S3:
- **S3 Location**: `dummy-properties/properties.json` (for testing)
- **S3 Location**: `properties/properties.json` (for production)

---

## 📋 COMPLETE RENT JSON EXAMPLE

```json
{
  "id": "prop_rent_001",
  "title": "Beautiful 2 BHK Apartment in Andheri",
  "price": 60000,
  "pricePerSqft": 120,
  "location": "Andheri East, Mumbai, Maharashtra",
  "latitude": 19.1136,
  "longitude": 72.8697,
  "description": "Spacious 2 BHK apartment with good natural light, modern finishes, and excellent ventilation. Close to Metro station, shopping complexes, and schools. Ideal for families and working professionals.",
  
  "images": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"
  ],
  "videos": [],
  "videoUrl": "https://www.youtube.com/embed/abc1234567",
  "brochure": "https://example.com/brochure-rent.pdf",
  
  "category": "apartment",
  "status": "rent",
  
  "basicDetails": {
    "bedrooms": 2,
    "bathrooms": 2,
    "balconies": 1,
    "kitchens": 1,
    "areaSqft": 1200,
    "carpetArea": 1050,
    "superBuiltUp": 1350
  },
  
  "propertyFeatures": {
    "yearBuilt": 2018,
    "parking": 1,
    "parkingType": "open",
    "floors": 15,
    "floorNumber": 8,
    "furnished": "semi-furnished",
    "facingDirection": "east",
    "waterSupply": "24/7",
    "powerBackup": true,
    "powerBackupType": "Partial",
    "security": "24/7 Security",
    "gatedCommunity": true,
    "ageOfBuilding": "5-10 years",
    "constructionStatus": "Completed",
    "possession": "Immediate"
  },
  
  "amenities": [
    "Swimming Pool",
    "Gym",
    "Parking",
    "Security",
    "Lift",
    "Balcony",
    "Power Backup",
    "Water Storage",
    "Clubhouse",
    "Play Area"
  ],
  
  "rentalDetails": {
    "rentAmount": 60000,
    "securityDeposit": 180000,
    "depositMonths": 3,
    "maintenanceCharges": 3000,
    "brokerage": "1 month rent",
    "brokeragePayableBy": "Tenant",
    "leaseTerm": "12 months",
    "priceNegotiable": true
  },
  
  "ownerDetails": {
    "ownerId": "owner_002",
    "ownerName": "Priya Sharma",
    "ownerPhone": "9876543211",
    "ownerEmail": "priya@example.com",
    "ownerWhatsApp": "919876543211"
  },
  
  "brokerDetails": {
    "brokerId": "broker_002",
    "brokerName": "Happy Rentals",
    "brokerPhone": "9988776656",
    "brokerEmail": "broker@happyrentals.com",
    "brokerWhatsApp": "919988776656",
    "brokerLicense": "RERA/MH/2024/001235"
  },
  
  "tenantPreferences": {
    "vegetarian": false,
    "nonVegetarian": true,
    "bachelor": false,
    "bachelorette": false,
    "family": true,
    "studentsAllowed": false,
    "petsAllowed": false,
    "parentageAllowed": true
  },
  
  "nearbyLocations": {
    "nearestMetroStation": "Andheri Station - 0.7 km",
    "nearestAirport": "Mumbai Airport - 15 km",
    "nearestSchool": "DPS School - 1 km",
    "nearestMall": "Infiniti Mall - 0.5 km",
    "nearestHospital": "Apollo Hospital - 1.5 km",
    "nearestMarket": "Andheri Market - 0.2 km"
  },
  
  "pricing": {
    "monthlyRent": 60000,
    "securityDeposit": 180000,
    "maintenanceCharges": 3000,
    "brokerageAmount": 60000,
    "processCharges": 2000
  },
  
  "legalDetails": {
    "propertyTitle": "Lease Hold",
    "governmentRestriction": "No",
    "mutualAgreement": "Yes",
    "documentationStatus": "Clear",
    "registrationStatus": "Registered with Society"
  },
  
  "additionalInfo": {
    "furnishingType": "Semi-Furnished",
    "furnishingIncludes": ["Fridge", "Stove", "Bed", "Sofa"],
    "utilities": "Owner covers water and maintenance",
    "roadWidth": "30 ft",
    "distanceFromRoad": "50 m"
  },
  
  "featured": false,
  "verified": true,
  "createdAt": "2024-02-01T09:15:00Z",
  "updatedAt": "2024-02-18T16:20:00Z",
  "isDummy": true
}
```

---

## 📊 FIELD DESCRIPTIONS

### Top-Level Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| id | string | ✅ | "prop_rent_001" | Unique property ID |
| title | string | ✅ | "Beautiful 2 BHK..." | Display title |
| price | number | ✅ | 60000 | Monthly rent amount |
| pricePerSqft | number | ✅ | 120 | Price per square foot |
| location | string | ✅ | "Andheri East..." | Full address |
| latitude | number | ✅ | 19.1136 | GPS latitude |
| longitude | number | ✅ | 72.8697 | GPS longitude |
| description | string | ✅ | "Spacious 2 BHK..." | Property description |
| status | string | ✅ | "rent" | Must be "rent" |
| category | string | ✅ | "apartment" | Property type |

### Media Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| images | array | ✅ | [url1, url2] | Array of image URLs |
| videos | array | ❌ | [] | Array of video URLs |
| videoUrl | string | ❌ | "youtube url" | Main video URL |
| brochure | string | ❌ | "pdf url" | PDF brochure URL |

### Basic Details

```json
"basicDetails": {
  "bedrooms": 2,           // Number of bedrooms
  "bathrooms": 2,          // Number of bathrooms
  "balconies": 1,          // Number of balconies
  "kitchens": 1,           // Number of kitchens
  "areaSqft": 1200,        // Total area in sqft
  "carpetArea": 1050,      // Carpet area in sqft
  "superBuiltUp": 1350     // Built-up area in sqft
}
```

### Property Features

```json
"propertyFeatures": {
  "yearBuilt": 2018,                    // Construction year
  "parking": 1,                         // Number of parking
  "parkingType": "open",                // open/covered
  "floors": 15,                         // Total floors
  "floorNumber": 8,                     // Which floor
  "furnished": "semi-furnished",        // unfurnished/semi/full
  "facingDirection": "east",            // N/S/E/W
  "waterSupply": "24/7",                // Water supply info
  "powerBackup": true,                  // Has generator
  "powerBackupType": "Partial",         // Full/Partial
  "security": "24/7 Security",          // Security details
  "gatedCommunity": true,               // Gated community?
  "ageOfBuilding": "5-10 years",        // Building age
  "constructionStatus": "Completed",    // Construction status
  "possession": "Immediate"             // Possession type
}
```

### Amenities

```json
"amenities": [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Lift",
  "Balcony",
  "Power Backup",
  "Water Storage",
  "Clubhouse",
  "Play Area"
]
```

### Rental-Specific Details (IMPORTANT FOR RENT)

```json
"rentalDetails": {
  "rentAmount": 60000,              // Monthly rent
  "securityDeposit": 180000,        // Total deposit
  "depositMonths": 3,               // Months of deposit
  "maintenanceCharges": 3000,       // Monthly maintenance
  "brokerage": "1 month rent",      // Brokerage amount
  "brokeragePayableBy": "Tenant",   // Who pays: Tenant/Owner/Both
  "leaseTerm": "12 months",         // Lease duration
  "priceNegotiable": true           // Is price negotiable?
}
```

### Owner Details

```json
"ownerDetails": {
  "ownerId": "owner_002",
  "ownerName": "Priya Sharma",
  "ownerPhone": "9876543211",
  "ownerEmail": "priya@example.com",
  "ownerWhatsApp": "919876543211"
}
```

### Broker Details

```json
"brokerDetails": {
  "brokerId": "broker_002",
  "brokerName": "Happy Rentals",
  "brokerPhone": "9988776656",
  "brokerEmail": "broker@happyrentals.com",
  "brokerWhatsApp": "919988776656",
  "brokerLicense": "RERA/MH/2024/001235"
}
```

### Tenant Preferences (UNIQUE TO RENT)

```json
"tenantPreferences": {
  "vegetarian": false,          // Vegetarian only?
  "nonVegetarian": true,        // Non-veg allowed?
  "bachelor": false,            // Single male OK?
  "bachelorette": false,        // Single female OK?
  "family": true,               // Families OK?
  "studentsAllowed": false,     // Students OK?
  "petsAllowed": false,         // Pets allowed?
  "parentageAllowed": true      // Parents allowed?
}
```

### Nearby Locations

```json
"nearbyLocations": {
  "nearestMetroStation": "Andheri Station - 0.7 km",
  "nearestAirport": "Mumbai Airport - 15 km",
  "nearestSchool": "DPS School - 1 km",
  "nearestMall": "Infiniti Mall - 0.5 km",
  "nearestHospital": "Apollo Hospital - 1.5 km",
  "nearestMarket": "Andheri Market - 0.2 km"
}
```

### Pricing (Total Cost Breakdown)

```json
"pricing": {
  "monthlyRent": 60000,         // Monthly rent
  "securityDeposit": 180000,    // Total deposit
  "maintenanceCharges": 3000,   // Monthly maintenance
  "brokerageAmount": 60000,     // Brokerage fee
  "processCharges": 2000        // Other charges
}
```

### Legal Details

```json
"legalDetails": {
  "propertyTitle": "Lease Hold",           // Free Hold/Lease Hold
  "governmentRestriction": "No",           // Any restrictions?
  "mutualAgreement": "Yes",                // Has agreement?
  "documentationStatus": "Clear",          // Documentation status
  "registrationStatus": "Registered with Society"
}
```

### Additional Info

```json
"additionalInfo": {
  "furnishingType": "Semi-Furnished",
  "furnishingIncludes": ["Fridge", "Stove", "Bed", "Sofa"],
  "utilities": "Owner covers water and maintenance",
  "roadWidth": "30 ft",
  "distanceFromRoad": "50 m"
}
```

### Meta Fields

```json
"featured": false,                          // Featured listing?
"verified": true,                           // Verified by admin?
"createdAt": "2024-02-01T09:15:00Z",       // Created timestamp
"updatedAt": "2024-02-18T16:20:00Z",       // Updated timestamp
"isDummy": true                             // Is test data?
```

---

## 🎯 QUICK COPY-PASTE TEMPLATE

```json
{
  "id": "prop_rent_YOUR_ID",
  "title": "YOUR PROPERTY TITLE",
  "price": 60000,
  "pricePerSqft": 120,
  "location": "YOUR LOCATION",
  "latitude": 19.1136,
  "longitude": 72.8697,
  "description": "YOUR PROPERTY DESCRIPTION",
  
  "images": ["IMAGE_URL_1", "IMAGE_URL_2"],
  "videos": [],
  "videoUrl": "",
  "brochure": "",
  
  "category": "apartment",
  "status": "rent",
  
  "basicDetails": {
    "bedrooms": 2,
    "bathrooms": 2,
    "balconies": 1,
    "kitchens": 1,
    "areaSqft": 1200,
    "carpetArea": 1050,
    "superBuiltUp": 1350
  },
  
  "propertyFeatures": {
    "yearBuilt": 2018,
    "parking": 1,
    "parkingType": "open",
    "floors": 15,
    "floorNumber": 8,
    "furnished": "semi-furnished",
    "facingDirection": "east",
    "waterSupply": "24/7",
    "powerBackup": true,
    "powerBackupType": "Partial",
    "security": "24/7 Security",
    "gatedCommunity": true,
    "ageOfBuilding": "5-10 years",
    "constructionStatus": "Completed",
    "possession": "Immediate"
  },
  
  "amenities": ["Swimming Pool", "Gym", "Parking", "Security"],
  
  "rentalDetails": {
    "rentAmount": 60000,
    "securityDeposit": 180000,
    "depositMonths": 3,
    "maintenanceCharges": 3000,
    "brokerage": "1 month rent",
    "brokeragePayableBy": "Tenant",
    "leaseTerm": "12 months",
    "priceNegotiable": true
  },
  
  "ownerDetails": {
    "ownerId": "owner_001",
    "ownerName": "Owner Name",
    "ownerPhone": "9876543210",
    "ownerEmail": "owner@example.com",
    "ownerWhatsApp": "919876543210"
  },
  
  "brokerDetails": {
    "brokerId": "broker_001",
    "brokerName": "Broker Name",
    "brokerPhone": "9988776655",
    "brokerEmail": "broker@example.com",
    "brokerWhatsApp": "919988776655",
    "brokerLicense": "LICENSE_NUMBER"
  },
  
  "tenantPreferences": {
    "vegetarian": false,
    "nonVegetarian": true,
    "bachelor": false,
    "bachelorette": false,
    "family": true,
    "studentsAllowed": false,
    "petsAllowed": false,
    "parentageAllowed": true
  },
  
  "nearbyLocations": {
    "nearestMetroStation": "Station - 0.7 km",
    "nearestAirport": "Airport - 15 km",
    "nearestSchool": "School - 1 km",
    "nearestMall": "Mall - 0.5 km",
    "nearestHospital": "Hospital - 1.5 km",
    "nearestMarket": "Market - 0.2 km"
  },
  
  "pricing": {
    "monthlyRent": 60000,
    "securityDeposit": 180000,
    "maintenanceCharges": 3000,
    "brokerageAmount": 60000,
    "processCharges": 2000
  },
  
  "legalDetails": {
    "propertyTitle": "Lease Hold",
    "governmentRestriction": "No",
    "mutualAgreement": "Yes",
    "documentationStatus": "Clear",
    "registrationStatus": "Registered with Society"
  },
  
  "additionalInfo": {
    "furnishingType": "Semi-Furnished",
    "furnishingIncludes": ["Fridge", "Stove"],
    "utilities": "Owner covers water",
    "roadWidth": "30 ft",
    "distanceFromRoad": "50 m"
  },
  
  "featured": false,
  "verified": true,
  "createdAt": "2024-02-01T09:15:00Z",
  "updatedAt": "2024-02-18T16:20:00Z",
  "isDummy": true
}
```

---

## 📝 REQUIRED vs OPTIONAL FIELDS

### MUST HAVE (Required)
- ✅ id
- ✅ title
- ✅ price (monthly rent)
- ✅ location
- ✅ description
- ✅ images (at least 1)
- ✅ status (must be "rent")
- ✅ basicDetails
- ✅ rentalDetails

### RECOMMENDED (Should Have)
- 📌 propertyFeatures
- 📌 amenities
- 📌 ownerDetails
- 📌 brokerDetails
- 📌 tenantPreferences
- 📌 nearbyLocations
- 📌 pricing

### OPTIONAL (Nice to Have)
- ⭕ videos
- ⭕ videoUrl
- ⭕ brochure
- ⭕ legalDetails
- ⭕ additionalInfo

---

## 🔑 KEY DIFFERENCES: RENT vs BUY

### RENT JSON Has (Unique to Rent):
```json
"rentalDetails": {
  "rentAmount": 60000,
  "securityDeposit": 180000,
  "depositMonths": 3,
  "maintenanceCharges": 3000,
  "brokerage": "1 month rent",
  "brokeragePayableBy": "Tenant",
  "leaseTerm": "12 months",
  "priceNegotiable": true
},

"tenantPreferences": {
  "vegetarian": false,
  "nonVegetarian": true,
  "bachelor": false,
  "bachelorette": false,
  "family": true,
  "studentsAllowed": false,
  "petsAllowed": false,
  "parentageAllowed": true
}
```

### Status Must Be:
```json
"status": "rent"
```

---

## 📂 HOW TO USE IN S3

### Step 1: Prepare Your Data
Create a JSON file with all rental properties in an array:

```json
[
  {
    "id": "prop_rent_001",
    "title": "2 BHK in Andheri",
    "price": 60000,
    ...
  },
  {
    "id": "prop_rent_002",
    "title": "3 BHK in Bandra",
    "price": 80000,
    ...
  }
]
```

### Step 2: Upload to S3
- **Filename**: `properties.json`
- **Location 1**: `s3://your-bucket/dummy-properties/properties.json`
- **Location 2**: `s3://your-bucket/properties/properties.json`

### Step 3: Access in App
The app will automatically:
- Check `VITE_PRODUCTION` flag
- Load from correct folder
- Display all rental properties

---

## ✅ VALIDATION CHECKLIST

Before uploading to S3, verify:

- [ ] Valid JSON format (use jsonlint.com to validate)
- [ ] All required fields present
- [ ] Image URLs are accessible
- [ ] Phone numbers are valid
- [ ] Email addresses are valid
- [ ] Latitude/Longitude are correct
- [ ] Rent amount is a number
- [ ] Deposit is calculated correctly
- [ ] Brokerage percentage is correct
- [ ] Status is "rent"
- [ ] Category is valid (apartment, villa, bungalow, etc.)
- [ ] Furnished status is valid (unfurnished, semi-furnished, full-furnished)
- [ ] Parking type is valid (open, covered)
- [ ] Facing direction is valid (N, S, E, W, NE, NW, SE, SW)
- [ ] All tenant preferences are boolean
- [ ] All amenities are strings
- [ ] Created/Updated timestamps are ISO format

---

## 🚀 EXAMPLE VARIATIONS

### Budget Rental (1 BHK)
```json
{
  "id": "prop_rent_budget_001",
  "title": "Affordable 1 BHK in Thane",
  "price": 30000,
  "pricePerSqft": 75,
  "basicDetails": {
    "bedrooms": 1,
    "bathrooms": 1,
    "balconies": 0,
    "areaSqft": 400,
    "carpetArea": 350,
    "superBuiltUp": 450
  },
  "rentalDetails": {
    "rentAmount": 30000,
    "securityDeposit": 90000,
    "depositMonths": 3,
    "maintenanceCharges": 1500
  },
  ...
}
```

### Luxury Rental (4 BHK)
```json
{
  "id": "prop_rent_luxury_001",
  "title": "Luxury 4 BHK Villa in Bandra",
  "price": 200000,
  "pricePerSqft": 500,
  "basicDetails": {
    "bedrooms": 4,
    "bathrooms": 4,
    "balconies": 3,
    "areaSqft": 4000,
    "carpetArea": 3500,
    "superBuiltUp": 4500
  },
  "rentalDetails": {
    "rentAmount": 200000,
    "securityDeposit": 600000,
    "depositMonths": 3,
    "maintenanceCharges": 10000
  },
  ...
}
```

---

## 📞 QUICK REFERENCE

| Field | Type | Format | Example |
|-------|------|--------|---------|
| rent | number | Monthly amount | 60000 |
| deposit | number | Total months × rent | 180000 |
| brokerage | string | "X month rent" or percentage | "1 month rent" |
| phone | string | Country code + 10 digits | "919876543210" |
| date | string | ISO 8601 format | "2024-02-01T09:15:00Z" |
| images | array | URLs array | ["url1", "url2"] |
| status | string | "rent" | "rent" |

---

## 🎉 READY TO ADD RENT PROPERTIES!

Use this format to add all your rental properties to S3.

**Questions?**
- Check example-property-rent.json in your project
- Use the template above
- Validate JSON before uploading

