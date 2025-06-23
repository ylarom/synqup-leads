import OpenAI from "openai";
import { PersonWithAccount, TriggerWithDetails } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface MessageDraft {
  subject: string;
  content: string;
  tone: string;
  media: string;
}

export async function generateMessage(
  person: PersonWithAccount,
  trigger: TriggerWithDetails
): Promise<MessageDraft> {
  try {
    const personInfo = `
Name: ${person.firstName} ${person.lastName}
Title: ${person.title || 'N/A'}
Company: ${person.account?.name || 'N/A'}
Industry: ${person.account?.field || 'N/A'}
Email: ${person.email || 'N/A'}
LinkedIn: ${person.linkedin || 'N/A'}
Twitter: ${person.twitter || 'N/A'}
Details: ${person.details || 'N/A'}
Description: ${person.description || 'N/A'}
    `.trim();

    const triggerInfo = `
Type: ${trigger.triggerType}
Content: ${trigger.content}
Source: ${trigger.media || 'N/A'}
URL: ${trigger.url || 'N/A'}
    `.trim();

    const prompt = `
You are an expert at writing personalized outreach messages. Create a professional, engaging message based on the following information:

PERSON INFORMATION:
${personInfo}

TRIGGER INFORMATION:
${triggerInfo}

Please generate a personalized message that:
1. References the trigger naturally and meaningfully
2. Shows genuine interest in their work/company
3. Is professional but warm in tone
4. Includes a clear but soft call-to-action
5. Is appropriate for the trigger type and context

Consider the trigger type:
- news: Reference the news item and congratulate or comment thoughtfully
- birthday: Send birthday wishes and use it as a reason to reconnect
- anniversary: Acknowledge the milestone and express admiration
- social_post: Reference their post and engage with the content

Determine the most appropriate communication medium (email, linkedin, twitter) based on:
- Available contact information
- Trigger source and context
- Professional appropriateness

Return your response in JSON format with these fields:
- subject: A compelling subject line (for email/LinkedIn)
- content: The full message content
- tone: Brief description of the tone used (e.g., "professional and congratulatory")
- media: Recommended medium (email, linkedin, twitter)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional outreach specialist who writes personalized, engaging messages that build genuine business relationships."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      subject: result.subject || `Following up on ${trigger.triggerType}`,
      content: result.content || "Hello, I wanted to reach out regarding recent developments.",
      tone: result.tone || "professional",
      media: result.media || "email",
    };
  } catch (error) {
    console.error("Error generating message with OpenAI:", error);
    throw new Error("Failed to generate message: " + (error as Error).message);
  }
}

export async function improveDraftMessage(
  currentContent: string,
  feedback: string,
  person: PersonWithAccount
): Promise<string> {
  try {
    const prompt = `
Please improve the following message based on the feedback provided:

CURRENT MESSAGE:
${currentContent}

FEEDBACK:
${feedback}

PERSON CONTEXT:
Name: ${person.firstName} ${person.lastName}
Title: ${person.title || 'N/A'}
Company: ${person.account?.name || 'N/A'}

Please rewrite the message to address the feedback while maintaining:
1. Personalization and relevance
2. Professional tone
3. Clear structure and flow
4. Appropriate length

Return only the improved message content, no additional formatting or explanations.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in business communication. Improve messages based on specific feedback while maintaining professionalism and personalization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.choices[0].message.content || currentContent;
  } catch (error) {
    console.error("Error improving message with OpenAI:", error);
    throw new Error("Failed to improve message: " + (error as Error).message);
  }
}
