interface IndustryInsight {
  id: string;
  title: string;
  summary: string;
  category: string;
  relevance: number;
  timestamp: string;
  expandedDetails?: string;
}

interface UserProfile {
  degree?: string;
  interests?: string;
  city?: string;
  country?: string;
  gpa?: number;
}

class AIInsightsService {
  private cache: Map<string, { insights: IndustryInsight[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  async generateInsights(userProfile: UserProfile): Promise<IndustryInsight[]> {
    const cacheKey = this.generateCacheKey(userProfile);
    const cached = this.cache.get(cacheKey);

    // Check if we have valid cached insights
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.insights;
    }

    try {
      const insights = await this.callOpenAI(userProfile);
      this.cache.set(cacheKey, { insights, timestamp: Date.now() });
      return insights;
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Return fallback insights if AI fails
      return this.getFallbackInsights(userProfile);
    }
  }

  private generateCacheKey(userProfile: UserProfile): string {
    const key = `${userProfile.degree || 'unknown'}_${userProfile.interests || 'none'}_${userProfile.city || 'unknown'}`;
    return key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private async callOpenAI(userProfile: UserProfile): Promise<IndustryInsight[]> {
    // This would be replaced with actual OpenAI API call
    // For now, we'll simulate the AI response with intelligent mock data
    
    const prompt = this.buildPrompt(userProfile);
    const mockResponse = this.simulateAIResponse(prompt, userProfile);
    
    return mockResponse;
  }

  private buildPrompt(userProfile: UserProfile): string {
    let prompt = `Generate 4 professional industry insights for a student with the following profile:\n`;
    
    if (userProfile.degree) {
      prompt += `- Degree: ${userProfile.degree}\n`;
    }
    
    if (userProfile.interests) {
      prompt += `- Interests: ${userProfile.interests}\n`;
    }
    
    if (userProfile.city && userProfile.country) {
      prompt += `- Location: ${userProfile.city}, ${userProfile.country}\n`;
    }
    
    prompt += `\nGenerate insights that are:\n`;
    prompt += `- Professional in tone (no emojis)\n`;
    prompt += `- Based on current industry trends\n`;
    prompt += `- Relevant to their field of study\n`;
    prompt += `- Actionable and informative\n`;
    prompt += `- Include specific statistics when possible\n`;
    
    return prompt;
  }

  private simulateAIResponse(prompt: string, userProfile: UserProfile): IndustryInsight[] {
    const insights: IndustryInsight[] = [];
    const now = new Date();
    const randomSeed = Date.now() % 1000; // Use current time as seed for variety
    
    // Generate insights based on user profile with more variety
    if (userProfile.degree?.toLowerCase().includes('computer') || 
        userProfile.degree?.toLowerCase().includes('software') ||
        userProfile.degree?.toLowerCase().includes('cs')) {
      
      const techInsights = [
        {
          id: 'tech_1',
          title: 'AI and Machine Learning Skills in High Demand for Software Engineers',
          summary: 'Companies are actively seeking graduates with AI and machine learning experience. Entry-level positions with AI skills are offering 15-20% higher salaries compared to traditional software engineering roles.',
          category: 'Technology Trends',
          relevance: 95,
          expandedDetails: 'The demand for AI skills spans across multiple industries including healthcare, finance, and automotive. Companies like Google, Microsoft, and startups are prioritizing candidates with practical experience in machine learning frameworks such as TensorFlow and PyTorch. Salary ranges for AI-focused software engineers typically start at $85K-$110K, significantly higher than the $70K-$90K range for traditional entry-level positions.'
        },
        {
          id: 'tech_2',
          title: 'Cybersecurity Skills Gap Creates Opportunities for New Graduates',
          summary: 'The cybersecurity field faces a shortage of 3.5 million professionals globally. Entry-level cybersecurity roles are offering competitive salaries starting at $75K-$95K with strong growth potential.',
          category: 'Cybersecurity',
          relevance: 92,
          expandedDetails: 'With increasing cyber threats, organizations are investing heavily in security infrastructure. Roles in threat analysis, security engineering, and compliance are particularly in demand. Certifications like CISSP, CEH, and CompTIA Security+ can significantly boost career prospects.'
        },
        {
          id: 'tech_3',
          title: 'Cloud Computing Expertise Drives Career Advancement',
          summary: 'Cloud adoption has accelerated by 40% in the past year. Professionals with AWS, Azure, or Google Cloud certifications are seeing 25% faster career progression.',
          category: 'Cloud Technology',
          relevance: 88,
          expandedDetails: 'Cloud computing skills are essential across all industries. Companies are migrating to cloud platforms for scalability and cost efficiency. Skills in containerization (Docker, Kubernetes), serverless computing, and cloud security are highly valued.'
        },
        {
          id: 'tech_4',
          title: 'Remote Work Continues to Shape Software Development Industry',
          summary: '85% of technology companies now offer remote or hybrid work arrangements. This shift has expanded job opportunities beyond traditional tech hubs, allowing developers to work for companies worldwide.',
          category: 'Workplace Evolution',
          relevance: 85,
          expandedDetails: 'Remote work has fundamentally changed how software teams collaborate. Companies are investing heavily in remote collaboration tools and asynchronous communication practices. This trend has also led to increased competition for talent, as developers can now work for companies regardless of geographic location.'
        }
      ];
      
      // Select 2-3 random tech insights
      const selectedTechInsights = this.shuffleArray(techInsights).slice(0, 2 + (randomSeed % 2));
      insights.push(...selectedTechInsights.map(insight => ({
        ...insight,
        timestamp: this.formatTimestamp(now.getTime() - (randomSeed % 24) * 60 * 60 * 1000)
      })));
    }

    if (userProfile.degree?.toLowerCase().includes('business') || 
        userProfile.degree?.toLowerCase().includes('finance') ||
        userProfile.degree?.toLowerCase().includes('economics')) {
      
      const businessInsights = [
        {
          id: 'biz_1',
          title: 'Fintech Revolution Creating New Career Pathways for Business Graduates',
          summary: 'Traditional finance roles are evolving with technology integration. Digital banking, cryptocurrency, and blockchain expertise are becoming highly valued skills in the financial sector.',
          category: 'Financial Technology',
          relevance: 92,
          expandedDetails: 'The fintech sector has seen exponential growth, with investment reaching $91.5 billion globally in 2023. Companies are seeking graduates who understand both traditional finance principles and modern technology. Roles in digital payments, regulatory technology, and sustainable finance are particularly in demand.'
        },
        {
          id: 'biz_2',
          title: 'Data Analytics Skills Essential for Modern Business Roles',
          summary: 'Business graduates with data analytics skills are earning 30% more than their peers. Companies need professionals who can interpret data to drive strategic decisions.',
          category: 'Data Analytics',
          relevance: 90,
          expandedDetails: 'Data-driven decision making is becoming the standard across all industries. Skills in Excel, SQL, Python, and visualization tools like Tableau are highly sought after. Business analysts with technical skills can expect salaries starting at $65K-$85K.'
        },
        {
          id: 'biz_3',
          title: 'Sustainability and ESG Roles Growing Rapidly',
          summary: 'Environmental, Social, and Governance (ESG) positions have increased by 150% in the past two years. Companies are hiring sustainability analysts and ESG specialists.',
          category: 'Sustainability',
          relevance: 87,
          expandedDetails: 'ESG reporting and sustainability initiatives are becoming mandatory for many companies. Roles in carbon accounting, sustainable finance, and corporate social responsibility are emerging as new career paths for business graduates.'
        }
      ];
      
      const selectedBusinessInsights = this.shuffleArray(businessInsights).slice(0, 2);
      insights.push(...selectedBusinessInsights.map(insight => ({
        ...insight,
        timestamp: this.formatTimestamp(now.getTime() - (randomSeed % 12) * 60 * 60 * 1000)
      })));
    }

    if (userProfile.interests?.toLowerCase().includes('ai') || 
        userProfile.interests?.toLowerCase().includes('machine learning')) {
      
      insights.push({
        id: 'ai_1',
        title: 'Machine Learning Engineers: Highest-Growth Role in Technology Sector',
        summary: 'Demand for machine learning engineers has increased 300% in the past year. The role requires a combination of software engineering skills and statistical knowledge, with salaries ranging from $80K to $150K for entry-level positions.',
        category: 'AI & Machine Learning',
        relevance: 98,
        timestamp: this.formatTimestamp(now.getTime() - (randomSeed % 8) * 60 * 60 * 1000),
        expandedDetails: 'Machine learning engineers bridge the gap between data science and software engineering. They are responsible for building and deploying ML models at scale. The role requires proficiency in Python, knowledge of ML frameworks like TensorFlow and PyTorch, and understanding of cloud platforms like AWS and Google Cloud.'
      });
    }

    // Add general career advice with variety
    const generalInsights = [
      {
        id: 'gen_1',
        title: 'Networking and Professional Development Critical for Career Success',
        summary: '70% of professional opportunities are discovered through networking rather than traditional job applications. Building relationships with industry professionals significantly increases career prospects.',
        category: 'Career Development',
        relevance: 85,
        expandedDetails: 'Effective networking involves both online and offline strategies. LinkedIn has become the primary platform for professional networking, with 90% of recruiters using it to find candidates. Industry-specific events, conferences, and meetups provide valuable face-to-face networking opportunities.'
      },
      {
        id: 'gen_2',
        title: 'Soft Skills Increasingly Valued by Employers',
        summary: 'Communication, problem-solving, and adaptability are now considered more important than technical skills alone. Companies are prioritizing candidates who can work effectively in diverse teams.',
        category: 'Soft Skills',
        relevance: 82,
        expandedDetails: 'The modern workplace requires strong interpersonal skills alongside technical expertise. Employers value candidates who can communicate complex ideas clearly, collaborate across departments, and adapt to changing business needs.'
      },
      {
        id: 'gen_3',
        title: 'Continuous Learning Essential for Career Longevity',
        summary: 'Professionals who engage in continuous learning earn 25% more over their careers. Online courses, certifications, and micro-credentials are becoming standard requirements.',
        category: 'Learning & Development',
        relevance: 80,
        expandedDetails: 'The half-life of technical skills is decreasing rapidly. Professionals need to commit to lifelong learning through online platforms, industry certifications, and hands-on projects to stay competitive.'
      }
    ];
    
    const selectedGeneralInsight = this.shuffleArray(generalInsights)[0];
    insights.push({
      ...selectedGeneralInsight,
      timestamp: this.formatTimestamp(now.getTime() - (randomSeed % 48) * 60 * 60 * 1000)
    });

    // Return top 4 most relevant insights
    return insights
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 4);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getFallbackInsights(userProfile: UserProfile): IndustryInsight[] {
    // Fallback insights when AI fails
    return [
      {
        id: 'fallback_1',
        title: 'Industry Trends in Technology and Innovation',
        summary: 'Stay updated with the latest developments in your field through industry publications and professional networks.',
        category: 'Industry Overview',
        relevance: 75,
        timestamp: this.formatTimestamp(Date.now())
      },
      {
        id: 'fallback_2',
        title: 'Professional Development Opportunities',
        summary: 'Consider joining professional organizations and attending industry conferences to expand your network.',
        category: 'Career Growth',
        relevance: 70,
        timestamp: this.formatTimestamp(Date.now())
      }
    ];
  }

  private formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60 * 60 * 1000) { // Less than 1 hour
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 24 * 60 * 60 * 1000) { // Less than 1 day
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  // Method to clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Method to force refresh insights
  async refreshInsights(userProfile: UserProfile): Promise<IndustryInsight[]> {
    this.cache.delete(this.generateCacheKey(userProfile));
    return this.generateInsights(userProfile);
  }
}

export const aiInsightsService = new AIInsightsService();
export type { IndustryInsight, UserProfile };
