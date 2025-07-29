# Opportunity Fetcher System

A simplified, modular system for fetching job opportunities from Adzuna API, focused on the New Zealand and Australian markets.

## 🎯 Overview

This system fetches opportunities from:
- **Adzuna** - New Zealand job market (primary source)

## 🏗️ Architecture

### Core Components

1. **BaseOpportunityFetcher** - Abstract base class with common functionality
2. **AdzunaFetcher** - Fetches from Adzuna API (NZ focused)
3. **OpportunityFetcherOrchestrator** - Manages fetching and deduplication
4. **Configuration System** - Centralized config management

### Data Flow

```
Adzuna API → AdzunaFetcher → Normalized Data → Firestore
```

## 🚀 Quick Start

### 1. Environment Setup

Add to your `.env.local`:

```env
# Adzuna (NZ focused)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Firebase (existing)
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_key
```

### 2. Run Fetch Script

```bash
# Fetch from Adzuna
node lib/fetchOpportunitiesEfficient.js
```

## 📍 Geographic Focus

### New Zealand Cities
- Auckland
- Wellington  
- Christchurch
- Hamilton
- Tauranga
- Dunedin

### Australian Cities
- Sydney
- Melbourne
- Brisbane
- Perth
- Adelaide
- Canberra

## 🔧 Configuration

### Enable/Disable Sources

Edit `lib/opportunityFetchers/config.js`:

```js
adzuna: {
  enabled: true,  // Currently active
  country: 'nz',  // New Zealand
  // ...
}
```

### Search Queries

Default queries for both sources:
- `intern`
- `graduate` 
- `entry level`
- `junior`
- `student`

### Rate Limiting

- **Adzuna**: 1 second between requests

## 📊 Data Structure

All opportunities are normalized to this format:

```js
{
  id: "source_unique_id",
  title: "Job Title",
  description: "Job Description",
  location: "City, Country",
  company: "Company Name",
  url: "Apply URL",
  type: "internship|graduate|job",
  category: "Industry",
  created: "2024-01-01T00:00:00Z",
  salary_min: 50000,
  salary_max: 70000,
  salary_currency: "NZD",
  remote: false,
  source: "adzuna",
  fetchedAt: "2024-01-01T00:00:00Z"
}
```

## 🎯 Benefits

### For NZ/AU Market
- **Local Focus**: Adzuna provides NZ-specific opportunities
- **Rich Data**: Salary info, company details, remote flags

### Technical Benefits
- **Simple**: Single API to manage
- **Reliable**: Built-in retry and rate limiting
- **Scalable**: Easy to add more sources later
- **Maintainable**: Clean, modular architecture

## 🔄 Integration with Existing System

This system works seamlessly with your existing:
- **Scoring Algorithm** - No changes needed
- **UI Components** - Same opportunity cards
- **Firestore Structure** - Same data format
- **Star/Save Functionality** - Works with all sources

## 📈 Next Steps

1. **Apply for Additional APIs** - Seek, Indeed, LinkedIn partnerships
2. **Test New Integrations** - When API access is granted
3. **Monitor Performance** - Check opportunity quality and quantity
4. **Scale Up** - Add more sources as needed

## 🛠️ Troubleshooting

### Common Issues

1. **No opportunities found**
   - Check API credentials
   - Verify location names match API expectations
   - Check rate limiting

2. **API errors**
   - Verify API keys are correct
   - Check API quotas/limits
   - Review error logs

3. **Duplicate opportunities**
   - System automatically removes duplicates
   - Based on title + company combination

### Debug Commands

```bash
# Check configuration
node -e "console.log(require('./lib/opportunityFetchers/config').getEnabledSources())"

# Validate credentials
node -e "console.log(require('./lib/opportunityFetchers/config').validateCredentials())"
``` 