import type { PaperAnalysis } from './types';

const JSON_SCHEMA = `{
  "title": "string",
  "authors": ["string"],
  "abstract": "string (1-3 sentences)",
  "sections": [
    {
      "title": "string",
      "summary": "string (2-4 sentences)",
      "keyInsight": "string (1 sentence, the main takeaway)",
      "visualizationType": "architecture | comparison | chart | flowchart | table | timeline",
      "visualizationData": { ... },
      "interactiveElements": [
        {
          "type": "toggle | slider | stepper | before-after",
          "label": "string",
          "description": "string",
          "config": { ... }
        }
      ],
      "quizQuestion": {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "explanation": "string"
      }
    }
  ],
  "architecture": {
    "nodes": [{ "id": "string", "label": "string", "type": "input|process|output|model", "description": "string" }],
    "edges": [{ "from": "string", "to": "string", "label": "string" }]
  },
  "results": [{ "label": "string", "value": "string", "comparison": "string", "isBetter": true }],
  "glossary": [{ "term": "string", "definition": "string (1 sentence)" }]
}`;

export function buildAnalysisPrompt(paperText: string): string {
  // Truncate to ~6000 chars for small models
  const truncated = paperText.length > 6000 ? paperText.slice(0, 6000) + '\n[...truncated]' : paperText;

  return `You are an AI that analyzes research papers and generates structured data for interactive visualizations.

Given the research paper text below, produce a JSON object following this schema:

${JSON_SCHEMA}

IMPORTANT RULES:
1. Create 4-6 sections covering the paper's key findings
2. For each section, choose the BEST visualization type:
   - "architecture": for system designs, model architectures (provide nodes and edges)
   - "comparison": for comparing methods/results (provide items with metrics)
   - "chart": for numerical trends, training curves (provide series with x,y data)
   - "flowchart": for processes, pipelines (provide steps and connections)
   - "table": for structured results (provide headers and rows)
   - "timeline": for chronological developments (provide events)
3. Add 1-2 interactive elements per section
4. Generate a quiz question for each section
5. Include 5-10 glossary terms
6. Extract key metrics/results if the paper reports them
7. If the paper describes a model/system architecture, include the architecture field
8. Use real numbers from the paper, not made-up values
9. Return ONLY valid JSON, no markdown, no explanation
10. Use \\n for newlines in strings, never raw newlines. Escape all special characters properly.

PAPER TEXT:
${truncated}

JSON:`;
}

function extractJSON(text: string): string {
  let s = text.trim();

  // Strip markdown code fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  // Find the first { and last matching }
  const firstBrace = s.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in LLM response. Raw response: ' + s.slice(0, 200));
  }

  // Walk forward counting braces to find the matching close
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastBrace = -1;

  for (let i = firstBrace; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) { lastBrace = i; break; } }
  }

  if (lastBrace === -1) {
    throw new Error('Unterminated JSON object in LLM response');
  }

  let jsonStr = s.slice(firstBrace, lastBrace + 1);

  // Sanitize control characters ONLY inside JSON string values, not structural whitespace
  let sanitized = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    const code = ch.charCodeAt(0);
    if (esc) { sanitized += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { sanitized += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; sanitized += ch; continue; }
    if (inStr && code < 0x20) {
      // Replace control chars inside strings
      if (ch === '\n') { sanitized += '\\n'; }
      else if (ch === '\r') { sanitized += '\\r'; }
      else if (ch === '\t') { sanitized += '\\t'; }
      // else skip
    } else {
      sanitized += ch;
    }
  }
  jsonStr = sanitized;

  return jsonStr;
}

export function parseAnalysisResponse(text: string): PaperAnalysis {
  const jsonStr = extractJSON(text);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    // Last resort: try to fix common LLM JSON mistakes
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, '$1')  // trailing commas
      .replace(/'/g, '"');             // single quotes
    try {
      parsed = JSON.parse(fixed);
    } catch {
      throw new Error(`Failed to parse JSON: ${e.message}. First 300 chars: ${jsonStr.slice(0, 300)}`);
    }
  }

  // Validate required fields with defaults
  return {
    title: parsed.title || 'Untitled Paper',
    authors: Array.isArray(parsed.authors) ? parsed.authors : [],
    abstract: parsed.abstract || '',
    sections: (Array.isArray(parsed.sections) ? parsed.sections : []).map((s: any) => ({
      title: s.title || 'Section',
      summary: s.summary || '',
      keyInsight: s.keyInsight || '',
      visualizationType: s.visualizationType || 'table',
      visualizationData: s.visualizationData || { headers: [], rows: [] },
      interactiveElements: Array.isArray(s.interactiveElements) ? s.interactiveElements : [],
      quizQuestion: s.quizQuestion || undefined,
    })),
    architecture: parsed.architecture || undefined,
    results: Array.isArray(parsed.results) ? parsed.results : [],
    glossary: Array.isArray(parsed.glossary) ? parsed.glossary : [],
  };
}
