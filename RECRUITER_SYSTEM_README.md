# Gradual Recruiter System

## Overview

The Gradual Recruiter System provides recruiters with secure, professional access to student profiles with comprehensive filtering, shortlisting, and contact capabilities. The system is designed with security, privacy, and UX polish as core principles.

## Features Implemented

### 🔐 Security & Authentication
- **Role-based Access Control**: Separate recruiter authentication system
- **Subscription Tiers**: Free, Basic, Premium, and Enterprise tiers with different permissions
- **Rate Limiting**: Daily/monthly limits on profile views and contacts
- **Privacy Controls**: Students can control their visibility to recruiters
- **Secure API Endpoints**: All recruiter endpoints require proper authentication

### 👥 Student Profile Access
- **Limited Profile View**: Recruiters see filtered student data based on permissions
- **CV Score Access**: View student CV scores (subscription-dependent)
- **Achievement Visibility**: See student achievements and gamification progress
- **Contact Information**: Access to student contact details (with permissions)
- **Privacy Respect**: Students control what recruiters can see

### 🔍 Search & Filtering
- **Advanced Filters**: University, degree, CV score, location, achievements
- **Real-time Search**: Search by name, university, degree, location
- **Smart Matching**: AI-powered student-recruiter matching
- **Saved Searches**: Save and reuse search criteria

### 📋 Shortlisting & Management
- **Create Shortlists**: Organize students into custom lists
- **Share Shortlists**: Collaborate with team members (Enterprise)
- **Export Capabilities**: Export student data (Premium/Enterprise)
- **Bulk Actions**: Manage multiple students at once

### 📧 Contact System
- **Secure Messaging**: Send messages to students through the platform
- **Contact History**: Track all communications
- **Response Tracking**: Monitor student responses
- **Email Integration**: Automatic email notifications

### 📊 Analytics & Insights
- **Profile View Analytics**: Track which profiles are viewed most
- **Contact Success Rates**: Monitor response rates
- **Search Analytics**: Understand search patterns
- **Performance Metrics**: Dashboard with key KPIs

## Technical Architecture

### Data Models

#### Recruiter Profile (`RecruiterProfile`)
```typescript
interface RecruiterProfile {
  uid: string;
  email: string;
  role: 'recruiter';
  companyName: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'trial';
  permissions: RecruiterPermissions;
  // ... additional fields
}
```

#### Student Profile View (`StudentProfileView`)
```typescript
interface StudentProfileView {
  uid: string;
  fullName: string;
  university: string;
  degree: string;
  cvScore: number | null;
  achievements: AchievementData;
  // ... filtered based on recruiter permissions
}
```

### Subscription Tiers

| Feature | Free | Basic | Premium | Enterprise |
|---------|------|-------|---------|------------|
| Profile Views | 10/month | 100/month | 500/month | Unlimited |
| Contacts | 5/month | 25/month | 100/month | Unlimited |
| Shortlists | 2 | 10 | 25 | Unlimited |
| CV Score Access | ✅ | ✅ | ✅ | ✅ |
| Full Profile Access | ❌ | ❌ | ✅ | ✅ |
| Student Contact | ❌ | ❌ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Data Export | ❌ | ❌ | ❌ | ✅ |

### Security Implementation

#### Firestore Rules
- **Role Verification**: Helper functions to check recruiter status
- **Data Filtering**: Students control what recruiters can see
- **Rate Limiting**: Built into Firestore rules
- **Access Control**: Granular permissions for different operations

#### API Security
- **Token Verification**: All endpoints verify Firebase tokens
- **Permission Checks**: Validate recruiter permissions before operations
- **Rate Limiting**: Server-side rate limiting for API calls
- **Data Sanitization**: Filter sensitive data based on permissions

## File Structure

```
src/
├── types/
│   └── recruiter.ts                 # Type definitions
├── lib/
│   ├── recruiter-auth.ts           # Authentication & authorization
│   └── user-role.ts               # Role detection & routing
├── app/
│   ├── recruiter-dashboard/        # Main recruiter interface
│   ├── recruiter-onboarding/      # Profile setup
│   └── api/recruiter/             # API endpoints
│       ├── verify/                 # Recruiter verification
│       ├── students/               # Student profile access
│       ├── shortlists/             # Shortlist management
│       ├── contact/                # Student contact
│       └── create-profile/         # Profile creation
└── components/
    └── StudentPrivacySettings.tsx # Student privacy controls
```

## API Endpoints

### Authentication
- `GET /api/recruiter/verify` - Verify recruiter status and get permissions
- `POST /api/recruiter/create-profile` - Create new recruiter profile

### Student Access
- `POST /api/recruiter/students` - Get filtered student profiles
- `POST /api/recruiter/contact` - Send message to student

### Management
- `GET /api/recruiter/shortlists` - Get recruiter's shortlists
- `POST /api/recruiter/shortlists` - Create new shortlist

## Usage Guide

### For Recruiters

1. **Registration**: Select "Recruiter" role during registration
2. **Onboarding**: Complete company and personal information
3. **Dashboard Access**: Access recruiter dashboard with student search
4. **Search Students**: Use filters to find relevant candidates
5. **Create Shortlists**: Organize students into custom lists
6. **Contact Students**: Send messages through the platform
7. **Track Analytics**: Monitor performance and engagement

### For Students

1. **Privacy Settings**: Control visibility in recruiter searches
2. **Contact Preferences**: Choose whether to allow recruiter contact
3. **Profile Control**: Decide what information recruiters can see
4. **Response Management**: Respond to recruiter messages

## Security Considerations

### Data Privacy
- Students control their visibility to recruiters
- Sensitive information is filtered based on permissions
- Contact information is only shared with explicit permission
- All data access is logged and auditable

### Rate Limiting
- Daily limits on profile views prevent abuse
- Monthly contact limits based on subscription tier
- API rate limiting prevents system overload
- Gradual escalation for suspicious activity

### Access Control
- Role-based permissions for all operations
- Subscription tier enforcement
- Secure token-based authentication
- Firestore rules prevent unauthorized access

## Future Enhancements

### Phase 2 Features
- **Advanced Analytics**: Detailed insights and reporting
- **Team Collaboration**: Multi-user recruiter accounts
- **Integration APIs**: Connect with ATS systems
- **Automated Matching**: AI-powered candidate recommendations

### Phase 3 Features
- **Video Interviews**: Built-in interview scheduling
- **Assessment Tools**: Skills testing and evaluation
- **Pipeline Management**: Full recruitment workflow
- **Enterprise Features**: Custom branding and white-labeling

## Development Notes

### Testing
- Unit tests for authentication logic
- Integration tests for API endpoints
- Security testing for access controls
- Performance testing for rate limits

### Monitoring
- Track recruiter activity and engagement
- Monitor API usage and performance
- Alert on suspicious activity patterns
- Regular security audits

### Deployment
- Gradual rollout with feature flags
- A/B testing for new features
- Monitoring and alerting setup
- Backup and disaster recovery

## Contributing

When adding new recruiter features:

1. **Security First**: Always implement proper access controls
2. **Privacy Respect**: Ensure student privacy is protected
3. **Rate Limiting**: Implement appropriate limits for new features
4. **Testing**: Add comprehensive tests for new functionality
5. **Documentation**: Update this README with new features

## Support

For technical issues or questions about the recruiter system:
- Check the API documentation
- Review the security implementation
- Test with different subscription tiers
- Monitor logs for error patterns

---

**Note**: This system is designed to be professional, secure, and respectful of student privacy while providing recruiters with the tools they need to find and connect with talented students.

