# CV Rewrite Feature

## Overview

The CV Rewrite feature is an AI-powered tool that automatically improves CVs based on the feedback from the CV scoring system. It provides a complete workflow from CV analysis to improvement suggestions to final scoring comparison.

## Features

### 1. **CV Analysis & Scoring**
- Upload PDF or paste CV text
- Get detailed AI-powered scoring (0-100)
- Receive specific feedback on professionalism, experience, keywords, and relevance
- Optional target role specification for better tailoring

### 2. **AI-Powered CV Rewriting**
- Automatic CV improvement based on scoring feedback
- Maintains original structure while enhancing content
- Uses action verbs and quantifiable achievements
- Makes CV more ATS-friendly
- Provides detailed explanation of changes made

### 3. **Score Comparison**
- Compare original CV score with rewritten CV score
- Visual score improvement display
- Detailed breakdown of improvements
- Track progress and effectiveness

## How It Works

### Step 1: CV Analysis
1. Upload a PDF CV or paste CV text
2. Optionally specify target role for better tailoring
3. Click "Analyze CV" to get AI-powered scoring
4. Review detailed feedback and scoring breakdown

### Step 2: CV Rewrite
1. After analysis, click "AI Rewrite CV" button
2. AI processes the original CV and feedback
3. Generates improved version with detailed change explanations
4. View results in organized tabs (Summary, Changes, Rewritten CV)

### Step 3: Score Comparison
1. Click "Score Rewritten CV" to evaluate improvements
2. Compare original vs. new scores
3. View detailed improvement analysis
4. Download or copy the improved CV

## API Endpoints

### `/api/cv-rewrite`
- **Method**: POST
- **Purpose**: Generate AI-powered CV rewrite
- **Input**: Original CV text, score feedback, target role
- **Output**: Rewritten CV, changes made, improvement summary

### `/api/score-rewritten`
- **Method**: POST
- **Purpose**: Score the rewritten CV
- **Input**: Rewritten CV text, original score, original feedback
- **Output**: New score with comparison analysis

## User Experience

### **Guest Users**
- Can analyze CVs and get scores
- Cannot access rewrite features
- Encouraged to create account for full functionality

### **Registered Users**
- Full access to all features
- CV scores saved to profile
- Complete rewrite workflow
- Score comparison and tracking

## Technical Implementation

### **Frontend Components**
- `CVScorePage`: Main page with integrated workflow
- `CVRewriteDisplay`: Dedicated component for rewrite results
- Tabbed interface for organized content display
- Copy and download functionality

### **State Management**
- CV text and file handling
- Scoring states and results
- Rewrite processing states
- Score comparison data

### **AI Integration**
- OpenAI GPT-4 for CV analysis
- Structured prompts for consistent output
- Response parsing for organized display
- Error handling and user feedback

## Benefits

1. **Immediate Improvement**: Get actionable feedback and improved CV in minutes
2. **Professional Quality**: AI-powered enhancements based on best practices
3. **Score Tracking**: Measure improvement effectiveness
4. **User-Friendly**: Simple workflow with clear visual feedback
5. **Customizable**: Target role specification for better tailoring

## Future Enhancements

- Multiple CV version management
- Industry-specific optimization
- ATS compatibility scoring
- Export to various formats (PDF, Word)
- CV template suggestions
- Performance analytics and trends

## Security & Privacy

- Authentication required for rewrite features
- CV data processed securely through OpenAI
- No permanent storage of CV content
- User consent for AI processing
