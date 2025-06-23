import axios from 'axios';
import { storage } from '../storage';
import { InsertTrigger } from '@shared/schema';

interface NewsResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
}

export class GoogleNewsService {
  private searchSources = [
    'site:forbes.com',
    'site:bloomberg.com', 
    'site:techcrunch.com',
    'site:reuters.com',
    'site:wsj.com',
    'site:cnbc.com'
  ];

  async searchNews(query: string, sources?: string[]): Promise<NewsResult[]> {
    try {
      // Use Google Custom Search API or News API
      const apiKey = process.env.GOOGLE_NEWS_API_KEY || process.env.NEWS_API_KEY || "default_key";
      const searchQuery = this.buildSearchQuery(query, sources || this.searchSources);
      
      // Using News API as fallback since it's more commonly available
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: searchQuery,
          domains: 'forbes.com,bloomberg.com,techcrunch.com,reuters.com,wsj.com,cnbc.com',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: apiKey
        }
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        link: article.url,
        snippet: article.description || '',
        source: article.source.name,
        date: article.publishedAt
      }));
    } catch (error) {
      console.error('Error searching news:', error);
      // Fallback to RSS feeds or other news sources if API fails
      return [];
    }
  }

  private buildSearchQuery(query: string, sources: string[]): string {
    // Remove common corporate suffixes for better search results
    const cleanQuery = query
      .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited)\b\.?/gi, '')
      .trim();
    
    return `"${cleanQuery}"`;
  }

  async scanAccountNews(): Promise<void> {
    try {
      console.log('Starting account news scan...');
      const accounts = await storage.getAccounts(100, 0); // Get first 100 accounts
      
      for (const account of accounts) {
        try {
          console.log(`Scanning news for account: ${account.name}`);
          const newsResults = await this.searchNews(account.name);
          
          for (const news of newsResults) {
            // Check if we already have this trigger
            const existingTriggers = await storage.getTriggers(10, 0);
            const exists = existingTriggers.some(t => 
              t.url === news.link || 
              (t.content.includes(news.title) && t.accountId === account.id)
            );
            
            if (!exists) {
              const trigger: InsertTrigger = {
                accountId: account.id,
                personId: null, // Account-level trigger
                media: news.source,
                url: news.link,
                content: `${news.title}\n\n${news.snippet}`,
                triggerType: 'news',
                status: 'new'
              };
              
              await storage.createTrigger(trigger);
              console.log(`Created news trigger for ${account.name}: ${news.title}`);
            }
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing account ${account.name}:`, error);
        }
      }
      
      console.log('Account news scan completed');
    } catch (error) {
      console.error('Error in account news scan:', error);
    }
  }

  async scanPeopleNews(): Promise<void> {
    try {
      console.log('Starting people news scan...');
      const people = await storage.getPeople(100, 0); // Get first 100 people
      
      for (const person of people) {
        try {
          const fullName = `${person.firstName} ${person.lastName}`;
          console.log(`Scanning news for person: ${fullName}`);
          
          // Search for person + company combination for better results
          const searchQueries = [
            fullName,
            person.account ? `"${fullName}" "${person.account.name}"` : fullName
          ];
          
          for (const query of searchQueries) {
            const newsResults = await this.searchNews(query);
            
            for (const news of newsResults) {
              // Check if we already have this trigger
              const existingTriggers = await storage.getTriggers(10, 0);
              const exists = existingTriggers.some(t => 
                t.url === news.link || 
                (t.content.includes(news.title) && t.personId === person.id)
              );
              
              if (!exists) {
                const trigger: InsertTrigger = {
                  accountId: person.accountId,
                  personId: person.id,
                  media: news.source,
                  url: news.link,
                  content: `${news.title}\n\n${news.snippet}`,
                  triggerType: 'news',
                  status: 'new'
                };
                
                await storage.createTrigger(trigger);
                console.log(`Created news trigger for ${fullName}: ${news.title}`);
              }
            }
            
            // Add delay between queries
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Add delay between people to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing person ${person.firstName} ${person.lastName}:`, error);
        }
      }
      
      console.log('People news scan completed');
    } catch (error) {
      console.error('Error in people news scan:', error);
    }
  }

  async scanBirthdays(): Promise<void> {
    try {
      console.log('Scanning for birthdays...');
      // This would typically integrate with a calendar system or CRM data
      // For now, we'll create a basic implementation that checks if today matches stored birthday data
      
      const today = new Date();
      const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const people = await storage.getPeople(1000, 0); // Get all people
      
      for (const person of people) {
        // Check if person details contain birthday information
        if (person.details && person.details.toLowerCase().includes('birthday')) {
          // Simple birthday matching - in production, you'd have dedicated birthday fields
          const birthdayMatch = person.details.match(/birthday[:\s]*(\d{1,2}[-\/]\d{1,2})/i);
          
          if (birthdayMatch && birthdayMatch[1].replace('/', '-') === todayStr) {
            // Check if we already created a birthday trigger recently
            const recentTriggers = await storage.getTriggers(50, 0);
            const hasRecentBirthdayTrigger = recentTriggers.some(t => 
              t.personId === person.id && 
              t.triggerType === 'birthday' && 
              t.createdAt && 
              new Date(t.createdAt).toDateString() === today.toDateString()
            );
            
            if (!hasRecentBirthdayTrigger) {
              const trigger: InsertTrigger = {
                accountId: person.accountId,
                personId: person.id,
                media: 'system',
                url: null,
                content: `Birthday reminder for ${person.firstName} ${person.lastName}`,
                triggerType: 'birthday',
                status: 'new'
              };
              
              await storage.createTrigger(trigger);
              console.log(`Created birthday trigger for ${person.firstName} ${person.lastName}`);
            }
          }
        }
      }
      
      console.log('Birthday scan completed');
    } catch (error) {
      console.error('Error in birthday scan:', error);
    }
  }

  async runFullScan(): Promise<void> {
    console.log('Starting full news and trigger scan...');
    
    try {
      await Promise.all([
        this.scanAccountNews(),
        this.scanPeopleNews(),
        this.scanBirthdays()
      ]);
      
      console.log('Full scan completed successfully');
    } catch (error) {
      console.error('Error in full scan:', error);
    }
  }
}

export const googleNewsService = new GoogleNewsService();
