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
  private readonly CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

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
    
    // Generate insights based on user profile
    if (userProfile.degree?.toLowerCase().includes('computer') || 
        userProfile.degree?.toLowerCase().includes('software') ||
        userProfile.degree?.toLowerCase().includes('cs')) {
      
      insights.push({
        id: '1',
        title: 'AI and Machine Learning Skills in High Demand for Software Engineers',
        summary: 'Companies are actively seeking graduates with AI and machine learning experience. Entry-level positions with AI skills are offering 15-20% higher salaries compared to traditional software engineering roles.',
        category: 'Technology Trends',
        relevance: 95,
        timestamp: this.formatTimestamp(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        expandedDetails: 'The demand for AI skills spans across multiple industries including healthcare, finance, and automotive. Companies like Google, Microsoft, and startups are prioritizing candidates with practical experience in machine learning frameworks such as TensorFlow and PyTorch. Salary ranges for AI-focused software engineers typically start at $85K-$110K, significantly higher than the $70K-$90K range for traditional entry-level positions.'
      });

      insights.push({
        id: '2',
        title: 'Remote Work Continues to Shape Software Development Industry',
        summary: '85% of technology companies now offer remote or hybrid work arrangements. This shift has expanded job opportunities beyond traditional tech hubs, allowing developers to work for companies worldwide.',
        category: 'Workplace Evolution',
        relevance: 88,
        timestamp: this.formatTimestamp(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        expandedDetails: 'Remote work has fundamentally changed how software teams collaborate. Companies are investing heavily in remote collaboration tools and asynchronous communication practices. This trend has also led to increased competition for talent, as developers can now work for companies regardless of geographic location. Major tech companies like Twitter, Shopify, and Coinbase have announced permanent remote work policies.'
      });
    }

    if (userProfile.degree?.toLowerCase().includes('business') || 
        userProfile.degree?.toLowerCase().includes('finance') ||
        userProfile.degree?.toLowerCase().includes('economics')) {
      
      insights.push({
        id: '3',
        title: 'Fintech Revolution Creating New Career Pathways for Business Graduates',
        summary: 'Traditional finance roles are evolving with technology integration. Digital banking, cryptocurrency, and blockchain expertise are becoming highly valued skills in the financial sector.',
        category: 'Financial Technology',
        relevance: 92,
        timestamp: this.formatTimestamp(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        expandedDetails: 'The fintech sector has seen exponential growth, with investment reaching $91.5 billion globally in 2023. Companies are seeking graduates who understand both traditional finance principles and modern technology. Roles in digital payments, regulatory technology, and sustainable finance are particularly in demand. Entry-level positions in fintech typically offer salaries 20-30% higher than traditional banking roles.'
      });
    }

    if (userProfile.interests?.toLowerCase().includes('ai') || 
        userProfile.interests?.toLowerCase().includes('machine learning')) {
      
      insights.push({
        id: '4',
        title: 'Machine Learning Engineers: Highest-Growth Role in Technology Sector',
        summary: 'Demand for machine learning engineers has increased 300% in the past year. The role requires a combination of software engineering skills and statistical knowledge, with salaries ranging from $80K to $150K for entry-level positions.',
        category: 'AI & Machine Learning',
        relevance: 98,
        timestamp: this.formatTimestamp(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        expandedDetails: 'Machine learning engineers bridge the gap between data science and software engineering. They are responsible for building and deploying ML models at scale. The role requires proficiency in Python, knowledge of ML frameworks like TensorFlow and PyTorch, and understanding of cloud platforms like AWS and Google Cloud. Companies across all industries are investing in ML capabilities, creating diverse career opportunities.'
      });
    }

    // Add general career advice
    insights.push({
      id: '5',
      title: 'Networking and Professional Development Critical for Career Success',
      summary: '70% of professional opportunities are discovered through networking rather than traditional job applications. Building relationships with industry professionals and participating in relevant communities significantly increases career prospects.',
      category: 'Career Development',
      relevance: 85,
      timestamp: this.formatTimestamp(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      expandedDetails: 'Effective networking involves both online and offline strategies. LinkedIn has become the primary platform for professional networking, with 90% of recruiters using it to find candidates. Industry-specific events, conferences, and meetups provide valuable face-to-face networking opportunities. Building a strong personal brand through content creation and thought leadership can also significantly enhance career visibility.'
    });

    // Return top 4 most relevant insights
    return insights
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 4);
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
