# Dantara Admin Panel

The independent admin panel for Dantara's therapeutic management system. This is a separate frontend deployment from the main public site, with its own Azure Static Web App and Function App backend.

## Architecture

- **Frontend**: Azure Static Web Apps (DantaraWebAdminStaging)
- **Backend**: Azure Functions (FuncAppDantaraAdminStaging)
- **Runtime**: Node.js 20, Azure Functions v4
- **Storage**: Shared Azure Storage Account (dantarafuncstorage)

## Features

- **AI Configuration Panel** (`ai-config.html`): Configure and manage AI settings
- **Intake Management**: View, search, and manage client intakes
- **Service & Cost Admin**: Manage services, pricing, and service costs
- **Promo Management**: Create and manage promotional offers
- **Gift Card Management**: Issue and track gift vouchers
- **Role-Based Access**: Azure AD authentication with role-based routing
- **Multi-Language Support**: Thai and English language options

## File Structure

```
/
├── index.html                      # Admin panel entry point
├── ai-config.html                  # AI configuration UI
├── ai-config.js                    # AI config logic
├── ai-config-constants.js          # UI strings and constants (Thai translations)
├── ai-config-helpers.js            # Helper functions
├── ai-config-speech.js             # Speech functionality
├── ai-config.css                   # Admin panel styling
├── forbidden.html                  # Access denied page
├── intake-admin.html               # Intake management interface
├── promo-admin.html                # Promotional management interface
├── services-admin.html             # Service management
├── service-cost-admin.html         # Service cost management
├── gift-card-admin.html            # Gift card/voucher management
├── landing.html                    # Admin landing page
├── ai-config.test.js               # Unit tests (28 tests)
├── e2e.test.mjs                    # End-to-end tests (19 tests)
├── staticwebapp.config.json        # Azure SWA configuration
├── content/                        # Documentation and guides
└── README.md                       # This file
```

## Development

### Prerequisites

- Node.js 20+
- npm
- Azure CLI
- Git

### Local Setup

```bash
# Clone the repository
git clone https://github.com/damienjames/DantaraWebAdminRepo.git
cd DantaraWebAdminRepo

# Install dependencies (if using local API)
npm install
```

### Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e
```

## Deployment

This repo is deployed via GitHub Actions to Azure Static Web Apps.

### Staging Deployment

- **SWA**: DantaraWebAdminStaging (eastus2)
- **API**: FuncAppDantaraAdminStaging (canadacentral)
- **Trigger**: Push to `staging` branch

### Production Deployment

- **SWA**: DantaraWebAdminProduction (to be created)
- **API**: FuncAppDantaraAdminProduction (to be created)
- **Trigger**: Push to `main` branch

## Configuration

### Environment Variables

Set in Azure Function App settings:
- `DANTARA_BUSINESS_ID`: Business identifier
- `DANTARA_API_KEY`: API authentication key
- `AZURE_STORAGE_CONNECTION_STRING`: Storage account connection

### Authentication

Azure AD authentication is configured via:
- Tenant ID: `a5bcf9da-3e8b-466d-924d-1f9e81ad1352`
- Post-login redirect: Referrer URL
- Role-based access control in `staticwebapp.config.json`

## Related Repositories

- **Main Web App**: [DantaraWebRepo](https://github.com/damienjames/DantaraWebRepo)
- **Admin API Functions**: [DantaraWebAdminAPIRepo](https://github.com/damienjames/DantaraWebAdminAPIRepo) (coming soon)
- **AI Applications**: [DanataAIApps](https://github.com/damienjames/DanataAIApps)

## Troubleshooting

### Access Denied (403)

If you see the forbidden page, check:
1. Azure AD authentication is configured
2. Your user has the required role
3. Check admin panel logs in Azure Portal

### API Connection Issues

If the admin panel can't connect to functions:
1. Verify FuncAppDantaraAdminStaging is running
2. Check Function App logs in Azure Portal
3. Verify storage account connection string
4. Check network configuration and CORS settings

## Support

For issues or questions about the admin panel, contact the development team or create an issue on GitHub.

## License

Proprietary - Dantara Therapeutic Services
