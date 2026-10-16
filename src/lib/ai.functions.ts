import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import {
  createAIProvider,
  createFallbackAIProvider,
  CTO_MODEL,
  CTO_FALLBACK_MODEL,
} from "@/lib/ai-provider.server";

const briefSchema = z.object({
  summary: z.string(),
  difficulty: z.string(),
  estimatedCompletion: z.string(),
  techStack: z.array(z.string()),
  functionalRequirements: z.array(z.string()),
  nonFunctionalRequirements: z.array(z.string()),
  risks: z.array(z.string()),
  clientExpectations: z.array(z.string()),
  deliverables: z.array(z.string()),
  milestones: z.array(
    z.object({
      title: z.string(),
      outcome: z.string(),
      days: z.number(),
    }),
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      milestone: z.string(),
      tool: z.string(),
    }),
  ),
  // JARVIS WORKSTATION ADDITIONS:
  proposal: z.string(),
  executionPlan: z.array(z.string()),
  prompts: z.array(
    z.object({
      tool: z.string(),
      prompt: z.string(),
    })
  ),
});

export type BriefAnalysis = z.infer<typeof briefSchema>;

const conversationSchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
  outstandingQuestions: z.array(z.string()),
  suggestedReply: z.string(),
  sentiment: z.string(),
});

export type ConversationAnalysis = z.infer<typeof conversationSchema>;

/**
 * Primary AI provider:
 * NVIDIA Nemotron 3 Super through OpenRouter.
 */
function primaryModel() {
  return createAIProvider().languageModel(CTO_MODEL);
}

/**
 * Fallback AI provider:
 * Gemini through Google's AI SDK.
 */
function fallbackModel() {
  return createFallbackAIProvider().languageModel(CTO_FALLBACK_MODEL);
}

/**
 * Runs the primary model first.
 *
 * If OpenRouter/NVIDIA fails, automatically retries the
 * exact same request using the Gemini fallback model.
 */
async function generateWithFallback<T>({
  schema,
  prompt,
}: {
  schema: z.ZodType<T>;
  prompt: string;
}): Promise<T> {
  try {
    console.log(`[JARVIS] Primary model: ${CTO_MODEL}`);

    const { object } = await generateObject({
      model: primaryModel(),
      schema: schema,
      prompt,
    });

    console.log(`[JARVIS] Primary model succeeded.`);
    return object;
  } catch (primaryError) {
    const primaryMessage =
      primaryError instanceof Error
        ? primaryError.message
        : "Unknown primary model error";

    console.warn(
      `[JARVIS] Primary model failed. Switching to fallback Gemini.`,
      primaryMessage,
    );

    try {
      console.log(`[JARVIS] Fallback model: ${CTO_FALLBACK_MODEL}`);

      const { object } = await generateObject({
        model: fallbackModel(),
        schema: schema,
        prompt,
      });

      console.log(`[JARVIS] Fallback model succeeded.`);
      return object;
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Unknown fallback model error";

      console.error(
        `[JARVIS] Both primary and fallback models failed.`,
        {
          primaryError: primaryMessage,
          fallbackError: fallbackMessage,
        },
      );

      throw fallbackError;
    }
  }
}

export const analyseBrief = async (data: { text: string }): Promise<BriefAnalysis> => {
  // Validate input (This expects a clean { text: "..." } object now)
  z.object({ text: z.string().min(20) }).parse(data);

  const prompt = `You are a senior software architect and delivery lead for a solo AI agency working on Freelancer.com.

Analyse this project description and produce a delivery plan, a winning proposal, and ready-to-use AI prompts.

CRITICAL PROPOSAL INSTRUCTIONS:
Write a highly persuasive, professional bid addressed to the client. You MUST explicitly state that the project will be completed within 3 days, and guarantee that an initial concept version will be available within 24 hours. Make it sound warm, confident, and highly experienced.

CRITICAL AI PROMPTS INSTRUCTIONS:
Provide 3-5 highly detailed prompts tailored to this specific project to feed into your AI tools. 
Assign the correct tool for each prompt:
- Use 'Lovable' or 'v0' for UI/frontend generation prompts.
- Use 'Cursor' or 'Claude' for logic, backend, or VS Code architectural prompts.
- Use 'Microsoft Designer' or 'Midjourney' for visual assets and branding prompts.

EXECUTION PLAN INSTRUCTIONS:
Provide a 5-8 step chronological technical roadmap to execute and deliver this project aggressively.

Recommend only these tools in the tech stack and tasks:
- Lovable / v0
- Cursor / Visual Studio Code
- Claude
- Node.js
- Microsoft Designer

Keep every list (except executionPlan) to at most 8 concise items.
Milestones must be at most 6.
Tasks must be at most 12.

Difficulty must be exactly one of:
- Easy
- Moderate
- Hard
- Expert

PROJECT DESCRIPTION:

${data.text}`;

  try {
    return await generateWithFallback({
      schema: briefSchema,
      prompt,
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return briefSchema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    throw error;
  }
};

export const analyseConversation = async (data: { text: string }): Promise<ConversationAnalysis> => {
  // Validate input
  z.object({ text: z.string().min(20) }).parse(data);

  const prompt = `Analyse this client conversation from a Freelancer.com software project.

Return:
- A short summary
- Action items
- Outstanding questions
- A ready-to-send reply
- Overall sentiment

Keep lists to at most 8 items.

The suggested reply must:
- Be warm
- Be professional
- Be confident
- Sound like an experienced freelancer
- Be ready to send directly to the client
- Stay under 150 words

CONVERSATION:

${data.text}`;

  try {
    return await generateWithFallback({
      schema: conversationSchema,
      prompt,
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return conversationSchema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    throw error;
  }
};