import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TicketsService } from './tickets.service';
import { CategoryService } from './category.service';
import { UpdateTicketStatusDTO } from '../dto/ticket.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
    private readonly categoryService: CategoryService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateTicketSummary(ticketId: string, userId: string, userRole: string): Promise<{ success: boolean; status_code: number; message: string; data?: any }> {
    try {
      // Use the service to fetch ticket details with access control check
      const ticketRes = await this.ticketsService.getTicketById(ticketId, userId, userRole);
      if (!ticketRes.success) {
        return ticketRes;
      }

      const ticket = ticketRes.data;

      // Extract assigned agent name if available
      const assignedAgent = ticket.assigned_to && typeof ticket.assigned_to === 'object' && ticket.assigned_to.name
        ? ticket.assigned_to.name
        : null;

      // Initialize Gemini Model
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        Please provide a concise summary for the following support ticket:
        Ticket Number: ${ticket.ticket_number}
        Title: ${ticket.title}
        Description: ${ticket.description}
        Status: ${ticket.status}
        ${assignedAgent ? `Assigned Agent: ${assignedAgent}` : ''}
        
        The summary should briefly explain the main issue and the current state. ${assignedAgent ? `It should also mention that the ticket is assigned to the agent, ${assignedAgent}.` : ''} Keep it under 3-4 sentences.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return {
        success: true,
        status_code: 200,
        message: 'Summary generated successfully',
        data: { summary },
      };
    } catch (error) {
      this.logger.error('Error generating ticket summary', error);
      return { success: false, status_code: 500, message: 'Failed to generate summary' };
    }
  }

  async autoCategorizeTicket(ticketId: string, userId: string, userRole: string): Promise<{ success: boolean; status_code: number; message: string; data?: any }> {
    try {
      // 1. Fetch ticket details
      const ticketRes = await this.ticketsService.getTicketById(ticketId, userId, userRole);
      if (!ticketRes.success) {
        return ticketRes;
      }
      const ticket = ticketRes.data;

      // 2. Fetch all available categories
      const categories = await this.categoryService.findAll();
      if (!categories || categories.length === 0) {
        return { success: false, status_code: 400, message: 'No categories available in the system' };
      }

      const categoryOptions = categories.map(c => `- ${c.name} (ID: ${c._id || c.id})`).join('\n');

      // 3. Prepare Prompt
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        You are an AI assistant for a support ticketing system. 
        Your task is to categorize a support ticket into exactly one of the available categories based on its title and description.
        
        Ticket Title: ${ticket.title}
        Ticket Description: ${ticket.description}
        
        Available Categories:
        ${categoryOptions}
        
        Please return ONLY the exact ID of the best matching category. Do not include any other text, explanation, or formatting. If none of the categories seem to fit well, pick the one that is closest.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestedCategoryId = response.text().trim();

      // Validate if the suggested ID actually exists in our list
      const matchedCategory = categories.find(c => (c._id || c.id).toString() === suggestedCategoryId);

      if (!matchedCategory) {
        return {
          success: false,
          status_code: 400,
          message: 'AI could not determine a valid category from the available options.',
          data: { rawResponse: suggestedCategoryId },
        };
      }

      // 4. Update the ticket in DB
      return await this.ticketsService.updateTicketCategory(ticketId, suggestedCategoryId, userId, userRole);

    } catch (error) {
      this.logger.error('Error auto-categorizing ticket', error);
      return { success: false, status_code: 500, message: 'Failed to auto-categorize ticket' };
    }
  }
}
