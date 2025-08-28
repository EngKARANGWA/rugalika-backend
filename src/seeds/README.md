# Database Seeds

This directory contains database seeding scripts for the Rugalika News System.

## Available Seeds

### Admin User Seed
Creates a default system administrator user with the following credentials:
- **Email**: `admin@rugalika.gov.rw`
- **Phone**: `+250788000000`
- **National ID**: `1234567890123456`
- **Role**: `admin`
- **Status**: `active`
- **Employment Status**: `leader`
- **Email Verified**: `true`

## Usage

### Seed Admin User Only
```bash
npm run seed:admin
```

### Seed All Data
```bash
npm run seed
```

## Important Notes

1. **OTP Authentication**: This system uses OTP-based authentication (no passwords). The admin user can log in using the email address through the OTP verification process.

2. **Duplicate Prevention**: The seeding scripts check for existing data and will skip creation if an admin user already exists.

3. **Environment Variables**: Make sure your `.env` file is properly configured with the `MONGODB_URI` before running seeds.

4. **Production Use**: In production, you should change the default admin credentials immediately after the first login.

## Customization

To customize the default admin user, edit the `adminData` object in `src/seeds/admin.seed.ts`:

```typescript
const adminData = {
  firstName: 'Your',
  lastName: 'Name',
  email: 'your-email@domain.com',
  phone: '+250XXXXXXXXX',
  nationalId: 'XXXXXXXXXXXXXXXX', // 16 digits
  // ... other fields
};
```

## Adding New Seeds

1. Create a new seed file in this directory (e.g., `news.seed.ts`)
2. Export a seed function following the pattern in `admin.seed.ts`
3. Import and add the seed to the `runAllSeeds()` method in `index.ts`
4. Optionally add a specific script in `package.json` for the new seed

## Error Handling

The seeding scripts include comprehensive error handling:
- Duplicate key errors are handled gracefully
- Database connection issues are logged and re-thrown
- All operations are logged for debugging purposes
