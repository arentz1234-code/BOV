# BOV Generator

Professional Broker Opinion of Value (BOV) Document Generator for commercial real estate.

## Project Structure

```
bov-generator/
├── index.html      # Main HTML with form sections and tabs
├── app.js          # Core application logic and BOV generation
├── parser.js       # Document parsing (PDF/Excel) for auto-population
├── styles.css      # Styling for form and generated BOV document
├── server.py       # Simple Python server for local development
└── CLAUDE.md       # This file
```

## Running the Application

```bash
cd /Users/andrewrentz/bov-generator
python3 server.py
# Opens at http://localhost:8000
```

## Architecture

### Tabs/Workflow
1. **Upload Documents** - Upload OM (PDF), Rent Roll (Excel), T12 (Excel) for auto-extraction
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

### Key Functions (app.js)

- `switchTab(tabId)` - Tab navigation
- `addUnitRow()` / `removeUnitRow()` - Unit mix management
- `addCompRow()` / `removeCompRow()` - Comparable sales management
- `generateBOV()` - Main function that collects form data and generates HTML
- `calculateFinancials(data)` - Calculates GPR, EGI, NOI, valuations
- `generateBOVHtml(data, financials)` - Creates the BOV document HTML
- `loadSampleData()` - Loads demo data (Austin property)
- `loadAzulData()` - Loads AZUL property from Offering Memorandum

### Financial Calculations

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

### Generated BOV Sections
1. Cover Page
2. Executive Summary with value box
3. Property Description (info tables, unit mix, condition)
4. Market Analysis (submarket, trends, cap rates)
5. Comparable Sales Analysis (table with subject comparison)
6. Income & Valuation Analysis (detailed income statement)
7. Debt Assumption Analysis (if applicable)
8. Valuation Conclusion
9. Marketing & Disposition Strategy
10. Broker Qualifications & Disclosures

## Dependencies

- **PDF.js** (CDN) - PDF parsing for Offering Memorandum
- **SheetJS/xlsx** (CDN) - Excel parsing for Rent Roll and T12

## Key Data Points

### Property Object
```javascript
{
  propertyName, propertyAddress, city, state, zipCode, county,
  propertyType, yearBuilt, yearRenovated, lotSize, buildingSize,
  numUnits, occupancyRate, constructionType, parking, utilities, zoning,
  unitMix: [{ type, count, sf, currentRent, marketRent }],
  otherIncome, vacancyRate, realEstateTaxes, insurance, managementFeePercent,
  repairsMaintenance, utilitiesExpense, otherExpenses, reservesPerUnit,
  submarket, msa, msaPopulation, submarketVacancy, rentGrowthYoY,
  comps: [{ name, date, units, yearBuilt, price, capRate, occupancy, distance }],
  hasAssumableDebt, loanBalance, interestRate, annualDebtService,
  brokerName, brokerageFirm, clientName,
  appliedCapRate, stabilizedCapRate
}
```

### Financials Object
```javascript
{
  totalUnits, totalSF, avgCurrentRent, avgMarketRent,
  gpr, egi, noi, proFormaNoi,
  totalExpenses, expenseRatio,
  indicatedValue, proFormaValue, valueLow, valueHigh,
  pricePerUnit, pricePerUnitLow, pricePerUnitHigh,
  impliedCapRateLow, impliedCapRateHigh,
  dscr, ltv
}
```

## Print/PDF

The preview tab has a "Print / Save PDF" button that uses `window.print()`. The styles.css includes `@media print` rules to format the document properly for PDF export.

## Sample Data

Two sample datasets are available:
1. **Sample Data** - "Sunset Gardens Apartments" in Austin, TX (64 units, 1986)
2. **AZUL Data** - Real property from Stuart, FL Offering Memorandum (49 units, 2019)
