import cron from 'node-cron';
import { googleNewsService } from './googleNews';
import { emailService } from './emailSender';
import { storage } from '../storage';
import { generateMessage } from './openai';

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  start(): void {
    console.log('Starting CRM automation scheduler...');

    // MessageBrain - Process new triggers and generate draft messages
    const messageBrainJob = cron.schedule('0 * * * *', async () => {
      await this.runMessageBrain();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    // GoogleNewsTrigger - Scan for news mentions
    const googleNewsJob = cron.schedule('15 * * * *', async () => {
      await this.runGoogleNewsTrigger();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    // TriggersScanner - Process new triggers (runs after MessageBrain)
    const triggersJob = cron.schedule('30 * * * *', async () => {
      await this.runTriggersScanner();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    // EmailSender - Send pending email messages
    const emailJob = cron.schedule('45 * * * *', async () => {
      await this.runEmailSender();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    // Store jobs for management
    this.jobs.set('messageBrain', messageBrainJob);
    this.jobs.set('googleNews', googleNewsJob);
    this.jobs.set('triggersScanner', triggersJob);
    this.jobs.set('emailSender', emailJob);

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started ${name} job`);
    });

    console.log('All scheduled jobs started successfully');
  }

  stop(): void {
    console.log('Stopping all scheduled jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    console.log('All scheduled jobs stopped');
  }

  async runMessageBrain(): Promise<void> {
    try {
      console.log('Running MessageBrain process...');
      
      const newTriggers = await storage.getTriggersByStatus('new');
      console.log(`Found ${newTriggers.length} new triggers to process`);

      for (const trigger of newTriggers) {
        try {
          // Skip if no person associated (account-level triggers need manual review)
          if (!trigger.personId || !trigger.person) {
            console.log(`Skipping trigger ${trigger.id} - no person associated`);
            continue;
          }

          // Generate message using AI
          console.log(`Generating message for trigger ${trigger.id} and person ${trigger.person.firstName} ${trigger.person.lastName}`);
          
          const messageDraft = await generateMessage(trigger.person, trigger);
          
          // Determine the contact address based on preferred medium
          let address = '';
          switch (messageDraft.media.toLowerCase()) {
            case 'email':
              address = trigger.person.email || '';
              break;
            case 'linkedin':
              address = trigger.person.linkedin || '';
              break;
            case 'twitter':
              address = trigger.person.twitter || '';
              break;
            default:
              address = trigger.person.email || trigger.person.linkedin || '';
              break;
          }

          if (!address) {
            console.log(`No contact method available for person ${trigger.person.firstName} ${trigger.person.lastName}`);
            continue;
          }

          // Create draft message
          await storage.createMessage({
            conversationId: null, // Will be created when needed
            personId: trigger.personId,
            triggerId: trigger.id,
            media: messageDraft.media,
            address: address,
            from: 'us',
            subject: messageDraft.subject,
            content: messageDraft.content,
            status: 'draft'
          });

          // Mark trigger as handled
          await storage.updateTrigger(trigger.id, { status: 'handled' });
          
          console.log(`Created draft message for ${trigger.person.firstName} ${trigger.person.lastName}`);
          
        } catch (error) {
          console.error(`Error processing trigger ${trigger.id}:`, error);
        }
      }

      console.log('MessageBrain process completed');
    } catch (error) {
      console.error('Error in MessageBrain process:', error);
    }
  }

  async runGoogleNewsTrigger(): Promise<void> {
    try {
      console.log('Running GoogleNewsTrigger process...');
      await googleNewsService.runFullScan();
      console.log('GoogleNewsTrigger process completed');
    } catch (error) {
      console.error('Error in GoogleNewsTrigger process:', error);
    }
  }

  async runTriggersScanner(): Promise<void> {
    try {
      console.log('Running TriggersScanner process...');
      
      // This process runs after MessageBrain to handle any remaining new triggers
      // For now, it's mainly ensuring no triggers are left unprocessed
      const newTriggers = await storage.getTriggersByStatus('new');
      
      if (newTriggers.length > 0) {
        console.log(`Found ${newTriggers.length} unprocessed triggers, running MessageBrain again...`);
        await this.runMessageBrain();
      } else {
        console.log('No unprocessed triggers found');
      }

      console.log('TriggersScanner process completed');
    } catch (error) {
      console.error('Error in TriggersScanner process:', error);
    }
  }

  async runEmailSender(): Promise<void> {
    try {
      console.log('Running EmailSender process...');
      await emailService.sendPendingEmails();
      console.log('EmailSender process completed');
    } catch (error) {
      console.error('Error in EmailSender process:', error);
    }
  }

  // Manual trigger methods for testing/admin
  async runJobManually(jobName: string): Promise<void> {
    switch (jobName) {
      case 'messageBrain':
        await this.runMessageBrain();
        break;
      case 'googleNews':
        await this.runGoogleNewsTrigger();
        break;
      case 'triggersScanner':
        await this.runTriggersScanner();
        break;
      case 'emailSender':
        await this.runEmailSender();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.jobs.forEach((job, name) => {
      status[name] = job.running || false;
    });

    return status;
  }
}

export const schedulerService = new SchedulerService();

// Auto-start scheduler if not in test environment
if (process.env.NODE_ENV !== 'test') {
  schedulerService.start();
}
