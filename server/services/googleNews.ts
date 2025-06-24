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
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('Google API key not configured');
      }

      const searchQuery = this.buildSearchQuery(query, sources || this.searchSources);
      console.log(`Making Google Custom Search request with query: ${searchQuery}`);
      
      // Use Google Custom Search API
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: 'c6a59edd379c64323', // Google CSE ID provided
          q: searchQuery,
          dateRestrict: 'd7', // Last 7 days
          num: 10,
          sort: 'date',
          lr: 'lang_en'
        }
      });

      console.log(`Google API response status: ${response.status}`);
      console.log(`Response data keys: ${Object.keys(response.data)}`);

      if (!response.data.items) {
        console.log('No items found in response');
        return [];
      }

      const results = response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
        source: new URL(item.link).hostname.replace('www.', ''),
        date: item.pagemap?.metatags?.[0]?.['article:published_time'] || 
              item.pagemap?.metatags?.[0]?.date || 
              new Date().toISOString()
      }));

      console.log(`Processed ${results.length} news results`);
      return results;
    } catch (error) {
      console.error('Error searching news:', error);
      // Fallback to RSS feeds or other news sources if API fails
      return [];
    }
  }

  private buildSearchQuery(query: string, sources: string[]): string {
    // For Google Custom Search, we don't need site: prefixes in the query
    // The CSE is already configured with specific sources
    return query;
  }

  async searchPersonNews(personId: number): Promise<NewsResult[]> {
    try {
      console.log(`Fetching person with ID: ${personId}`);
      const person = await storage.getPerson(personId);
      if (!person) {
        throw new Error('Person not found');
      }

      // Build search query with person name and company
      let searchTerms = `"${person.firstName} ${person.lastName}"`;
      
      if (person.account?.name) {
        searchTerms += ` "${person.account.name}"`;
      }
      
      // Add professional context keywords
      if (person.title) {
        searchTerms += ` "${person.title}"`;
      }

      console.log(`Search terms: ${searchTerms}`);
      const results = await this.searchNews(searchTerms);
      console.log(`Google Custom Search returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Error searching person news:', error);
      throw error; // Re-throw to preserve error details
    }
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
