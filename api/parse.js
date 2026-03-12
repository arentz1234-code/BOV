// Vercel Serverless Function for Claude AI Document Parsing
// POST /api/parse
// Request: { fileType: 'om'|'rentroll'|'t12', content: string (text content) }
// Response: { success: true, data: { ...extractedFields }, confidence: { ...fieldConfidences } }

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

    const { fileType, content } = req.body;

    if (!fileType || !content) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: fileType and content'
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
        const prompt = getPromptForFileType(fileType, content);

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

        const extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        return res.status(200).json({
            success: true,
            data: extractedData.data || extractedData,
            confidence: extractedData.confidence || {}
        });

    } catch (error) {
        console.error('Parse error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

function getPromptForFileType(fileType, content) {
    const baseInstructions = `You are an expert commercial real estate analyst. Extract structured data from the following document content. Return ONLY valid JSON with no additional text.

EXTRACTION PRIORITY:
1. First, look for explicitly stated values in the document
2. If not explicitly stated, infer from context (e.g., year built 2019 = likely no deferred maintenance)
3. If cannot be determined, use null for numbers or empty string for text fields

For each extracted field, provide a confidence level: "high" (clearly stated in document), "medium" (inferred from context), or "low" (uncertain/guessed).

CAPITAL NEEDS EXTRACTION - Pay special attention to:
- Recent Capital Expenditures: Look for "capital improvements", "recent upgrades", "value-add", "renovations completed", "property enhancements"
- Deferred Maintenance: Look for "capital needs", "deferred maintenance", "required repairs", "near-term capex"
- For newer properties (built within 5 years), note "Property built [year] - no significant deferred maintenance expected"
- Property amenities and unit features help assess condition

COMPARABLE SALES EXTRACTION - Extract ALL comp data with complete information:
- Look for "comparable sales", "recent transactions", "market comparables", "sales comps" sections
- For EACH comp, extract ALL fields: name, date, units, yearBuilt, price, capRate, occupancy, distance
- If a field is not explicitly stated, estimate it based on context (e.g., cap rate from price/NOI, distance from location)
- Never return 0.00 or empty for cap rate or occupancy - these should always have values
- Look for tables with comp data and extract every column

RENT COMPARABLES EXTRACTION - Extract ALL rent comp data with complete information:
- Look for "rent comparables", "competitive set", "market rents", "rent comps" sections
- For EACH rent comp, extract ALL fields: name, units, yearBuilt, occupancy, avgRent, psf, distance
- NEVER leave yearBuilt, occupancy, avgRent, or distance blank/zero - estimate if not stated
- yearBuilt: Estimate from property class/age description (Class A newer = 2015+, Class B = 2000-2015, etc.)
- occupancy: If not stated, use 94-96% as typical for market-rate properties
- avgRent: Calculate from $/SF if needed (typical 900-1200 SF units)
- distance: Estimate from location description relative to subject property`;

    if (fileType === 'om') {
        return `${baseInstructions}

DOCUMENT TYPE: Offering Memorandum (OM)

Extract the following information and return as JSON:

\`\`\`json
{
  "data": {
    "propertyName": "string",
    "address": "string",
    "city": "string",
    "state": "string (2-letter code)",
    "zipCode": "string",
    "county": "string",
    "parcelId": "string",
    "propertyType": "string (Multifamily, Retail, Office, Industrial, Mixed-Use, Self-Storage, Hospitality)",
    "yearBuilt": "number",
    "yearRenovated": "number or null",
    "lotSize": "number (acres)",
    "buildingSize": "number (square feet)",
    "numUnits": "number",
    "occupancyRate": "number (percentage)",
    "constructionType": "string",
    "parking": "string",
    "utilities": "string",
    "zoning": "string",
    "unitMix": [
      {
        "type": "string (e.g., 1BR/1BA)",
        "count": "number",
        "sf": "number",
        "currentRent": "number",
        "marketRent": "number"
      }
    ],
    "otherIncome": "number (annual)",
    "realEstateTaxes": "number (annual)",
    "insurance": "number (annual)",
    "repairsMaintenance": "number (annual)",
    "utilitiesExpense": "number (annual)",
    "payroll": "number (annual)",
    "contractServices": "number (annual)",
    "adminExpense": "number (annual)",
    "marketing": "number (annual)",
    "otherExpenses": "number (annual)",
    "submarket": "string",
    "msa": "string",
    "msaPopulation": "string",
    "populationGrowth": "number (percentage)",
    "majorEmployers": "string",
    "submarketVacancy": "number (percentage)",
    "rentGrowthYoY": "number (percentage)",
    "newSupply": "number (units)",
    "avgHouseholdIncome": "string",
    "marketCapRateLow": "number (percentage)",
    "marketCapRateHigh": "number (percentage)",
    "comps": [
      {
        "name": "string",
        "date": "string (YYYY-MM)",
        "units": "number",
        "yearBuilt": "number",
        "price": "number",
        "capRate": "number",
        "occupancy": "number",
        "distance": "number (miles)"
      }
    ],
    "rentComps": [
      {
        "name": "string",
        "units": "number",
        "yearBuilt": "number",
        "occupancy": "number",
        "avgRent": "number",
        "psf": "number",
        "distance": "number (miles)"
      }
    ],
    "brokerName": "string (listing broker name - look in contacts, listing agent section, prepared by)",
    "brokerageFirm": "string (brokerage company name - Marcus & Millichap, CBRE, Cushman, JLL, etc.)",
    "brokerLicense": "string (real estate license number if shown)",
    "brokerageAddress": "string (broker/firm office address)",
    "brokerBio": "string (broker qualifications, experience, transaction history if mentioned)",
    "clientName": "string (property owner, seller name, ownership entity - look for LLC, LP, Trust names)",
    "sellerTimeline": "string (desired closing timeline, marketing period, call for offers date)",
    "pricingExpectation": "string (asking price, price guidance, pricing expectations if mentioned)",
    "dealStructure": "string (fee simple, ground lease, assumable debt, seller financing preferences)",
    "recentCapex": "string (detailed description of recent capital improvements, renovations, upgrades - look for sections about property improvements, capital expenditures, value-add completed, recent upgrades, amenity additions)",
    "deferredMaintenance": "string (description of deferred maintenance, capital needs, required repairs, or note 'None identified' for newer properties in good condition)",
    "renovationCostPerUnit": "number (estimated cost per unit for renovations if mentioned, or null)",
    "unitsToRenovate": "number (number of units needing renovation, or 0 if property is fully renovated/new)",
    "propertyCondition": "string (overall condition: Excellent, Good, Fair, Poor - infer from year built, recent capex, and property description)",
    "amenities": "string (list of property amenities: pool, fitness center, clubhouse, etc.)",
    "unitFeatures": "string (in-unit features: granite counters, stainless appliances, washer/dryer, etc.)"
  },
  "confidence": {
    "propertyName": "high|medium|low",
    "address": "high|medium|low",
    "numUnits": "high|medium|low",
    "yearBuilt": "high|medium|low",
    "unitMix": "high|medium|low",
    "capitalNeeds": "high|medium|low",
    "financials": "high|medium|low",
    "comps": "high|medium|low",
    "brokerInfo": "high|medium|low",
    "sellerGoals": "high|medium|low"
  }
}
\`\`\`

DOCUMENT CONTENT:
${content.substring(0, 100000)}`;
    }

    if (fileType === 'rentroll') {
        return `${baseInstructions}

DOCUMENT TYPE: Rent Roll

Extract unit-level data and aggregate statistics. Return as JSON:

\`\`\`json
{
  "data": {
    "units": [
      {
        "unitNumber": "string",
        "type": "string (e.g., 1BR/1BA, 2BR/2BA)",
        "sqft": "number",
        "currentRent": "number (monthly)",
        "marketRent": "number (monthly) or null",
        "status": "string (Occupied, Vacant, Notice, etc.)",
        "leaseStart": "string (YYYY-MM-DD) or null",
        "leaseEnd": "string (YYYY-MM-DD) or null",
        "tenant": "string or null"
      }
    ],
    "summary": {
      "totalUnits": "number",
      "occupiedUnits": "number",
      "vacantUnits": "number",
      "occupancyRate": "number (percentage)",
      "avgRent": "number",
      "avgSqft": "number",
      "totalMonthlyRent": "number"
    },
    "unitMixSummary": [
      {
        "type": "string",
        "count": "number",
        "avgSqft": "number",
        "avgRent": "number"
      }
    ]
  },
  "confidence": {
    "unitData": "high|medium|low",
    "rentData": "high|medium|low",
    "occupancy": "high|medium|low"
  }
}
\`\`\`

DOCUMENT CONTENT:
${content.substring(0, 100000)}`;
    }

    if (fileType === 't12') {
        return `${baseInstructions}

DOCUMENT TYPE: T12 Operating Statement (Trailing 12 Months)

Extract income and expense line items. Return as JSON:

\`\`\`json
{
  "data": {
    "period": "string (e.g., Jan 2024 - Dec 2024)",
    "income": {
      "grossPotentialRent": "number (annual)",
      "vacancyLoss": "number (annual, as positive number)",
      "concessions": "number (annual)",
      "badDebt": "number (annual)",
      "otherIncome": {
        "laundry": "number",
        "parking": "number",
        "petFees": "number",
        "applicationFees": "number",
        "lateFees": "number",
        "rubs": "number",
        "other": "number"
      },
      "effectiveGrossIncome": "number (annual)"
    },
    "expenses": {
      "realEstateTaxes": "number (annual)",
      "insurance": "number (annual)",
      "utilities": {
        "electric": "number",
        "water": "number",
        "gas": "number",
        "trash": "number",
        "other": "number"
      },
      "repairsMaintenance": "number (annual)",
      "payroll": "number (annual)",
      "management": "number (annual)",
      "managementPercent": "number (percentage)",
      "contractServices": "number (annual)",
      "adminExpense": "number (annual)",
      "marketing": "number (annual)",
      "professional": "number (annual)",
      "otherExpenses": "number (annual)",
      "totalExpenses": "number (annual)"
    },
    "netOperatingIncome": "number (annual)",
    "expenseRatio": "number (percentage)",
    "expensePerUnit": "number"
  },
  "confidence": {
    "income": "high|medium|low",
    "expenses": "high|medium|low",
    "noi": "high|medium|low"
  }
}
\`\`\`

DOCUMENT CONTENT:
${content.substring(0, 100000)}`;
    }

    // Generic fallback
    return `${baseInstructions}

Extract any relevant property, financial, or market data from this document and return as JSON.

DOCUMENT CONTENT:
${content.substring(0, 100000)}`;
}
