# Settings Page Guide

## Overview
The new Settings page provides users with access to system configuration, debug information, and cache management for the CV scoring system.

## Features

### 1. CV Scoring Configuration
- **Word Count Limits**: Shows the current word count requirements (10-1,500 words)
- **Scoring Ranges**: Displays the scoring algorithm breakdown by word count
- **Quality Gates**: Explains the professional indicators and structure requirements

### 2. CV Score Cache Management
- **Cache Status**: Shows number of cached CV scores
- **Recent Entries**: Displays the last 5 cached CV entries with previews
- **Clear Cache**: Button to clear all cached scores
- **Cache Benefits**: Explains how caching prevents duplicate API calls

### 3. Debug Information
- **System Information**: User ID, email, last login time
- **CV Scoring System**: Algorithm details, model information, cache status
- **Development Mode**: Technical information for debugging

### 4. System Status
- **Service Status**: Visual indicators for authentication, CV scoring, and cache
- **Recent Updates**: List of latest system improvements
- **System Health**: Overall system operational status

## Access
- **URL**: `/settings`
- **Navigation**: Available in navbar for authenticated users
- **Dashboard**: Quick access card on the main dashboard

## Benefits
1. **Cleaner CV Score Page**: Removed debug information for better user experience
2. **Centralized Configuration**: All system settings in one place
3. **Professional Appearance**: Hides technical details from regular users
4. **Easy Maintenance**: Developers can access debug info when needed

## Technical Details
- **Authentication Required**: Only accessible to logged-in users
- **Responsive Design**: Works on both desktop and mobile
- **Collapsible Sections**: Users can expand/collapse sections as needed
- **Real-time Data**: Cache information updates in real-time

## Future Enhancements
- User preferences for CV scoring
- Export/import settings
- Advanced cache configuration
- Performance metrics
- User feedback system
