# 🧪 API Testing Guide

Use this guide to test all your backend endpoints.

## Testing Tools

You can test the API using:
1. **Browser** - For GET requests
2. **Postman** - Full-featured API client
3. **curl** - Command line tool
4. **Thunder Client** (VS Code extension)
5. **REST Client** (VS Code extension)

## Base URL

```
http://localhost:3001
```

## 1. Users API

### Get All Users
```bash
GET http://localhost:3001/users
```

### Get User by ID
```bash
GET http://localhost:3001/users/1
```

### Get User by Email
```bash
GET http://localhost:3001/users?email=alden@jatour.test
```

### Create User
```bash
POST http://localhost:3001/users
Content-Type: application/json

{
  "email": "newuser@jatour.test",
  "password": "password123",
  "fullName": "New User",
  "phone": "081234567890",
  "profilePicture": "/avatars/default.jpg",
  "preferences": {
    "language": "id",
    "notifications": true,
    "theme": "light"
  },
  "createdAt": "2025-11-06T00:00:00Z"
}
```

### Update User
```bash
PATCH http://localhost:3001/users/1
Content-Type: application/json

{
  "fullName": "Updated Name",
  "phone": "081111111111"
}
```

### Delete User
```bash
DELETE http://localhost:3001/users/2
```

## 2. Itineraries API

### Get All Itineraries
```bash
GET http://localhost:3001/itineraries
```

### Get User's Itineraries
```bash
GET http://localhost:3001/itineraries?userId=1
```

### Get Itinerary by ID
```bash
GET http://localhost:3001/itineraries/1
```

### Create Itinerary
```bash
POST http://localhost:3001/itineraries
Content-Type: application/json

{
  "userId": "1",
  "title": "Weekend in Bali",
  "destination": "Bali",
  "startDate": "2025-12-01",
  "endDate": "2025-12-03",
  "thumbnail": "/destinations/bali.jpg",
  "status": "upcoming",
  "days": [],
  "createdAt": "2025-11-06T00:00:00Z"
}
```

### Update Itinerary
```bash
PATCH http://localhost:3001/itineraries/1
Content-Type: application/json

{
  "status": "ongoing"
}
```

### Delete Itinerary
```bash
DELETE http://localhost:3001/itineraries/3
```

## 3. Destinations API

### Get All Destinations
```bash
GET http://localhost:3001/destinations
```

### Filter by City
```bash
GET http://localhost:3001/destinations?city=Surabaya
```

### Filter by Category
```bash
GET http://localhost:3001/destinations?category=Beach
```

### Get Featured Destinations
```bash
GET http://localhost:3001/destinations?featured=true
```

### Search Destinations
```bash
GET http://localhost:3001/destinations?q=bromo
```

### Get Destination by ID
```bash
GET http://localhost:3001/destinations/1
```

## 4. Weather API

### Get All Weather Data
```bash
GET http://localhost:3001/weather
```

### Get Weather by City
```bash
GET http://localhost:3001/weather?city=Surabaya
```

## 5. Wallet API

### Get All Wallets
```bash
GET http://localhost:3001/wallet
```

### Get User's Wallet
```bash
GET http://localhost:3001/wallet?userId=1
```

### Update Wallet
```bash
PATCH http://localhost:3001/wallet/1
Content-Type: application/json

{
  "balance": 1500000
}
```

## 6. Transactions API

### Get All Transactions
```bash
GET http://localhost:3001/transactions
```

### Get User's Transactions
```bash
GET http://localhost:3001/transactions?userId=1
```

### Get Sorted Transactions (Newest First)
```bash
GET http://localhost:3001/transactions?userId=1&_sort=date&_order=desc
```

### Create Transaction
```bash
POST http://localhost:3001/transactions
Content-Type: application/json

{
  "userId": "1",
  "walletId": "1",
  "type": "expense",
  "amount": 250000,
  "description": "Dinner at restaurant",
  "category": "food",
  "date": "2025-11-06T19:30:00Z"
}
```

## 7. Notifications API

### Get All Notifications
```bash
GET http://localhost:3001/notifications
```

### Get User's Notifications
```bash
GET http://localhost:3001/notifications?userId=1
```

### Get Unread Notifications
```bash
GET http://localhost:3001/notifications?userId=1&read=false
```

### Create Notification
```bash
POST http://localhost:3001/notifications
Content-Type: application/json

{
  "userId": "1",
  "title": "New Destination Added",
  "message": "Check out the new beach in Bali!",
  "type": "promotion",
  "read": false,
  "createdAt": "2025-11-06T10:00:00Z"
}
```

### Mark as Read
```bash
PATCH http://localhost:3001/notifications/n1
Content-Type: application/json

{
  "read": true
}
```

### Delete Notification
```bash
DELETE http://localhost:3001/notifications/n2
```

## 8. Recommendations API

### Get All Recommendations
```bash
GET http://localhost:3001/recommendations
```

### Get User's Recommendations
```bash
GET http://localhost:3001/recommendations?userId=1
```

### Sorted by Priority
```bash
GET http://localhost:3001/recommendations?userId=1&_sort=priority&_order=asc
```

## 9. Categories API

### Get All Categories
```bash
GET http://localhost:3001/categories
```

### Get Category by ID
```bash
GET http://localhost:3001/categories/1
```

## Advanced Queries

### Pagination
```bash
# Get page 1 with 5 items
GET http://localhost:3001/destinations?_page=1&_limit=5

# Get page 2
GET http://localhost:3001/destinations?_page=2&_limit=5
```

### Sorting
```bash
# Sort by rating (descending)
GET http://localhost:3001/destinations?_sort=rating&_order=desc

# Sort by name (ascending)
GET http://localhost:3001/destinations?_sort=name&_order=asc
```

### Multiple Filters
```bash
# Beach destinations in Bali with high rating
GET http://localhost:3001/destinations?category=Beach&city=Bali&rating_gte=4.5
```

### Range Queries
```bash
# Destinations with rating >= 4.0
GET http://localhost:3001/destinations?rating_gte=4.0

# Destinations with price between 100K and 500K
GET http://localhost:3001/destinations?price.min_gte=100000&price.max_lte=500000
```

### Full-text Search
```bash
# Search in all fields
GET http://localhost:3001/destinations?q=beach

# Case-insensitive search works automatically
```

## Testing with JavaScript/React

### Using Fetch API
```javascript
// GET request
const response = await fetch('http://localhost:3001/destinations');
const destinations = await response.json();

// POST request
const response = await fetch('http://localhost:3001/itineraries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: '1',
    title: 'New Trip',
    destination: 'Bali',
    startDate: '2025-12-01',
    endDate: '2025-12-03',
  }),
});
const newItinerary = await response.json();
```

### Using the API Utility
```javascript
import api from '@/lib/api';

// Get destinations
const destinations = await api.destination.getAll();

// Search destinations
const results = await api.destination.search('beach');

// Create itinerary
const newTrip = await api.itinerary.create({
  userId: '1',
  title: 'New Trip',
  destination: 'Bali',
  startDate: '2025-12-01',
  endDate: '2025-12-03',
});
```

## Testing with curl

### GET Request
```bash
curl http://localhost:3001/destinations
```

### POST Request
```bash
curl -X POST http://localhost:3001/itineraries \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1",
    "title": "New Trip",
    "destination": "Bali",
    "startDate": "2025-12-01",
    "endDate": "2025-12-03"
  }'
```

### PATCH Request
```bash
curl -X PATCH http://localhost:3001/users/1 \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Updated Name"}'
```

### DELETE Request
```bash
curl -X DELETE http://localhost:3001/itineraries/3
```

## Testing Scenarios

### Scenario 1: User Registration Flow
1. Create a new user (POST /users)
2. Verify user exists (GET /users?email=xxx)
3. Create wallet for user (automatic in app)
4. Login user (GET /users?email=xxx&password=xxx)

### Scenario 2: Create Trip Flow
1. Login user
2. Browse destinations (GET /destinations)
3. Create itinerary (POST /itineraries)
4. Add activities to itinerary (PATCH /itineraries/:id)
5. Get user's itineraries (GET /itineraries?userId=xxx)

### Scenario 3: Payment Flow
1. Get user's wallet (GET /wallet?userId=xxx)
2. Create transaction (POST /transactions)
3. Update wallet balance (PATCH /wallet/:id)
4. Create notification (POST /notifications)

## Response Formats

### Success Response (200)
```json
{
  "id": "1",
  "name": "Taman Bungkul",
  "city": "Surabaya",
  "rating": 4.5
}
```

### Created Response (201)
```json
{
  "id": "4",
  "title": "New Trip",
  "userId": "1",
  "createdAt": "2025-11-06T00:00:00Z"
}
```

### Error Response (404)
```json
{}
```

### Error Response (500)
```json
{
  "error": "Internal Server Error"
}
```

## Database Reset

To reset the database to initial state:

1. Stop JSON Server (Ctrl+C)
2. Edit `db.json` manually
3. Restart JSON Server

## Best Practices

1. ✅ Always test GET before POST/PATCH
2. ✅ Verify IDs exist before updating
3. ✅ Use proper content-type headers
4. ✅ Handle error responses
5. ✅ Test edge cases (empty results, invalid IDs)
6. ✅ Use filtering to reduce data transfer
7. ✅ Implement pagination for large datasets

## Debug Tips

- Check if JSON Server is running: `http://localhost:3001`
- View all data: Open `db.json` file
- Check browser Network tab for API calls
- Use `console.log()` to debug responses
- Verify request payloads match expected format

Happy Testing! 🧪
