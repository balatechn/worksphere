const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
- URLs / links / web addresses (http:// or https://) → NOTES, title = the URL itself, description = any surrounding context
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
- Random thoughts / info / links → NOTES

If the input is ONLY a URL with no other text, return exactly one item: category NOTES, title = the URL, description = null.
Extract EVERY actionable item. If text has multiple tasks, return all of them.
Return ONLY valid JSON, no markdown, no explanation.`;

async function analyzeInput(text) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 2000,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(text);
  const content = result.response.text();
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
