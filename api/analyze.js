// Vercel Serverless Function for Claude AI Analysis
// POST /api/analyze
// Request: { analysisType: string, propertyData: object }
// Response: { success: true, analysis: { ...results } }

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { analysisType, propertyData } = req.body;

    if (!analysisType || !propertyData) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: analysisType and propertyData'
        });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            success: false,
            error: 'Server configuration error: API key not set'
        });
    }

    try {
        const prompt = getAnalysisPrompt(analysisType, propertyData);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', errorText);
            return res.status(response.status).json({
                success: false,
                error: `Claude API error: ${response.status}`
            });
        }

        const result = await response.json();
        const assistantMessage = result.content[0].text;

        // Parse the JSON response from Claude
        const jsonMatch = assistantMessage.match(/```json\n?([\s\S]*?)\n?```/) ||
                          assistantMessage.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return res.status(500).json({
                success: false,
                error: 'Failed to parse Claude response'
            });
        }

        const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        return res.status(200).json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

function getAnalysisPrompt(analysisType, data) {
    const propertyContext = `
PROPERTY DATA:
- Name: ${data.propertyName || 'Unknown'}
- Address: ${data.address || ''}, ${data.city || ''}, ${data.state || ''} ${data.zipCode || ''}
- Property Type: ${data.propertyType || 'Multifamily'}
- Units: ${data.numUnits || 'Unknown'}
- Year Built: ${data.yearBuilt || 'Unknown'}
- Occupancy: ${data.occupancyRate || 'Unknown'}%
- Construction: ${data.constructionType || 'Unknown'}
- Building Size: ${data.buildingSize || 'Unknown'} SF
- NOI: $${data.noi || 'Unknown'}
- Effective Gross Income: $${data.egi || 'Unknown'}
- Total Expenses: $${data.totalExpenses || 'Unknown'}
- Real Estate Taxes: $${data.realEstateTaxes || 'Unknown'}
- Insurance: $${data.insurance || 'Unknown'}
- Cap Rate Applied: ${data.appliedCapRate || 'Unknown'}%
- Recent CapEx: ${data.recentCapex || 'None noted'}
- Deferred Maintenance: ${data.deferredMaintenance || 'None noted'}
- Submarket: ${data.submarket || data.city || 'Unknown'}
- MSA: ${data.msa || 'Unknown'}
`;

    if (analysisType === 'market_research') {
        return `You are a commercial real estate market research analyst. Based on the property location, provide market data estimates.

${propertyContext}

Research and provide estimated market data for this location. Return ONLY valid JSON:

\`\`\`json
{
  "msaPopulation": "string (estimated MSA population)",
  "populationGrowth": "number (estimated 5-year population growth %)",
  "medianHouseholdIncome": "string (estimated median household income)",
  "majorEmployers": "string (list 3-5 major employers in the area)",
  "submarketVacancy": "number (estimated multifamily vacancy rate %)",
  "avgMarketRent": "number (estimated average rent for area)",
  "rentGrowthYoY": "number (estimated annual rent growth %)",
  "employmentGrowth": "number (estimated employment growth %)",
  "marketOutlook": "string (brief 2-3 sentence market outlook)",
  "dataConfidence": "high|medium|low (how confident in these estimates)"
}
\`\`\``;
    }

    if (analysisType === 'valuation_recommendation') {
        return `You are a commercial real estate valuation expert. Recommend an appropriate cap rate range for this property.

${propertyContext}

Analyze the property characteristics and recommend a cap rate range. Consider:
- Property age and condition
- Location quality (primary, secondary, tertiary market)
- Property class (A, B, C)
- Current market conditions
- Risk factors

Return ONLY valid JSON:

\`\`\`json
{
  "recommendedCapRateLow": "number (low end of recommended cap rate range)",
  "recommendedCapRateHigh": "number (high end of recommended cap rate range)",
  "propertyClass": "string (A, B, or C)",
  "marketTier": "string (Primary, Secondary, or Tertiary)",
  "capRateJustification": "string (2-3 sentences explaining the recommended range)",
  "riskPremiumFactors": ["list of factors that increase cap rate"],
  "valuePremiumFactors": ["list of factors that decrease cap rate"],
  "comparableCapRateRange": "string (typical cap rates for similar properties)"
}
\`\`\``;
    }

    if (analysisType === 'marketing_copy') {
        return `You are a commercial real estate marketing specialist. Write compelling marketing copy for this investment offering.

${propertyContext}

Generate professional marketing content. Return ONLY valid JSON:

\`\`\`json
{
  "headline": "string (compelling 8-12 word headline)",
  "investmentHighlights": ["list of 5-7 key investment highlights as bullet points"],
  "executiveSummary": "string (2-3 paragraph executive summary for the BOV)",
  "targetBuyerProfile": "string (description of ideal buyer types)",
  "keySellingPoints": "string (paragraph highlighting the top 3-4 selling points)",
  "riskMitigants": ["list of factors that reduce investment risk"],
  "valueAddOpportunities": ["list of potential value-add strategies if applicable"]
}
\`\`\``;
    }

    if (analysisType === 'comp_analysis') {
        const compsData = data.comps ? JSON.stringify(data.comps) : 'No comps provided';
        const rentCompsData = data.rentComps ? JSON.stringify(data.rentComps) : 'No rent comps provided';

        return `You are a commercial real estate analyst. Analyze the comparable sales and rent comps for this property.

${propertyContext}

COMPARABLE SALES:
${compsData}

RENT COMPARABLES:
${rentCompsData}

Provide a narrative analysis of the comparables. Return ONLY valid JSON:

\`\`\`json
{
  "salesCompNarrative": "string (2-3 paragraph analysis of how sale comps support the valuation)",
  "rentCompNarrative": "string (1-2 paragraph analysis of rent positioning)",
  "adjustmentFactors": ["list of factors requiring adjustment from comps"],
  "compQuality": "string (assessment of comp quality: Excellent, Good, Fair, Limited)",
  "marketPositioning": "string (where subject property falls relative to comps)",
  "supportedValueRange": "string (value range supported by comps)"
}
\`\`\``;
    }

    if (analysisType === 'risk_assessment') {
        return `You are a commercial real estate risk analyst. Identify potential risks for this investment.

${propertyContext}

Analyze potential risks and concerns. Return ONLY valid JSON:

\`\`\`json
{
  "physicalRisks": [
    {"risk": "string", "severity": "High|Medium|Low", "mitigation": "string"}
  ],
  "marketRisks": [
    {"risk": "string", "severity": "High|Medium|Low", "mitigation": "string"}
  ],
  "financialRisks": [
    {"risk": "string", "severity": "High|Medium|Low", "mitigation": "string"}
  ],
  "operationalRisks": [
    {"risk": "string", "severity": "High|Medium|Low", "mitigation": "string"}
  ],
  "overallRiskRating": "string (Low, Moderate, Elevated, High)",
  "riskSummary": "string (2-3 sentence overall risk assessment)",
  "keyDueDiligenceItems": ["list of important due diligence items to verify"]
}
\`\`\``;
    }

    if (analysisType === 'expense_benchmarking') {
        return `You are a commercial real estate financial analyst. Benchmark the operating expenses for this property.

${propertyContext}

EXPENSE DETAILS:
- Real Estate Taxes: $${data.realEstateTaxes || 0}
- Insurance: $${data.insurance || 0}
- Repairs & Maintenance: $${data.repairsMaintenance || 0}
- Utilities: $${data.utilitiesExpense || 0}
- Management: ${data.managementFeePercent || 0}% of EGI
- Other Expenses: $${data.otherExpenses || 0}
- Reserves: $${data.reservesPerUnit || 250}/unit

Analyze expenses vs typical benchmarks. Return ONLY valid JSON:

\`\`\`json
{
  "expenseRatio": "number (calculated expense ratio %)",
  "typicalExpenseRatio": "string (typical range for this property type)",
  "expensePerUnit": "number (total expenses per unit)",
  "typicalExpensePerUnit": "string (typical range per unit)",
  "lineItemAnalysis": [
    {"item": "Real Estate Taxes", "actual": "number", "typical": "string", "assessment": "High|Normal|Low"},
    {"item": "Insurance", "actual": "number", "typical": "string", "assessment": "High|Normal|Low"},
    {"item": "Repairs & Maintenance", "actual": "number", "typical": "string", "assessment": "High|Normal|Low"},
    {"item": "Utilities", "actual": "number", "typical": "string", "assessment": "High|Normal|Low"},
    {"item": "Management", "actual": "number", "typical": "string", "assessment": "High|Normal|Low"}
  ],
  "anomalies": ["list any expense items that appear unusual"],
  "recommendations": ["list recommendations for expense optimization"],
  "proFormaAdjustments": "string (suggested adjustments for pro forma analysis)"
}
\`\`\``;
    }

    if (analysisType === 'find_comps') {
        return `You are a commercial real estate analyst specializing in comparable sales research. Find relevant comparable sales for this property.

${propertyContext}

Based on the subject property's location, size, age, and class, suggest 4-6 comparable sales that would be relevant for valuation. Use your knowledge of recent multifamily transactions in the Florida Treasure Coast / South Florida market and similar secondary markets.

IMPORTANT: You MUST provide complete data for EVERY field. Do not leave any field empty, null, or zero.
- saleDate: Always provide a realistic date (YYYY-MM format)
- yearBuilt: Always provide the year built (estimate if needed based on property age)
- capRate: Always provide a realistic cap rate (typically 4.0-6.5% for Florida multifamily)
- occupancy: Always provide occupancy at time of sale (typically 90-98%)
- distance: Always estimate distance from subject property in miles
- pricePerUnit: Calculate from salePrice / units

For each comp, provide realistic data based on typical transactions for this market. If you know of actual transactions, use those. Otherwise, create plausible examples based on market norms. Never return 0 or empty values.

Return ONLY valid JSON:

\`\`\`json
{
  "comparableSales": [
    {
      "name": "string (property name)",
      "address": "string (city, state)",
      "saleDate": "string (YYYY-MM format)",
      "units": "number",
      "yearBuilt": "number",
      "salePrice": "number (total sale price)",
      "pricePerUnit": "number",
      "capRate": "number (cap rate %)",
      "occupancy": "number (occupancy % at sale)",
      "distance": "number (approximate miles from subject)",
      "propertyClass": "string (A, B, or C)",
      "notes": "string (brief note on why this is a good comp)"
    }
  ],
  "compSelectionNotes": "string (2-3 sentences explaining comp selection criteria)",
  "dataSource": "string (note that these are AI-estimated based on market knowledge)"
}
\`\`\``;
    }

    if (analysisType === 'find_rent_comps') {
        return `You are a commercial real estate analyst specializing in rent comparable research. Find relevant rent comparables for this property.

${propertyContext}

Based on the subject property's location, size, age, and class, suggest 4-6 rent comparable properties that would be relevant for rent analysis. Use your knowledge of multifamily properties in the Florida Treasure Coast / South Florida market and similar secondary markets.

IMPORTANT: You MUST provide complete data for EVERY field. Do not leave any field empty, null, or zero.
- units: Total number of units (realistic for market)
- yearBuilt: Year the property was built
- occupancy: Current occupancy percentage (typically 90-98%)
- avgRent: Average monthly rent in dollars (realistic for market/class)
- rentPSF: Rent per square foot (typically $1.50-$2.50 for FL multifamily)
- distance: Distance from subject property in miles

Never return 0 or empty values. Provide realistic estimates based on market knowledge.

Return ONLY valid JSON:

\`\`\`json
{
  "rentComparables": [
    {
      "name": "string (property name)",
      "address": "string (city, state)",
      "units": "number",
      "yearBuilt": "number",
      "occupancy": "number (current occupancy %)",
      "avgRent": "number (average monthly rent)",
      "rentPSF": "number (rent per square foot)",
      "distance": "number (approximate miles from subject)",
      "propertyClass": "string (A, B, or C)",
      "amenities": "string (key amenities)",
      "notes": "string (brief comparison note)"
    }
  ],
  "rentPositioning": "string (how subject rents compare to market)",
  "dataSource": "string (note that these are AI-estimated based on market knowledge)"
}
\`\`\``;
    }

    if (analysisType === 'full_analysis') {
        return `You are a senior commercial real estate analyst preparing a comprehensive Broker Opinion of Value. Analyze this property and provide complete insights.

${propertyContext}

Provide a comprehensive analysis covering all aspects. Return ONLY valid JSON:

\`\`\`json
{
  "executiveSummary": "string (3-4 paragraph professional executive summary)",
  "investmentHighlights": ["list of 5-7 key investment highlights"],
  "propertyClass": "string (A, B, or C with brief justification)",
  "recommendedCapRate": {
    "low": "number",
    "high": "number",
    "justification": "string"
  },
  "marketAnalysis": {
    "outlook": "string (2-3 sentences)",
    "strengths": ["list market strengths"],
    "concerns": ["list market concerns"]
  },
  "riskAssessment": {
    "overallRating": "Low|Moderate|Elevated|High",
    "keyRisks": ["top 3-4 risks"],
    "mitigants": ["key risk mitigants"]
  },
  "expenseAssessment": {
    "rating": "Efficient|Normal|Elevated",
    "notes": "string"
  },
  "targetBuyers": "string (ideal buyer profile)",
  "keySellingPoints": "string (top selling points paragraph)",
  "dueDiligenceItems": ["critical due diligence items"],
  "valueAddOpportunities": ["potential value-add strategies"]
}
\`\`\``;
    }

    // Default fallback
    return `Analyze this commercial real estate property and provide insights:

${propertyContext}

Return your analysis as JSON.`;
}
