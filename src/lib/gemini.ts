import { GoogleGenAI } from '@google/genai';
import { calculateAnalytics } from './analytics';

export interface GeminiHealthResult {
  status: 'healthy' | 'unconfigured' | 'error';
  model: string;
  message: string;
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0 && !key.includes('your-gemini-api-key'));
}

export async function checkGeminiHealth(): Promise<GeminiHealthResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  let modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  if (modelName.startsWith('models/')) {
    modelName = modelName.replace('models/', '');
  }

  if (!isGeminiConfigured()) {
    return {
      status: 'unconfigured',
      model: modelName,
      message: 'GEMINI_API_KEY is not configured. Running in deterministic Demo Mode.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Health check. Respond with OK.',
    });

    if (response && response.text) {
      return {
        status: 'healthy',
        model: modelName,
        message: 'Google Gemini API is online and responding cleanly.',
      };
    }

    return {
      status: 'error',
      model: modelName,
      message: 'Gemini API returned an empty response.',
    };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return {
        status: 'error',
        model: modelName,
        message: 'Gemini API quota exceeded (Rate Limit 429). Falling back to grounded dataset engine.',
      };
    }

    return {
      status: 'error',
      model: modelName,
      message: `Gemini API connection notice: ${errMsg.slice(0, 100)}. Falling back to grounded dataset engine.`,
    };
  }
}

export async function generateGeminiBusinessAnswer(userQuestion: string): Promise<{
  answer: string;
  steps: string[];
  keyPoints: { label: string; value: string }[];
} | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  let modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  if (modelName.startsWith('models/')) {
    modelName = modelName.replace('models/', '');
  }

  const summary = calculateAnalytics();

  const systemPrompt = `You are Arthik AI, an expert CFO and financial intelligence advisor for Indian small businesses.
You are analyzing business performance data for "Rangoli Home & Gifts (Demo)" in Jaipur, Rajasthan (Currency: INR ₹).

Calculated YTD Ground-Truth Financial Metrics:
- Total Net Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}
- Gross Profit: ₹${summary.totalGrossProfit.toLocaleString('en-IN')} (Gross Margin: ${summary.grossMarginPct.toFixed(2)}%)
- Operating Expenses (OpEx): ₹${summary.totalOpex.toLocaleString('en-IN')}
- Net Profit: ₹${summary.totalNetProfit.toLocaleString('en-IN')} (Net Margin: ${summary.netMarginPct.toFixed(2)}%)
- Total Units Sold: ${summary.totalUnits.toLocaleString('en-IN')}

Monthly Breakdown:
${summary.monthlyTrends.map(m => `- ${m.month}: Revenue ₹${m.rev.toLocaleString('en-IN')}, Gross Profit ₹${m.gp.toLocaleString('en-IN')}, OpEx ₹${m.opex.toLocaleString('en-IN')}, Net Profit ₹${m.net.toLocaleString('en-IN')} (Net Margin: ${m.nm.toFixed(2)}%)`).join('\n')}

Top Performing Products (by Revenue):
${summary.topSellingProducts.map(p => `- ${p.name} (${p.id}): Revenue ₹${p.revenue.toLocaleString('en-IN')}, Gross Profit ₹${p.gross_profit.toLocaleString('en-IN')}, Margin ${p.margin_pct.toFixed(2)}%`).join('\n')}

Low Margin Products (Risk Alerts):
${summary.lowPerformingProducts.map(p => `- ${p.name} (${p.id}): Gross Margin ${p.margin_pct.toFixed(2)}%, Revenue ₹${p.revenue.toLocaleString('en-IN')}`).join('\n')}

September 2026 vs August 2026 Expense Changes:
${summary.sepVsAugExpenses.map(e => `- ${e.category}: Aug ₹${e.aug.toLocaleString('en-IN')} -> Sep ₹${e.sep.toLocaleString('en-IN')} (Change: ${e.change >= 0 ? '+' : ''}₹${e.change.toLocaleString('en-IN')})`).join('\n')}

User Question: "${userQuestion}"

Instructions:
1. Provide a direct, professional, data-grounded business answer using the exact numbers above.
2. Explain the key underlying drivers (e.g. September marketing spike +94.6%, logistics surcharges, raw material cost hikes on P01 Bedsheet).
3. Do not invent ungrounded financial numbers.
4. Provide actionable recommendations for the entrepreneur.`;

  const candidateModels = [modelName, 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model,
        contents: systemPrompt,
      });

      if (response && response.text) {
        return {
          answer: response.text,
          steps: [
            `Calculated metrics directly from sales and expense ledger.`,
            `Verified YTD Net Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')} & OpEx: ₹${summary.totalOpex.toLocaleString('en-IN')}.`,
            `Processed using official Google Gemini API (${model}).`
          ],
          keyPoints: [
            { label: 'YTD Revenue', value: `₹${(summary.totalRevenue / 100000).toFixed(2)} Lakh` },
            { label: 'Net Profit', value: `₹${(summary.totalNetProfit / 1000).toFixed(1)}k` },
            { label: 'Gross Margin', value: `${summary.grossMarginPct.toFixed(1)}%` },
            { label: 'Model', value: model }
          ]
        };
      }
    } catch (error: any) {
      console.warn(`Model ${model} candidate notice:`, error?.message || error);
    }
  }

  return null;
}
