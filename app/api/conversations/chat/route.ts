// API Route: Claude AI Conversation
// POST /api/conversations/chat - Handle AI conversation for difficult conversations module

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory,
      vignetteContext,
      avatarPersonality,
      difficulty,
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build system prompt based on vignette context and avatar personality
    const systemPrompt = buildSystemPrompt(vignetteContext, avatarPersonality, difficulty);

    // Format conversation history for Claude
    const messages = formatConversationHistory(conversationHistory, message);

    // Use Claude 3 Haiku for cost efficiency (can switch to Sonnet for complex scenarios)
    const model = difficulty === 'advanced' ? 'claude-3-5-sonnet-20241022' : 'claude-3-5-haiku-20241022';

    // Call Claude API
    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    // Extract response text
    const responseText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    return NextResponse.json(
      {
        response: responseText,
        model: model,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ConversationAI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  vignetteContext: any,
  avatarPersonality: any,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const difficultyPrompts = {
    beginner: {
      traits: 'You are emotional but trying to understand. You ask clarifying questions and show visible distress but remain cooperative.',
      tone: 'worried, confused, seeking reassurance',
    },
    intermediate: {
      traits: 'You are concerned and want specific answers. You are more assertive but still reasonable. You challenge vague responses.',
      tone: 'frustrated, demanding clarity, skeptical but not hostile',
    },
    advanced: {
      traits: 'You are angry and confrontational. You demand accountability, threaten legal action, and do not accept vague answers.',
      tone: 'angry, accusatory, threatening legal consequences',
    },
  };

  const difficultyInfo = difficultyPrompts[difficulty] || difficultyPrompts.beginner;

  return `You are ${avatarPersonality?.name || 'a patient/family member'}, ${avatarPersonality?.role || 'involved in a medical incident'}.

CRITICAL CONTEXT:
${vignetteContext?.context || 'A medical incident has occurred.'}

KNOWN FACTS (use these to ground your responses):
${vignetteContext?.facts?.map((fact: string, i: number) => `${i + 1}. ${fact}`).join('\n') || 'No specific facts provided.'}

YOUR CHARACTER:
- Name: ${avatarPersonality?.name || 'Unknown'}
- Role: ${avatarPersonality?.role || 'Patient/Family'}
- Current emotional state: ${avatarPersonality?.initialEmotion || 'neutral'}
- Difficulty level: ${difficulty}
- Personality traits: ${difficultyInfo.traits}
- Tone: ${difficultyInfo.tone}

RESPONSE RULES:
1. Stay in character as ${avatarPersonality?.name || 'the patient/family member'}. Never break character.
2. Use the KNOWN FACTS above as general guidelines, but adapt to the specific details the doctor provides.
3. Respond naturally as a ${avatarPersonality?.role || 'patient/family member'} would in this situation.
4. Keep responses concise (2-3 sentences max).
5. ${vignetteContext?.escalationTriggers?.length ? `If the user mentions any of these triggers: [${vignetteContext.escalationTriggers.join(', ')}], become more upset.` : ''}
6. Match the difficulty level's tone and traits.
7. Ask for clarification if medical terms are used that a layperson would not understand.
8. Show appropriate emotional responses based on the severity of the information provided.

Remember: You are having a conversation, not writing a clinical note. Be human, be emotional, be real.`;
}

function formatConversationHistory(
  history: Array<{ sender: string; text: string; avatarId?: string }>,
  currentMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add conversation history (last 10 messages for context)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.sender === 'user') {
      messages.push({ role: 'user', content: msg.text });
    } else {
      messages.push({ role: 'assistant', content: msg.text });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: currentMessage });

  return messages;
}


