# BOV Generator

Professional Broker Opinion of Value (BOV) Document Generator for commercial real estate.

## Project Structure

```
bov-generator/
├── index.html      # Main HTML with form sections and tabs
├── app.js          # Core application logic and BOV generation
├── parser.js       # Document parsing (PDF/Excel) + Claude AI integration
├── styles.css      # Styling for form and generated BOV document
├── server.py       # Simple Python server for local development
├── api/
│   └── parse.js    # Vercel serverless function for Claude AI parsing
├── vercel.json     # Vercel configuration
├── .env.example    # Environment variables template
└── CLAUDE.md       # This file
```

## Running the Application

### Local Development
```bash
cd /Users/andrewrentz/bov-generator
python3 server.py
# Opens at http://localhost:8000
```

### Vercel Deployment
1. Push to GitHub
2. Connect to Vercel
3. Set environment variable: `ANTHROPIC_API_KEY`
4. Deploy

## Architecture

### Current: Frontend + Vercel Serverless API
```
Browser → Upload Files → Vercel API → Claude AI → Structured Data → Form → Generate HTML/PDF
```

### Tabs/Workflow
1. **Upload Documents** - Upload OM (PDF), Rent Roll (Excel), T12 (Excel) for auto-extraction
   - Supports AI-powered parsing via Claude API
   - Falls back to regex parsing if API unavailable
2. **Edit Data** - Form with 11 sections to input/edit property data
3. **Preview BOV** - Generated professional BOV document with print/PDF support

### Form Sections (index.html)
1. Property Information (address, type, year built, units, etc.)
2. Unit Mix & Rent Roll (dynamic rows)
3. Income & Operating Expenses
4. Physical Condition & Capital Needs
5. Market Analysis
6. Comparable Sales (dynamic rows)
7. Rent Comparables (dynamic rows)
8. Assumable Debt (optional)
9. Seller Goals & Broker Information
10. Valuation Parameters
11. Marketing & Disposition Strategy

## New Features (v2.0)

### AI-Powered Parsing
- Claude AI integration via `/api/parse` endpoint
- Intelligent extraction of property data, financials, and market info
- Confidence indicators for extracted fields (high/medium/low)
- Automatic fallback to regex parsing

### UX Improvements
- **Auto-Save**: Form data saved to localStorage every 30 seconds
- **Draft Restore**: Prompt to restore previous work on page load
- **Import/Export JSON**: Save and load form data as JSON files
- **Field Validation**: Required field highlighting, value warnings
- **Progress Indicator**: Shows form completion percentage

### Enhanced Document Output
- **Photo Gallery**: Support for up to 6 property photos
- **Location Map**: OpenStreetMap integration with property marker
- **Financial Charts**: Income/expense pie, rent comparison bar, cap rate sensitivity
- **Direct PDF Export**: Download PDF without print dialog (html2pdf.js)
- **Custom Branding**: Company logo, broker photo, custom colors

### Financial Analysis Tools
- **Sensitivity Analysis**: Property value at different cap rates
- **Pro Forma Projections**: 5-year hold analysis with IRR
- **Renovation ROI Calculator**: Payback period and value creation

## Key Functions (app.js)

### Core Functions
- `switchTab(tabId)` - Tab navigation
- `generateBOV()` - Main function that collects form data and generates HTML
- `calculateFinancials(data)` - Calculates GPR, EGI, NOI, valuations
- `generateBOVHtml(data, financials)` - Creates the BOV document HTML

### New Functions
- `autoSave()` / `restoreDraft()` - localStorage persistence
- `exportFormData()` / `importFormData()` - JSON import/export
- `validateForm()` / `calculateProgress()` - Form validation
- `downloadPDF()` - Direct PDF generation
- `createFinancialCharts()` / `initializeCharts()` - Chart.js integration
- `createLocationMap()` / `initializeMap()` - Leaflet map integration
- `generateSensitivityTableHtml()` - Cap rate sensitivity table
- `generateProFormaHtml()` - 5-year projections

### Parser Functions (parser.js)
- `parseWithClaude(fileType, content)` - AI parsing via API
- `applyConfidenceIndicators(fileType)` - Show confidence levels
- `extractPDFText(file)` - PDF text extraction for AI

## Financial Calculations

```javascript
// Income
GPR = sum(units * currentRent) * 12
EGI = GPR - vacancyLoss + otherIncome

// Expenses
totalExpenses = taxes + insurance + management + repairs + utilities + other + reserves

// Valuation
NOI = EGI - totalExpenses
indicatedValue = NOI / capRate
pricePerUnit = indicatedValue / numUnits
```

## Dependencies (CDN)

- **PDF.js** - PDF parsing for Offering Memorandum
- **SheetJS/xlsx** - Excel parsing for Rent Roll and T12
- **Chart.js** - Financial charts
- **html2pdf.js** - Direct PDF export
- **Leaflet.js** - Interactive maps

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Set via Vercel Dashboard > Project > Settings > Environment Variables

## API Endpoints

### POST /api/parse
Parse document content using Claude AI.

**Request:**
```json
{
  "fileType": "om|rentroll|t12",
  "content": "document text content"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* extracted fields */ },
  "confidence": { /* field confidence levels */ }
}
```

## Sample Data

Two sample datasets are available:
1. **Sample Data** - "Sunset Gardens Apartments" in Austin, TX (64 units, 1986)
2. **AZUL Data** - Real property from Stuart, FL Offering Memorandum (49 units, 2019)
