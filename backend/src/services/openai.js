const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are WorkSphere, a productivity assistant. Analyze the user's text and extract all actionable items.

Return a JSON object with an "items" array. Each item must have exactly these fields:
- category: one of "MY_TASKS" | "TEAM_TASKS" | "REMINDERS" | "FOLLOW_UPS" | "WAITING_APPROVAL" | "CALLS" | "MEETINGS" | "PROCUREMENT" | "NOTES" | "DELEGATED"
- title: concise action title (max 80 characters)
- description: additional context or null
- assignee: person/team name if task is for someone else, or null
- deadline: ISO date string (YYYY-MM-DD) if a date is mentioned, or null
- isUrgent: true if words like urgent/ASAP/immediately/critical are used, otherwise false
- priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"

Category rules:
- "remind Salman" → DELEGATED, assignee: "Salman"
- "ask finance team" → DELEGATED, assignee: "Finance Team"
- "call someone" or "phone someone" → CALLS
- "meeting" / "visit" → MEETINGS
- "buy" / "purchase" / "order" / "procurement" → PROCUREMENT
- "remind me" / "don't forget" → REMINDERS
- "waiting for approval" / "pending approval" → WAITING_APPROVAL
- "follow up" → FOLLOW_UPS
- Personal tasks → MY_TASKS
- Team tasks not yet delegated → TEAM_TASKS
- Random thoughts / info → NOTES

Extract EVERY actionable item. If text has multiple tasks, return all of them.
Return ONLY the JSON object, no markdown, no explanation.`;

async function analyzeInput(text) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  const items = Array.isArray(parsed) ? parsed : (parsed.items || []);

  return items.map(item => ({
    category: item.category || 'MY_TASKS',
    title: (item.title || 'Untitled').substring(0, 80),
    description: item.description || null,
    assignee: item.assignee || null,
    deadline: item.deadline ? new Date(item.deadline) : null,
    isUrgent: Boolean(item.isUrgent),
    priority: item.priority || 'MEDIUM',
  }));
}

module.exports = { analyzeInput };
