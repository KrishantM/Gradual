// Mock Opportunity Dataset
// This file contains in-memory sample data for testing the Opportunities Engine
// NOTE: This is mock-only data. Real data will be integrated from Firestore and external APIs later.

import { Opportunity } from '@/types/opportunities';

/**
 * Mock opportunities dataset covering various types
 * This dataset is used for testing matching logic before integrating real data sources
 */
export const MOCK_OPPORTUNITIES: Opportunity[] = [
  // ===== JOBS =====
  {
    id: 'mock-job-1',
    title: 'Software Engineer - Graduate Program',
    description: 'Join our graduate program and work on cutting-edge software projects. We provide mentorship and training in modern technologies including React, Node.js, and cloud platforms. Perfect for recent graduates looking to kickstart their tech career.',
    type: 'job',
    organization: 'TechCorp NZ',
    organizationUrl: 'https://example.com/techcorp',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    isRemote: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    tags: ['javascript', 'react', 'node.js', 'web-development', 'software-engineering', 'graduate'],
    category: 'Technology',
    url: 'https://example.com/jobs/software-engineer-graduate',
    requirements: ['Bachelor\'s degree in Computer Science or related field', 'Knowledge of JavaScript and web technologies', 'Strong problem-solving skills'],
    benefits: ['Competitive salary', 'Health insurance', 'Professional development budget', 'Flexible working hours'],
    salaryMin: 55000,
    salaryMax: 70000,
    currency: 'NZD',
    source: 'mock'
  },
  {
    id: 'mock-job-2',
    title: 'Marketing Coordinator',
    description: 'Help grow our brand through digital marketing, social media management, and content creation. Perfect for graduates with creative and analytical skills who want to make an impact in the marketing world.',
    type: 'job',
    organization: 'GrowthMarketing Ltd',
    organizationUrl: 'https://example.com/growthmarketing',
    location: 'Christchurch, New Zealand',
    city: 'Christchurch',
    country: 'New Zealand',
    isRemote: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    tags: ['marketing', 'digital-marketing', 'social-media', 'content-creation', 'analytics'],
    category: 'Marketing',
    url: 'https://example.com/jobs/marketing-coordinator',
    salaryMin: 48000,
    salaryMax: 60000,
    currency: 'NZD',
    source: 'mock'
  },
  
  // ===== INTERNSHIPS =====
  {
    id: 'mock-internship-1',
    title: 'Data Analyst Internship',
    description: 'Learn data analysis and business intelligence in a supportive environment. Work with real datasets and gain experience with Python, SQL, and visualization tools. Great opportunity for students interested in data science.',
    type: 'internship',
    organization: 'DataFlow Analytics',
    location: 'Wellington, New Zealand',
    city: 'Wellington',
    country: 'New Zealand',
    isRemote: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), // 240 days from now (6 months)
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['data-analysis', 'python', 'sql', 'business-intelligence', 'analytics', 'internship'],
    category: 'Data & Analytics',
    url: 'https://example.com/internships/data-analyst',
    salaryMin: 45000,
    salaryMax: 55000,
    currency: 'NZD',
    source: 'mock'
  },
  {
    id: 'mock-internship-2',
    title: 'Business Analyst Intern',
    description: 'Support business operations and process improvement initiatives. Learn about business analysis, project management, and stakeholder communication. Ideal for business or commerce students.',
    type: 'internship',
    organization: 'BusinessFirst Consulting',
    location: 'Hamilton, New Zealand',
    city: 'Hamilton',
    country: 'New Zealand',
    isRemote: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    tags: ['business-analysis', 'project-management', 'consulting', 'process-improvement'],
    category: 'Business',
    url: 'https://example.com/internships/business-analyst',
    salaryMin: 42000,
    salaryMax: 52000,
    currency: 'NZD',
    source: 'mock'
  },
  
  // ===== CLUBS =====
  {
    id: 'mock-club-1',
    title: 'Computer Science Society',
    description: 'Join our vibrant community of computer science enthusiasts! We organize coding workshops, hackathons, tech talks, and networking events. Open to all students interested in technology and programming.',
    type: 'club',
    organization: 'University Computer Science Society',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    tags: ['programming', 'computer-science', 'technology', 'networking', 'hackathons', 'workshops'],
    category: 'Technology',
    url: 'https://example.com/clubs/cs-society',
    benefits: ['Free workshops', 'Networking opportunities', 'Access to industry speakers', 'Hackathon participation'],
    source: 'mock'
  },
  {
    id: 'mock-club-2',
    title: 'Entrepreneurship Club',
    description: 'Connect with aspiring entrepreneurs and learn about starting your own business. We host pitch nights, startup workshops, and connect members with mentors from the business community.',
    type: 'club',
    organization: 'University Entrepreneurship Society',
    location: 'Wellington, New Zealand',
    city: 'Wellington',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    tags: ['entrepreneurship', 'startups', 'business', 'networking', 'mentorship'],
    category: 'Business',
    url: 'https://example.com/clubs/entrepreneurship',
    source: 'mock'
  },
  {
    id: 'mock-club-3',
    title: 'Data Science Student Association',
    description: 'For students passionate about data science, machine learning, and AI. We organize study groups, project showcases, and industry visits to data-driven companies.',
    type: 'club',
    organization: 'Data Science Student Association',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    tags: ['data-science', 'machine-learning', 'ai', 'python', 'analytics', 'statistics'],
    category: 'Data & Analytics',
    url: 'https://example.com/clubs/data-science',
    source: 'mock'
  },
  
  // ===== VOLUNTEERING =====
  {
    id: 'mock-volunteering-1',
    title: 'Community Tech Tutor',
    description: 'Help teach basic computer skills to community members. Volunteer at local community centers and help bridge the digital divide. Flexible hours, great for building communication and teaching skills.',
    type: 'volunteering',
    organization: 'Community Tech Initiative',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tags: ['teaching', 'community-service', 'technology', 'communication', 'volunteering'],
    category: 'Community Service',
    url: 'https://example.com/volunteer/tech-tutor',
    benefits: ['Community impact', 'Teaching experience', 'Flexible schedule', 'Reference letter available'],
    source: 'mock'
  },
  {
    id: 'mock-volunteering-2',
    title: 'Environmental Conservation Volunteer',
    description: 'Join our team in preserving local ecosystems. Activities include tree planting, beach cleanups, and wildlife monitoring. Perfect for students passionate about environmental sustainability.',
    type: 'volunteering',
    organization: 'Green Future NZ',
    location: 'Wellington, New Zealand',
    city: 'Wellington',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    tags: ['environment', 'conservation', 'sustainability', 'outdoor', 'community-service'],
    category: 'Environment',
    url: 'https://example.com/volunteer/environmental',
    source: 'mock'
  },
  
  // ===== EVENTS =====
  {
    id: 'mock-event-1',
    title: 'University Hackathon 2025',
    description: '48-hour hackathon for students to build innovative projects. Prizes, mentorship, and networking opportunities. Open to all skill levels. Food and drinks provided!',
    type: 'event',
    organization: 'University Tech Society',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    endDate: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000).toISOString(), // 47 days from now
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days from now
    tags: ['hackathon', 'programming', 'innovation', 'networking', 'competition'],
    category: 'Technology',
    url: 'https://example.com/events/hackathon-2025',
    benefits: ['Prizes for winners', 'Free food and drinks', 'Networking with industry professionals', 'Mentorship opportunities'],
    source: 'mock'
  },
  {
    id: 'mock-event-2',
    title: 'Career Fair 2025',
    description: 'Connect with top employers, learn about career opportunities, and attend workshops on resume writing and interview skills. Open to all students and recent graduates.',
    type: 'event',
    organization: 'University Career Services',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    tags: ['career', 'networking', 'job-fair', 'professional-development', 'recruitment'],
    category: 'Career Development',
    url: 'https://example.com/events/career-fair-2025',
    source: 'mock'
  },
  {
    id: 'mock-event-3',
    title: 'Data Science Workshop Series',
    description: 'Learn practical data science skills through hands-on workshops. Topics include Python for data analysis, machine learning basics, and data visualization. No prior experience required.',
    type: 'event',
    organization: 'Data Science Student Association',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
    startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(), // 27 days from now (weekly sessions)
    tags: ['data-science', 'python', 'machine-learning', 'workshop', 'education'],
    category: 'Education',
    url: 'https://example.com/events/data-science-workshop',
    source: 'mock'
  },
  
  // ===== SCHOLARSHIPS =====
  {
    id: 'mock-scholarship-1',
    title: 'Technology Excellence Scholarship',
    description: 'Awarded to outstanding students pursuing degrees in computer science, software engineering, or related technology fields. Covers tuition fees and provides a living allowance.',
    type: 'scholarship',
    organization: 'Tech Foundation NZ',
    location: 'New Zealand',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    tags: ['scholarship', 'technology', 'computer-science', 'financial-aid', 'academic-excellence'],
    category: 'Education',
    url: 'https://example.com/scholarships/tech-excellence',
    requirements: ['Enrolled in technology-related degree', 'Minimum GPA of 3.5', 'New Zealand citizen or permanent resident'],
    benefits: ['Full tuition coverage', 'Living allowance', 'Mentorship program'],
    source: 'mock'
  },
  {
    id: 'mock-scholarship-2',
    title: 'Women in STEM Scholarship',
    description: 'Supporting women pursuing careers in Science, Technology, Engineering, and Mathematics. Open to undergraduate and postgraduate students. Includes networking opportunities and mentorship.',
    type: 'scholarship',
    organization: 'Women in STEM Foundation',
    location: 'New Zealand',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago
    deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 days from now
    tags: ['scholarship', 'stem', 'women', 'diversity', 'financial-aid'],
    category: 'Education',
    url: 'https://example.com/scholarships/women-stem',
    requirements: ['Female student', 'Enrolled in STEM field', 'Demonstrated academic achievement'],
    benefits: ['Financial support', 'Mentorship program', 'Networking events'],
    source: 'mock'
  },
  {
    id: 'mock-scholarship-3',
    title: 'Community Leadership Scholarship',
    description: 'For students who demonstrate strong leadership and community involvement. Recognizes both academic achievement and commitment to making a positive impact in the community.',
    type: 'scholarship',
    organization: 'Community Leaders Foundation',
    location: 'New Zealand',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days from now
    tags: ['scholarship', 'leadership', 'community-service', 'financial-aid'],
    category: 'Education',
    url: 'https://example.com/scholarships/community-leadership',
    requirements: ['Demonstrated leadership experience', 'Community service involvement', 'Minimum GPA of 3.0'],
    benefits: ['Partial tuition coverage', 'Leadership development program'],
    source: 'mock'
  },
  
  // ===== ADDITIONAL OPPORTUNITIES =====
  {
    id: 'mock-job-3',
    title: 'Junior Developer - Full Stack',
    description: 'Work on both frontend and backend development using modern frameworks. Great opportunity for recent graduates to grow their technical skills in a supportive team environment.',
    type: 'job',
    organization: 'WebSolutions NZ',
    location: 'Dunedin, New Zealand',
    city: 'Dunedin',
    country: 'New Zealand',
    isRemote: true, // Remote position
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tags: ['full-stack', 'javascript', 'react', 'node.js', 'web-development'],
    category: 'Technology',
    url: 'https://example.com/jobs/junior-developer',
    salaryMin: 50000,
    salaryMax: 65000,
    currency: 'NZD',
    source: 'mock'
  },
  {
    id: 'mock-volunteering-3',
    title: 'Youth Mentor',
    description: 'Mentor high school students interested in technology and programming. Help guide the next generation of tech talent through workshops and one-on-one mentoring sessions.',
    type: 'volunteering',
    organization: 'Tech Youth Initiative',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago
    tags: ['mentoring', 'youth', 'technology', 'teaching', 'volunteering'],
    category: 'Education',
    url: 'https://example.com/volunteer/youth-mentor',
    source: 'mock'
  },
  {
    id: 'mock-event-4',
    title: 'Startup Pitch Night',
    description: 'Watch student entrepreneurs pitch their startup ideas to a panel of judges and investors. Network with founders, investors, and fellow students interested in entrepreneurship.',
    type: 'event',
    organization: 'Entrepreneurship Club',
    location: 'Auckland, New Zealand',
    city: 'Auckland',
    country: 'New Zealand',
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
    startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    tags: ['startup', 'entrepreneurship', 'pitching', 'networking', 'innovation'],
    category: 'Business',
    url: 'https://example.com/events/startup-pitch-night',
    source: 'mock'
  }
];

/**
 * Get all mock opportunities
 * NOTE: In production, this will be replaced with Firestore queries and external API calls
 */
export function getMockOpportunities(): Opportunity[] {
  return [...MOCK_OPPORTUNITIES];
}

/**
 * Get mock opportunities by type
 */
export function getMockOpportunitiesByType(type: Opportunity['type']): Opportunity[] {
  return MOCK_OPPORTUNITIES.filter(opp => opp.type === type);
}

