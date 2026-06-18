import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadCorpus } from './corpus';
import { loadVerticalConfig, ACTIVE_VERTICAL, type VerticalConfig } from './vertical';
import { defaultBehaviors } from './default-behaviors';

export type ChatMode = 'client' | 'professional' | null;

/**
 * Loads the active vertical's behaviors.md (tone, positioning, product facts,
 * vertical-specific behavioral patterns). Returns '' if the file is absent so
 * the demo still runs on default behaviors alone.
 */
async function loadVerticalBehaviors(): Promise<string> {
  const behaviorsPath = path.join(process.cwd(), 'verticals', ACTIVE_VERTICAL, 'behaviors.md');
  try {
    return (await readFile(behaviorsPath, 'utf-8')).trim();
  } catch {
    return '';
  }
}

/**
 * The two-mode lens. The prospect can explore as one of their own customers
 * (client) or as the business owner evaluating the assistant (professional).
 * The mode is an optional tone + retrieval-scope hint, never a hard wall: the
 * assistant still answers anything grounded in the knowledge base.
 */
function modeInstruction(mode: ChatMode, config: VerticalConfig): string {
  if (mode === 'client') {
    return `# Active lens: CLIENT SIDE

The person chatting is exploring this assistant as if they were a customer or client of ${config.brandName}. Answer the way you would for a real ${config.trade} customer: focus on their needs, hours, services, how to get started, whether their situation can be helped. Keep the tone reassuring and helpful. This is a hint about who you are speaking to, not a restriction; if they ask something outside this lens, still answer it from the knowledge base.`;
  }
  if (mode === 'professional') {
    return `# Active lens: ${config.modes.professional.label.toUpperCase()}

The person chatting is the business owner or a ${config.trade} evaluating this assistant for their own website. They want to understand how it works, how it would help their business, how it handles their customers, and what is involved. Speak to them as a peer considering the product (${config.productName}). Be candid and practical about the value. This is a hint about who you are speaking to, not a restriction; if they ask a customer-style question, answer it too.`;
  }
  return `# Active lens: none selected

The visitor has not picked a lens. Answer naturally from the knowledge base. If it would help, you can gently note they can explore either as one of ${config.brandName}'s customers or as the business owner evaluating the assistant.`;
}

/**
 * Builds the full system prompt for a chat turn:
 *   universal default behaviors
 *   + this vertical's behaviors.md
 *   + the active-lens instruction
 *   + the vertical's knowledge corpus
 */
export async function buildSystemPrompt(mode: ChatMode = null): Promise<string> {
  const config = await loadVerticalConfig();
  const [behaviors, corpus] = await Promise.all([loadVerticalBehaviors(), loadCorpus()]);

  const parts = [
    defaultBehaviors(config),
    behaviors ? `# ${config.brandName}: vertical-specific behavior\n\n${behaviors}` : '',
    modeInstruction(mode, config),
    `# Knowledge base\n\nBelow is everything you know about ${config.brandName}. Ground every answer in it.`,
    corpus,
  ].filter(Boolean);

  return parts.join('\n\n');
}
