# 🗺️ Google Maps API Setup Guide

## Getting Your API Key

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project (or select existing):**
   - Click "Select a project" → "New Project"
   - Name: "Jatour App"
   - Click "Create"

3. **Enable Maps JavaScript API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

4. **Create API Key:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. **Restrict API Key (Recommended for Production):**
   - Click on your API key to edit
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add: `http://localhost:3000/*`
     - Add: `https://yourdomain.com/*` (for production)
   - Under "API restrictions":
     - Select "Restrict key"
     - Check "Maps JavaScript API"
     - Save

## Add to Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"
```

## Required APIs

For full functionality, enable these APIs:
- ✅ **Maps JavaScript API** (Required)
- ✅ **Places API** (Optional - for place details)
- ✅ **Directions API** (Optional - for route planning)
- ✅ **Geocoding API** (Optional - for address conversion)

## Cost Information

- Google Maps offers **$200 free credit per month**
- Maps JavaScript API: **Free for up to 28,000 loads/month**
- Most small to medium apps stay within free tier

## Testing

After adding your API key, restart your dev server:

```bash
npm run dev
```

The maps should now load in:
- Destination detail modals
- Destination cards (when "Show Map" is clicked)
- Smart Itinerary section

## Troubleshooting

**"This page can't load Google Maps correctly"**
- Check if API key is correct
- Verify Maps JavaScript API is enabled
- Check browser console for specific errors

**Maps not showing:**
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Check if API key restrictions allow your domain
- Ensure API key has proper permissions

