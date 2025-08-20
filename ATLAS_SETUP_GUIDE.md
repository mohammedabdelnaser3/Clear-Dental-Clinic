# MongoDB Atlas Setup Guide

## 🔗 Connecting to MongoDB Atlas

### 1. Get Your Atlas Connection String

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. **Select your cluster**: `Cluster0`
3. **Click "Connect"**
4. **Choose "Connect your application"**
5. **Copy the connection string**

### 2. Update Environment Variables

Create or update your `.env` file in the `backend` directory:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/smartclinic?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=3009
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Populate Test Data

Run the Atlas connection script to populate test data:

```bash
cd backend
node atlas-connection.js
```

This will:
- ✅ Connect to your Atlas cluster
- ✅ Create test patient with ID: `68a064af75c4d016454241d9`
- ✅ Create test appointments for the patient
- ✅ Verify data consistency

### 4. Verify Data Consistency

Run the data consistency verification script:

```bash
cd backend
node verify-data-consistency.js
```

This will:
- ✅ Check for orphaned appointments
- ✅ Verify patient-dentist-clinic relationships
- ✅ Show data distribution statistics

### 5. Test the API

Run the API testing script:

```bash
node test-atlas-api.js
```

**Note**: You'll need to:
1. Start your backend server: `npm run dev`
2. Login to get a valid JWT token
3. Replace `TEST_TOKEN` in the script with your actual token

## 🔍 Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution**: Check your Atlas connection string and network connectivity

#### 2. Authentication Failed
```
Error: Authentication failed
```
**Solution**: Verify username/password in connection string

#### 3. Database Not Found
```
Error: Database smartclinic not found
```
**Solution**: The database will be created automatically when you first insert data

#### 4. Patient Not Found
```
Error: Patient not found
```
**Solution**: Run the `atlas-connection.js` script to create test data

### Manual Database Queries

You can also verify data directly in MongoDB Atlas:

```javascript
// Check if patient exists
db.patients.findOne({_id: ObjectId("68a064af75c4d016454241d9")})

// Check appointments for patient
db.appointments.find({patientId: ObjectId("68a064af75c4d016454241d9")})

// List all patients
db.patients.find({}, {_id: 1, firstName: 1, lastName: 1, email: 1})

// Count appointments
db.appointments.countDocuments()
```

## 📊 Expected Results

After successful setup:

### Database Collections
- `patients`: Contains patient records
- `appointments`: Contains appointment records
- `users`: Contains user accounts (patients, dentists, staff)
- `clinics`: Contains clinic information

### Test Data
- **Patient ID**: `68a064af75c4d016454241d9`
- **Patient Name**: John Doe
- **Email**: john.doe@example.com
- **Appointments**: 2 test appointments

### API Response
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "68a064af75c4d016454241d9",
      "fullName": "John Doe"
    },
    "appointments": {
      "success": true,
      "data": [
        {
          "_id": "...",
          "serviceType": "checkup",
          "date": "2025-01-20T00:00:00.000Z",
          "timeSlot": "10:00",
          "status": "scheduled"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 2,
        "pages": 1,
        "hasNext": false,
        "hasPrev": false
      }
    }
  }
}
```

## 🚀 Next Steps

1. **Test the frontend**: Ensure appointments display correctly
2. **Create more test data**: Add more patients and appointments
3. **Monitor performance**: Check Atlas metrics for query performance
4. **Set up backups**: Configure Atlas backup policies
5. **Implement indexes**: Add database indexes for better performance

## 📞 Support

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Verify your connection string format
3. Ensure your IP is whitelisted in Atlas
4. Check the application logs for detailed error messages
