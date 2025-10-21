import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DeadlinePriorityItemSchema = z.object({
  id: z.string().describe('The unique ID of the deadline.'),
  title: z.string().describe('The title of the deadline.'),
  course: z.string().describe('The course code or "Task" if generic.'),
  dueDate: z.string().describe('The due date in YYYY-MM-DD format.'),
});

const DeadlinePriorityInputSchema = z.object({
  deadlines: z.array(DeadlinePriorityItemSchema).describe('A list of upcoming, non-completed deadlines.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});

export type DeadlinePriorityInput = z.infer<typeof DeadlinePriorityInputSchema>;

const DeadlinePriorityOutputSchema = z.object({
  overallSummary: z.string().describe('A motivating 3-sentence summary and action plan focusing on the most critical items.'),
  prioritizedList: z.array(
    z.object({
      id: z.string().describe('The unique ID of the deadline.'),
      priority: z.enum(['High', 'Medium', 'Low']).describe('The calculated priority based on urgency and importance.'),
    })
  ).max(5).describe('A list of the top 5 most urgent deadlines and their priority.'),
});

export type DeadlinePriorityOutput = z.infer<typeof DeadlinePriorityOutputSchema>;

export async function prioritizeDeadlines(input: DeadlinePriorityInput): Promise<DeadlinePriorityOutput> {
  return deadlinePrioritizationFlow(input);
}

const deadlinePrioritizationPrompt = ai.definePrompt({
  name: 'deadlinePrioritizationPrompt',
  input: { schema: DeadlinePriorityInputSchema },
  output: { schema: DeadlinePriorityOutputSchema },
  prompt: `You are an MBA productivity expert. Analyze the following list of upcoming non-completed academic deadlines.

Current Date: {{{currentDate}}}
Deadlines:
{{#each deadlines}}
- {{course}}: "{{title}}" due on {{dueDate}}
{{/each}}

Based on proximity to the current date and the general nature of MBA deadlines (e.g., exams and major assignments are High, small tasks are Medium/Low), generate two outputs:
1. An "overallSummary" of exactly three motivating sentences: The first sentence must state the total number of urgent tasks. The second must name the most critical task and give a single action item. The third must be a general encouraging statement.
2. A "prioritizedList" containing the unique IDs and a High/Medium/Low priority for the top 5 most urgent deadlines.

Return ONLY a JSON object.`,
});

const deadlinePrioritizationFlow = ai.defineFlow(
  {
    name: 'deadlinePrioritizationFlow',
    inputSchema: DeadlinePriorityInputSchema,
    outputSchema: DeadlinePriorityOutputSchema,
  },
  async input => {
    const { output } = await deadlinePrioritizationPrompt(input);
    return output!;
  }
);