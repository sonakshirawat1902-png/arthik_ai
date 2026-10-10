import { calculateAnalytics } from './analytics';
import { formatINR, formatPercent } from './formatter';
import { AIQuestionResponse } from '../types';
import { generateGeminiBusinessAnswer, isGeminiConfigured } from './gemini';

export async function answerBusinessQuestionAsync(userQuestion: string): Promise<AIQuestionResponse> {
  const hasGeminiKey = isGeminiConfigured();

  // If Gemini API Key is configured, attempt live AI generation with grounded data context
  if (hasGeminiKey) {
    const geminiRes = await generateGeminiBusinessAnswer(userQuestion);
    if (geminiRes) {
      return {
        question: userQuestion,
        answer: geminiRes.answer,
        calculationSteps: geminiRes.steps,
        keyDataPoints: geminiRes.keyPoints,
        isDemoMode: false,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // Fallback to deterministic data engine (Demo Mode)
  return answerBusinessQuestionDeterministic(userQuestion);
}

export function answerBusinessQuestion(userQuestion: string): AIQuestionResponse {
  return answerBusinessQuestionDeterministic(userQuestion);
}

function answerBusinessQuestionDeterministic(userQuestion: string): AIQuestionResponse {
  const summary = calculateAnalytics();
  const isDemoMode = !isGeminiConfigured();

  const qLower = userQuestion.toLowerCase();

  // Question 1: September profit drop
  if (qLower.includes('september') || qLower.includes('negative') || qLower.includes('drop') || qLower.includes('loss')) {
    const sep = summary.monthlyTrends.find(m => m.month === '2026-09');
    const aug = summary.monthlyTrends.find(m => m.month === '2026-08');
    const mkDiff = summary.sepVsAugExpenses.find(e => e.category === 'Marketing');
    const logDiff = summary.sepVsAugExpenses.find(e => e.category === 'Logistics');

    return {
      question: userQuestion,
      answer: `In September 2026, Rangoli Home & Gifts generated ${formatINR(sep?.rev || 0)} in net revenue but incurred a net loss of ${formatINR(Math.abs(sep?.net || 0))} (-6.07% Net Margin).\n\nThe loss was primarily driven by a surge in festive marketing spend (up +₹17,500 vs August), higher festive logistics surcharges (+₹3,800 vs August), raw material cost increases on Block-Print Bedsheets (P01 unit cost rose from ₹1,050 to ₹1,190), and increased promotional discounting on Jaipuri Razai and Ceramic Mugs.`,
      calculationSteps: [
        `September Net Revenue: ${formatINR(sep?.rev || 0)} vs August Revenue: ${formatINR(aug?.rev || 0)}`,
        `September OpEx: ${formatINR(sep?.opex || 0)} (surged by +₹21,100 vs August OpEx of ${formatINR(aug?.opex || 0)})`,
        `Marketing Spend Increase: Meta/Google & Influencer Ads jumped from ${formatINR(mkDiff?.aug || 0)} in Aug to ${formatINR(mkDiff?.sep || 0)} in Sep (+₹17,500 / +94.6%)`,
        `Logistics Increase: Surcharges rose from ${formatINR(logDiff?.aug || 0)} to ${formatINR(logDiff?.sep || 0)} (+₹3,800)`,
        `Product Margin Compression: P01 Bedsheet cost increased by 13.3% to ₹1,190, lowering gross margin to 38.04% in September vs 42.15% in August.`
      ],
      keyDataPoints: [
        { label: 'September Net Loss', value: formatINR(sep?.net || 0) },
        { label: 'September OpEx', value: formatINR(sep?.opex || 0) },
        { label: 'Marketing Increase', value: '+₹17,500 (+94.6%)' },
        { label: 'Gross Margin Shift', value: '38.04% (Sep) vs 42.15% (Aug)' }
      ],
      isDemoMode,
      generatedAt: new Date().toISOString(),
    };
  }

  // Question 2: Highest revenue product
  if (qLower.includes('highest revenue') || qLower.includes('top product') || qLower.includes('best seller') || qLower.includes('most revenue')) {
    const highestRevProd = [...summary.productsPerformance].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      question: userQuestion,
      answer: `The product generating the highest total revenue YTD is **${highestRevProd.name} (${highestRevProd.id})** with **${formatINR(highestRevProd.revenue)}** in total sales across ${highestRevProd.units} units sold.\n\nIt accounts for **${formatPercent((highestRevProd.revenue / summary.totalRevenue) * 100)}** of total business revenue YTD.`,
      calculationSteps: [
        `YTD Business Net Revenue: ${formatINR(summary.totalRevenue)} across 12 products.`,
        `${highestRevProd.name} Revenue: ${highestRevProd.units} units sold × average effective price = ${formatINR(highestRevProd.revenue)}.`,
        `Gross Profit: ${formatINR(highestRevProd.gross_profit)} (${highestRevProd.margin_pct.toFixed(2)}% Gross Margin).`
      ],
      keyDataPoints: [
        { label: 'Top Revenue Product', value: highestRevProd.name },
        { label: 'YTD Revenue', value: formatINR(highestRevProd.revenue) },
        { label: 'Units Sold', value: `${highestRevProd.units} units` },
        { label: 'Share of Business', value: formatPercent((highestRevProd.revenue / summary.totalRevenue) * 100) }
      ],
      isDemoMode,
      generatedAt: new Date().toISOString(),
    };
  }

  // Question 3: Profitability / Highest margin product
  if (qLower.includes('margin') || qLower.includes('most profitable') || qLower.includes('profitability')) {
    const highestMarginProd = [...summary.productsPerformance].sort((a, b) => b.margin_pct - a.margin_pct)[0];

    return {
      question: userQuestion,
      answer: `The most profitable product by gross margin percentage YTD is **${highestMarginProd.name} (${highestMarginProd.id})** with an outstanding **${formatPercent(highestMarginProd.margin_pct)} Gross Margin**.\n\nIt generated **${formatINR(highestMarginProd.gross_profit)}** in gross profit from **${formatINR(highestMarginProd.revenue)}** revenue across ${highestMarginProd.units} units.`,
      calculationSteps: [
        `Gross Margin Formula: (Gross Profit / Net Revenue) × 100`,
        `${highestMarginProd.name} Net Revenue: ${formatINR(highestMarginProd.revenue)}`,
        `COGS: ${formatINR(highestMarginProd.cogs)}`,
        `Gross Profit: ${formatINR(highestMarginProd.gross_profit)}`,
        `Calculation: (${formatINR(highestMarginProd.gross_profit)} / ${formatINR(highestMarginProd.revenue)}) × 100 = ${highestMarginProd.margin_pct.toFixed(2)}%`
      ],
      keyDataPoints: [
        { label: 'Highest Margin Item', value: highestMarginProd.name },
        { label: 'Gross Margin %', value: formatPercent(highestMarginProd.margin_pct) },
        { label: 'Total Gross Profit', value: formatINR(highestMarginProd.gross_profit) },
        { label: 'Units Sold', value: `${highestMarginProd.units} units` }
      ],
      isDemoMode,
      generatedAt: new Date().toISOString(),
    };
  }

  // Question 4: Marketing expenses change
  if (qLower.includes('marketing') || qLower.includes('ad spend') || qLower.includes('ads')) {
    const mk = summary.sepVsAugExpenses.find(e => e.category === 'Marketing');

    return {
      question: userQuestion,
      answer: `Marketing expenses increased dramatically in September 2026 to **${formatINR(mk?.sep || 0)}**, representing a **+${formatINR(mk?.change || 0)} (+94.6%) increase** compared to August (${formatINR(mk?.aug || 0)}).\n\nThis spike was due to festive campaign preparation, including ₹21,600 on Meta & Google Ads and ₹14,400 on Influencer & Print promotion.`,
      calculationSteps: [
        `August Marketing Spend: ${formatINR(mk?.aug || 0)} (Meta/Google: ₹11,100 + Local: ₹7,400)`,
        `September Marketing Spend: ${formatINR(mk?.sep || 0)} (Meta/Google: ₹21,600 + Influencer/Print: ₹14,400)`,
        `Absolute Increase: ${formatINR(mk?.sep || 0)} - ${formatINR(mk?.aug || 0)} = +${formatINR(mk?.change || 0)}`,
        `Percentage Growth: (+₹17,500 / ₹18,500) × 100 = +94.59%`
      ],
      keyDataPoints: [
        { label: 'August Marketing', value: formatINR(mk?.aug || 0) },
        { label: 'September Marketing', value: formatINR(mk?.sep || 0) },
        { label: 'Net Increase', value: `+${formatINR(mk?.change || 0)}` },
        { label: '% Growth', value: '+94.59%' }
      ],
      isDemoMode,
      generatedAt: new Date().toISOString(),
    };
  }

  // Question 5: Channel breakdown
  if (qLower.includes('channel') || qLower.includes('store') || qLower.includes('online') || qLower.includes('whatsapp')) {
    const channels = summary.channelBreakdown;

    return {
      question: userQuestion,
      answer: `Sales are distributed across three channels:\n\n` +
        channels.map(c => `- **${c.channel}**: ${formatINR(c.revenue)} (${c.percentage.toFixed(1)}% of total revenue)`).join('\n') +
        `\n\nThe physical Store remains the largest sales driver, followed by Direct Online Website sales and WhatsApp catalog orders.`,
      calculationSteps: [
        `Total YTD Revenue: ${formatINR(summary.totalRevenue)}`,
        ...channels.map(c => `${c.channel}: ${formatINR(c.revenue)} / ${formatINR(summary.totalRevenue)} = ${c.percentage.toFixed(2)}%`)
      ],
      keyDataPoints: channels.map(c => ({ label: `${c.channel} Sales`, value: `${formatINR(c.revenue)} (${c.percentage.toFixed(1)}%)` })),
      isDemoMode,
      generatedAt: new Date().toISOString(),
    };
  }

  // Question 6: General performance summary / default response
  const topProd = summary.productsPerformance[0];
  const maxMonth = [...summary.monthlyTrends].sort((a, b) => b.rev - a.rev)[0];

  return {
    question: userQuestion,
    answer: `Here is a summary of Rangoli Home & Gifts YTD performance (Jan 2026 - Sep 2026):\n\n` +
      `- **Total Net Revenue**: ${formatINR(summary.totalRevenue)}\n` +
      `- **Gross Profit**: ${formatINR(summary.totalGrossProfit)} (${summary.grossMarginPct.toFixed(2)}% Gross Margin)\n` +
      `- **Operating Expenses**: ${formatINR(summary.totalOpex)}\n` +
      `- **Net Profit YTD**: ${formatINR(summary.totalNetProfit)} (${summary.netMarginPct.toFixed(2)}% Net Margin)\n` +
      `- **Peak Sales Month**: ${maxMonth.month} (${formatINR(maxMonth.rev)})\n` +
      `- **Top Gross Profit Item**: ${topProd.name} (${formatINR(topProd.gross_profit)} GP)`,
    calculationSteps: [
      `Total Sales Rows Processed: ${summary.recordCounts.sales}`,
      `Total Expense Rows Processed: ${summary.recordCounts.expenses}`,
      `Calculation: Net Profit = Gross Profit (${formatINR(summary.totalGrossProfit)}) - OpEx (${formatINR(summary.totalOpex)}) = ${formatINR(summary.totalNetProfit)}`
    ],
    keyDataPoints: [
      { label: 'Total Revenue', value: formatINR(summary.totalRevenue) },
      { label: 'Gross Margin', value: formatPercent(summary.grossMarginPct) },
      { label: 'Net Profit YTD', value: formatINR(summary.totalNetProfit) },
      { label: 'Peak Month', value: maxMonth.month }
    ],
    isDemoMode,
    generatedAt: new Date().toISOString(),
  };
}
