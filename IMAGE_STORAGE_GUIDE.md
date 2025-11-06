# Image Storage Guide for Jatour App

## Overview
This guide explains where and how to store images in your Jatour application.

---

## Image Directory Structure

```
jatour-app/
├── public/                          # ✅ Main folder for all static assets
│   ├── destinations/                # Destination images
│   │   ├── surabaya.png
│   │   ├── bali-beach.jpg
│   │   ├── mount-bromo.jpg
│   │   └── ...
│   ├── avatars/                     # User profile pictures
│   │   ├── default.jpg
│   │   ├── user-123.jpg
│   │   └── ...
│   ├── itineraries/                 # Itinerary thumbnails
│   │   ├── trip-1.jpg
│   │   ├── trip-2.jpg
│   │   └── ...
│   ├── categories/                  # Category icons
│   │   ├── beach-icon.svg
│   │   ├── mountain-icon.svg
│   │   └── ...
│   ├── backgrounds/                 # Background images
│   │   ├── beach.jpg
│   │   ├── Bali-Pantai.webp
│   │   ├── semeru.webp
│   │   └── main-bg.webp
│   └── placeholder.jpg              # Default placeholder image
```

---

## How to Reference Images

### 1. **In React Components**
```tsx
import Image from 'next/image';

// For destinations
<Image 
  src="/destinations/surabaya.png" 
  alt="Surabaya"
  width={400}
  height={300}
/>

// Or with regular img tag
<img src="/destinations/surabaya.png" alt="Surabaya" />
```

### 2. **In CSS/Tailwind**
```tsx
<div className="bg-[url('/backgrounds/beach.jpg')]">
  {/* Content */}
</div>
```

### 3. **In Database (db.json)**
```json
{
  "destinations": [
    {
      "id": "1",
      "name": "Surabaya",
      "image": "/destinations/surabaya.png",
      "thumbnail": "/destinations/surabaya-thumb.jpg"
    }
  ]
}
```

---

## Image Naming Conventions

### ✅ Good Examples:
- `surabaya.png`
- `mount-bromo.jpg`
- `bali-beach-sunset.webp`
- `user-avatar-123.jpg`

### ❌ Avoid:
- `IMG_20240101.jpg` (not descriptive)
- `Surabaya City.jpg` (spaces in filename)
- `DESTINASI#1.PNG` (special characters)

---

## Best Practices

### 1. **Image Formats**
- **WEBP**: Best for web (smaller size, good quality)
- **JPG**: For photos and complex images
- **PNG**: For images with transparency
- **SVG**: For icons and logos

### 2. **Image Sizes**
- **Thumbnails**: 400x300px or 16:9 ratio
- **Full size**: Max 1920x1080px
- **Profile pictures**: 200x200px (square)
- **Optimize images** before uploading (use tools like TinyPNG, ImageOptim)

### 3. **File Naming**
- Use lowercase
- Use hyphens (-) instead of spaces
- Be descriptive: `bali-beach-sunset.jpg` ✅ not `image1.jpg` ❌

---

## Example Database Entries

### Destination with Image:
```json
{
  "id": "dest_1",
  "name": "Surabaya",
  "city": "Surabaya",
  "province": "East Java",
  "image": "/destinations/surabaya.png",
  "category": "City",
  "rating": 4.5,
  "description": "The capital of East Java...",
  "coordinates": { "lat": -7.2575, "lng": 112.7521 }
}
```

### User with Profile Picture:
```json
{
  "id": "user_1",
  "email": "john@example.com",
  "fullName": "John Doe",
  "profilePicture": "/avatars/john-doe.jpg",
  "phone": "08123456789"
}
```

### Itinerary with Thumbnail:
```json
{
  "id": "itin_1",
  "userId": "user_1",
  "title": "Bali Adventure",
  "destination": "Bali",
  "thumbnail": "/itineraries/bali-trip.jpg",
  "startDate": "2024-12-01",
  "endDate": "2024-12-05"
}
```

---

## Using the `getImageUrl` Utility

The project includes a utility function in `/lib/utils.ts`:

```tsx
import { getImageUrl } from '@/lib/utils';

// Usage in component
<img 
  src={getImageUrl(destination.image, '/placeholder.jpg')} 
  alt={destination.name}
/>

// This will:
// - Return the image path if it exists
// - Return the fallback (/placeholder.jpg) if image is undefined
// - Handle both local paths and external URLs
```

---

## Adding New Images

### Step 1: Place Image in Public Folder
```bash
# Example: Adding a new destination image
jatour-app/public/destinations/mount-bromo.jpg
```

### Step 2: Update Database
```json
// In db.json
{
  "destinations": [
    {
      "id": "dest_new",
      "name": "Mount Bromo",
      "image": "/destinations/mount-bromo.jpg",
      // ... other fields
    }
  ]
}
```

### Step 3: Reference in Code
```tsx
// The image will be automatically accessible
<img src="/destinations/mount-bromo.jpg" alt="Mount Bromo" />
```

---

## External Images (URLs)

You can also use external image URLs:

```json
{
  "image": "https://example.com/images/destination.jpg"
}
```

But for better performance and control, it's recommended to:
1. Download the image
2. Optimize it
3. Store it in `/public` folder
4. Use local path

---

## Image Optimization Tips

### 1. **Use Next.js Image Component**
```tsx
import Image from 'next/image';

<Image
  src="/destinations/bali.jpg"
  alt="Bali"
  width={800}
  height={600}
  loading="lazy" // Lazy load images
  placeholder="blur" // Show blur while loading
/>
```

### 2. **Lazy Loading**
For regular img tags:
```tsx
<img 
  src="/destinations/bali.jpg" 
  alt="Bali"
  loading="lazy"
/>
```

### 3. **Responsive Images**
```tsx
<picture>
  <source 
    srcSet="/destinations/bali-mobile.webp" 
    media="(max-width: 768px)" 
  />
  <source 
    srcSet="/destinations/bali-desktop.webp" 
    media="(min-width: 769px)" 
  />
  <img src="/destinations/bali.jpg" alt="Bali" />
</picture>
```

---

## Common Issues & Solutions

### Issue 1: Image Not Showing
**Problem**: Image path is incorrect
**Solution**: 
- Make sure path starts with `/` (e.g., `/destinations/bali.jpg`)
- Check file exists in `/public` folder
- Check spelling and case sensitivity

### Issue 2: Image is Too Large
**Problem**: Slow loading times
**Solution**:
- Compress images before uploading
- Use WebP format when possible
- Use appropriate dimensions (don't use 4K images for thumbnails)

### Issue 3: Broken Image Icon
**Problem**: Image file doesn't exist
**Solution**:
- Use `getImageUrl` utility with fallback
- Always provide a `placeholder.jpg` in `/public`

```tsx
// Good practice
<img 
  src={getImageUrl(item.image, '/placeholder.jpg')}
  alt={item.name}
  onError={(e) => {
    e.currentTarget.src = '/placeholder.jpg';
  }}
/>
```

---

## Summary

✅ **Store images in**: `/public/` folder
✅ **Reference as**: `/folder/image.jpg` (without 'public' in path)
✅ **Organize by**: Category (destinations, avatars, backgrounds, etc.)
✅ **Use**: Descriptive, lowercase, hyphenated names
✅ **Optimize**: Compress and use appropriate formats
✅ **Fallback**: Always provide placeholder images

---

**Last Updated**: November 2024
**Project**: Jatour Travel App
