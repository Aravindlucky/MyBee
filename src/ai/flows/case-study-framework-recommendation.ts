'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending relevant business frameworks for case study analysis.
 *
 * It exports:
 * - `recommendFrameworks`: An async function that takes a case title and subject as input and returns a list of recommended business frameworks.
 * - `FrameworkRecommendationInput`: The input type for the `recommendFrameworks` function.
 * - `FrameworkRecommendationOutput`: The output type for the `recommendFrameworks` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FrameworkRecommendationInputSchema = z.object({
  caseTitle: z.string().describe('The title of the case study.'),
  caseSubject: z.string().describe('The subject or industry of the case study.'),
});

export type FrameworkRecommendationInput = z.infer<typeof FrameworkRecommendationInputSchema>;

const FrameworkRecommendationOutputSchema = z.object({
  frameworks: z.array(
    z.string().describe('A relevant business framework for the case study.')
  ).describe('A list of recommended business frameworks.')
});

export type FrameworkRecommendationOutput = z.infer<typeof FrameworkRecommendationOutputSchema>;

export async function recommendFrameworks(input: FrameworkRecommendationInput): Promise<FrameworkRecommendationOutput> {
  return caseStudyFrameworkRecommendationFlow(input);
}

const caseStudyFrameworkRecommendationPrompt = ai.definePrompt({
  name: 'caseStudyFrameworkRecommendationPrompt',
  input: {schema: FrameworkRecommendationInputSchema},
  output: {schema: FrameworkRecommendationOutputSchema},
  prompt: `You are an expert in business strategy and analysis. Given the title and subject of a case study, recommend a list of relevant business frameworks that can be used to analyze the case.

Case Title: {{{caseTitle}}}
Case Subject: {{{caseSubject}}}

Consider frameworks like Porter's Five Forces, SWOT Analysis, PESTLE, Value Chain Analysis, and others.  Return ONLY a JSON array of strings, no other text.`, // Explicitly ask for JSON array of strings
});

const caseStudyFrameworkRecommendationFlow = ai.defineFlow(
  {
    name: 'caseStudyFrameworkRecommendationFlow',
    inputSchema: FrameworkRecommendationInputSchema,
    outputSchema: FrameworkRecommendationOutputSchema,
  },
  async input => {
    const {output} = await caseStudyFrameworkRecommendationPrompt(input);
    return output!;
  }
);
