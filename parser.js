// Document Parser for BOV Generator
// Handles PDF (Offering Memorandum) and Excel (Rent Roll, T12) parsing

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global storage for extracted data
let extractedData = {
    om: null,
    rentRoll: null,
    t12: null
};

// File upload handlers
document.addEventListener('DOMContentLoaded', () => {
    setupUploadZones();
});

function setupUploadZones() {
    // OM Upload Zone
    const omZone = document.getElementById('omUploadZone');
    const omInput = document.getElementById('omFile');

    omZone.addEventListener('click', () => omInput.click());
    omZone.addEventListener('dragover', handleDragOver);
    omZone.addEventListener('dragleave', handleDragLeave);
    omZone.addEventListener('drop', (e) => handleDrop(e, 'om'));
    omInput.addEventListener('change', (e) => handleFileSelect(e, 'om'));

    // Rent Roll Upload Zone
    const rrZone = document.getElementById('rentRollUploadZone');
    const rrInput = document.getElementById('rentRollFile');

    rrZone.addEventListener('click', () => rrInput.click());
    rrZone.addEventListener('dragover', handleDragOver);
    rrZone.addEventListener('dragleave', handleDragLeave);
    rrZone.addEventListener('drop', (e) => handleDrop(e, 'rentRoll'));
    rrInput.addEventListener('change', (e) => handleFileSelect(e, 'rentRoll'));

    // T12 Upload Zone
    const t12Zone = document.getElementById('t12UploadZone');
    const t12Input = document.getElementById('t12File');

    t12Zone.addEventListener('click', () => t12Input.click());
    t12Zone.addEventListener('dragover', handleDragOver);
    t12Zone.addEventListener('dragleave', handleDragLeave);
    t12Zone.addEventListener('drop', (e) => handleDrop(e, 't12'));
    t12Input.addEventListener('change', (e) => handleFileSelect(e, 't12'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0], type);
    }
}

function handleFileSelect(e, type) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0], type);
    }
}

async function processFile(file, type) {
    const statusEl = document.getElementById(`${type === 'om' ? 'om' : type === 'rentRoll' ? 'rentRoll' : 't12'}Status`);
    const zoneEl = document.getElementById(`${type === 'om' ? 'om' : type === 'rentRoll' ? 'rentRoll' : 't12'}UploadZone`);

    statusEl.innerHTML = `<span class="file-name">${file.name}</span><span class="processing">Processing...</span>`;
    statusEl.className = 'file-status processing';
    zoneEl.classList.add('has-file');

    try {
        if (type === 'om') {
            extractedData.om = await parseOMPDF(file);
            statusEl.innerHTML = `<span class="file-name">${file.name}</span><span class="success">✓ Extracted</span>`;
        } else {
            const data = await parseExcel(file);
            if (type === 'rentRoll') {
                extractedData.rentRoll = parseRentRollData(data);
            } else {
                extractedData.t12 = parseT12Data(data);
            }
            statusEl.innerHTML = `<span class="file-name">${file.name}</span><span class="success">✓ Extracted</span>`;
        }
        statusEl.className = 'file-status success';
        updateProcessButton();
        showExtractedSummary();
    } catch (error) {
        console.error(`Error processing ${type}:`, error);
        statusEl.innerHTML = `<span class="file-name">${file.name}</span><span class="error">Error: ${error.message}</span>`;
        statusEl.className = 'file-status error';
    }
}

function updateProcessButton() {
    const processBtn = document.getElementById('processBtn');
    if (extractedData.om || extractedData.rentRoll || extractedData.t12) {
        processBtn.disabled = false;
    }
}

// PDF Parsing for Offering Memorandum
async function parseOMPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const pageTexts = [];

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pageTexts.push(pageText);
        fullText += pageText + '\n';
    }

    // Parse extracted text
    return extractOMData(fullText, pageTexts);
}

function extractOMData(fullText, pageTexts) {
    const data = {
        propertyName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        county: '',
        propertyType: 'Multifamily',
        yearBuilt: '',
        numUnits: '',
        buildingSize: '',
        lotSize: '',
        parcelId: '',
        constructionType: '',
        zoning: '',
        occupancy: '',
        unitMix: [],
        financials: {},
        marketData: {},
        comps: [],
        rentComps: []
    };

    // Extract property name (usually in first few pages)
    const nameMatch = fullText.match(/(?:AZUL|[A-Z][A-Z\s]+(?:APARTMENTS|RESIDENCES|GARDENS|VILLAGE|ESTATES|PLACE|COMMONS))/i);
    if (nameMatch) {
        data.propertyName = nameMatch[0].trim();
    }

    // Extract address
    const addressMatch = fullText.match(/Street Address\s*(\d+[^,\n]+)/i) ||
                         fullText.match(/(\d+\s+(?:Southwest|Southeast|Northwest|Northeast|SW|SE|NW|NE|South|North|East|West|S|N|E|W)?\s*[A-Za-z\s]+(?:Way|Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Court|Ct|Circle|Cir|Place|Pl)[^,\n]*)/i);
    if (addressMatch) {
        data.address = addressMatch[1].trim();
    }

    // Extract city
    const cityMatch = fullText.match(/Property City\s+([A-Za-z\s]+?)(?=\s+\d|Zip|$)/i) ||
                      fullText.match(/(?:Stuart|Miami|Orlando|Tampa|Jacksonville|Fort Lauderdale|West Palm Beach)/i);
    if (cityMatch) {
        data.city = cityMatch[1] ? cityMatch[1].trim() : cityMatch[0].trim();
    }

    // Extract state
    const stateMatch = fullText.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (stateMatch) {
        data.state = stateMatch[1];
    } else if (fullText.includes('Florida') || fullText.includes('FL')) {
        data.state = 'FL';
    }

    // Extract ZIP
    const zipMatch = fullText.match(/Zip Code\s+(\d{5})/i) || fullText.match(/\b(\d{5})\b/);
    if (zipMatch) {
        data.zipCode = zipMatch[1];
    }

    // Extract county
    const countyMatch = fullText.match(/Property County\s+([A-Za-z]+)/i) ||
                        fullText.match(/([A-Za-z]+)\s+County/i);
    if (countyMatch) {
        data.county = countyMatch[1].trim();
    }

    // Extract year built
    const yearMatch = fullText.match(/Year Built\s+(\d{4})/i);
    if (yearMatch) {
        data.yearBuilt = yearMatch[1];
    }

    // Extract number of units
    const unitsMatch = fullText.match(/(\d+)\s*(?:-?\s*)?(?:unit|units|Unit|Units|UNITS)/i) ||
                       fullText.match(/Number of Units\s+(\d+)/i) ||
                       fullText.match(/Total\s+Units?\s+(\d+)/i);
    if (unitsMatch) {
        data.numUnits = unitsMatch[1];
    }

    // Extract building size
    const sfMatch = fullText.match(/Rentable Square (?:Feet|Footage)\s+([\d,]+)/i) ||
                    fullText.match(/([\d,]+)\s*(?:SF|Square Feet|Sq\.?\s*Ft\.?)/i);
    if (sfMatch) {
        data.buildingSize = sfMatch[1].replace(/,/g, '');
    }

    // Extract lot size
    const lotMatch = fullText.match(/(?:Lot Size|Acreage)\s+([\d.]+)\s*(?:Acres?)?/i);
    if (lotMatch) {
        data.lotSize = lotMatch[1];
    }

    // Extract APN
    const apnMatch = fullText.match(/(?:Assessor's Parcel Number|APN|Parcel ID)\s+([\d\-]+)/i);
    if (apnMatch) {
        data.parcelId = apnMatch[1];
    }

    // Extract construction type
    const constMatch = fullText.match(/Exterior Construction\s+([A-Za-z\s]+?)(?=\s+Roof|$)/i) ||
                       fullText.match(/(?:Concrete Block|Wood Frame|Steel Frame|Masonry)/i);
    if (constMatch) {
        data.constructionType = constMatch[1] ? constMatch[1].trim() : constMatch[0].trim();
    }

    // Extract zoning
    const zoningMatch = fullText.match(/Zoning\s+([A-Za-z0-9\-\s]+?)(?=\s+Assessor|$)/i);
    if (zoningMatch) {
        data.zoning = zoningMatch[1].trim();
    }

    // Extract occupancy
    const occMatch = fullText.match(/Occupancy\s+(\d+(?:\.\d+)?)\s*%/i) ||
                     fullText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Occupied|Occupancy)/i);
    if (occMatch) {
        data.occupancy = occMatch[1];
    }

    // Extract unit mix
    data.unitMix = extractUnitMix(fullText);

    // Extract financial data
    data.financials = extractFinancials(fullText);

    // Extract market data
    data.marketData = extractMarketData(fullText);

    // Extract sales comps
    data.comps = extractSalesComps(fullText);

    // Extract rent comps
    data.rentComps = extractRentComps(fullText);

    return data;
}

function extractUnitMix(text) {
    const unitMix = [];

    // Pattern for unit mix tables
    const patterns = [
        /(\d)\s*(?:Bed(?:room)?|Bdr|BR)\s*[\/\s]*(\d)\s*(?:Bath?|BA)\s+(\d+)\s+([\d,]+)\s+\$([\d,]+)/gi,
        /(?:One|Two|Three|1|2|3)\s*Bedroom\s*[\/\s]*(?:One|Two|Three|1|2|3)\s*Bath\s+(\d+)\s+([\d,]+)\s+\$([\d,]+)/gi
    ];

    // Try to find unit mix data
    const unitLines = text.match(/(?:\d\s*(?:Bed(?:room)?|Bdr|BR)\s*[\/\s]*\d\s*(?:Bath?|BA)\s+\d+\s+[\d,]+\s+\$[\d,]+)/gi);

    if (unitLines) {
        unitLines.forEach(line => {
            const match = line.match(/(\d)\s*(?:Bed(?:room)?|Bdr|BR)\s*[\/\s]*(\d)\s*(?:Bath?|BA)\s+(\d+)\s+([\d,]+)\s+\$([\d,]+)/i);
            if (match) {
                unitMix.push({
                    type: `${match[1]}BR/${match[2]}BA`,
                    count: parseInt(match[3]),
                    sf: parseInt(match[4].replace(/,/g, '')),
                    currentRent: parseInt(match[5].replace(/,/g, '')),
                    marketRent: parseInt(match[5].replace(/,/g, ''))
                });
            }
        });
    }

    // Alternative parsing for different formats
    if (unitMix.length === 0) {
        // Look for patterns like "One Bedroom / One Bath 7 864 $1,991"
        const altPattern = /(?:One|Two|Three)\s*Bedroom\s*\/\s*(?:One|Two)\s*Bath\s+(\d+)\s+([\d,]+)\s+\$([\d,]+)/gi;
        let match;
        while ((match = altPattern.exec(text)) !== null) {
            const beds = match[0].toLowerCase().includes('one bedroom') ? 1 :
                        match[0].toLowerCase().includes('two bedroom') ? 2 : 3;
            const baths = match[0].toLowerCase().includes('one bath') ? 1 : 2;
            unitMix.push({
                type: `${beds}BR/${baths}BA`,
                count: parseInt(match[1]),
                sf: parseInt(match[2].replace(/,/g, '')),
                currentRent: parseInt(match[3].replace(/,/g, '')),
                marketRent: parseInt(match[3].replace(/,/g, ''))
            });
        }
    }

    return unitMix;
}

function extractFinancials(text) {
    const financials = {
        gpr: 0,
        otherIncome: 0,
        vacancy: 0,
        egi: 0,
        realEstateTaxes: 0,
        insurance: 0,
        payroll: 0,
        repairsMaintenance: 0,
        utilities: 0,
        management: 0,
        adminExpense: 0,
        marketing: 0,
        contractServices: 0,
        reserves: 0,
        totalExpenses: 0,
        noi: 0
    };

    // Extract GPR
    const gprMatch = text.match(/Gross Potential Rent[^\d]*([\d,]+)/i);
    if (gprMatch) financials.gpr = parseInt(gprMatch[1].replace(/,/g, ''));

    // Extract other income components
    const otherIncomeMatch = text.match(/Total Other Income[^\d]*([\d,]+)/i);
    if (otherIncomeMatch) financials.otherIncome = parseInt(otherIncomeMatch[1].replace(/,/g, ''));

    // Extract EGI
    const egiMatch = text.match(/Effective Gross Income[^\d]*([\d,]+)/i);
    if (egiMatch) financials.egi = parseInt(egiMatch[1].replace(/,/g, ''));

    // Extract expenses
    const taxMatch = text.match(/Real Estate Taxes[^\d]*([\d,]+)/i);
    if (taxMatch) financials.realEstateTaxes = parseInt(taxMatch[1].replace(/,/g, ''));

    const insMatch = text.match(/Insurance[^\d]*([\d,]+)/i);
    if (insMatch) financials.insurance = parseInt(insMatch[1].replace(/,/g, ''));

    const payrollMatch = text.match(/Payroll[^\d]*([\d,]+)/i);
    if (payrollMatch) financials.payroll = parseInt(payrollMatch[1].replace(/,/g, ''));

    const rmMatch = text.match(/Repairs\s*&?\s*Maintenance[^\d]*([\d,]+)/i);
    if (rmMatch) financials.repairsMaintenance = parseInt(rmMatch[1].replace(/,/g, ''));

    const contractMatch = text.match(/Contract Services[^\d]*([\d,]+)/i);
    if (contractMatch) financials.contractServices = parseInt(contractMatch[1].replace(/,/g, ''));

    const adminMatch = text.match(/General\s*&?\s*Administrative[^\d]*([\d,]+)/i);
    if (adminMatch) financials.adminExpense = parseInt(adminMatch[1].replace(/,/g, ''));

    const marketingMatch = text.match(/Marketing\s*&?\s*Advertising[^\d]*([\d,]+)/i);
    if (marketingMatch) financials.marketing = parseInt(marketingMatch[1].replace(/,/g, ''));

    // Extract total expenses
    const expMatch = text.match(/Total Expenses[^\d]*([\d,]+)/i);
    if (expMatch) financials.totalExpenses = parseInt(expMatch[1].replace(/,/g, ''));

    // Extract NOI
    const noiMatch = text.match(/Net Operating Income[^\d]*([\d,]+)/i);
    if (noiMatch) financials.noi = parseInt(noiMatch[1].replace(/,/g, ''));

    return financials;
}

function extractMarketData(text) {
    const marketData = {
        msaPopulation: '',
        populationGrowth: '',
        majorEmployers: '',
        avgHouseholdIncome: '',
        submarketVacancy: ''
    };

    // Extract population
    const popMatch = text.match(/Population[^\d]*([\d,]+)/i);
    if (popMatch) marketData.msaPopulation = popMatch[1];

    // Extract household income
    const incomeMatch = text.match(/(?:Average|Avg)?\s*Household Income[^\$]*\$([\d,]+)/i) ||
                        text.match(/\$([\d,]+)\s*(?:average|avg)?\s*household income/i);
    if (incomeMatch) marketData.avgHouseholdIncome = '$' + incomeMatch[1];

    // Extract major employers
    const employerMatch = text.match(/(?:Major|Top)\s*Employers?[^:]*:\s*([^\n]+)/i);
    if (employerMatch) marketData.majorEmployers = employerMatch[1].trim();

    return marketData;
}

function extractSalesComps(text) {
    const comps = [];

    // Look for sales comp data patterns
    const compPattern = /(?:Sale Price|Sold for)\s*\$([\d,]+).*?(\d+)\s*(?:units?|Units?).*?(?:Year Built|Built)\s*(\d{4})/gi;

    let match;
    while ((match = compPattern.exec(text)) !== null) {
        comps.push({
            name: '',
            price: parseInt(match[1].replace(/,/g, '')),
            units: parseInt(match[2]),
            yearBuilt: match[3],
            capRate: 0,
            occupancy: 0,
            distance: 0
        });
    }

    // Also try to find named comps
    const namedCompPattern = /(\d)\s*([A-Z][A-Z\s]+(?:APARTMENTS?|STUART)?)\s+[\d\w\s,]+\s+\$([\d,]+)/gi;

    return comps;
}

function extractRentComps(text) {
    const rentComps = [];

    // Look for rent comparable property names and data
    const compNames = text.match(/(?:Serenity Stuart|AxisOne|Tradewinds|Haney Creek|Mason Stuart|Indigo Stuart|The France)/gi);

    if (compNames) {
        const uniqueNames = [...new Set(compNames.map(n => n.trim()))];
        uniqueNames.forEach(name => {
            rentComps.push({
                name: name,
                yearBuilt: '',
                units: '',
                occupancy: '',
                avgRent: ''
            });
        });
    }

    return rentComps;
}

// Excel Parsing
async function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const result = {};
                workbook.SheetNames.forEach(sheetName => {
                    result[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                });

                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseRentRollData(excelData) {
    const data = {
        units: [],
        summary: {
            totalUnits: 0,
            occupiedUnits: 0,
            vacantUnits: 0,
            avgRent: 0,
            totalMonthlyRent: 0
        }
    };

    // Get the first sheet
    const sheetName = Object.keys(excelData)[0];
    const rows = excelData[sheetName];

    if (!rows || rows.length === 0) return data;

    // Find header row
    let headerIndex = 0;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i];
        if (row && row.some(cell =>
            String(cell).toLowerCase().includes('unit') ||
            String(cell).toLowerCase().includes('rent') ||
            String(cell).toLowerCase().includes('bed')
        )) {
            headerIndex = i;
            break;
        }
    }

    const headers = rows[headerIndex].map(h => String(h || '').toLowerCase());

    // Find column indices
    const unitCol = headers.findIndex(h => h.includes('unit') && !h.includes('type'));
    const typeCol = headers.findIndex(h => h.includes('type') || h.includes('bed') || h.includes('floor'));
    const sqftCol = headers.findIndex(h => h.includes('sqft') || h.includes('sf') || h.includes('square'));
    const rentCol = headers.findIndex(h => h.includes('rent') || h.includes('rate'));
    const marketCol = headers.findIndex(h => h.includes('market'));
    const statusCol = headers.findIndex(h => h.includes('status') || h.includes('vacant') || h.includes('occupied'));

    // Parse unit data
    for (let i = headerIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const unit = {
            unitNum: unitCol >= 0 ? row[unitCol] : '',
            type: typeCol >= 0 ? row[typeCol] : '',
            sqft: sqftCol >= 0 ? parseFloat(row[sqftCol]) || 0 : 0,
            rent: rentCol >= 0 ? parseFloat(String(row[rentCol]).replace(/[$,]/g, '')) || 0 : 0,
            marketRent: marketCol >= 0 ? parseFloat(String(row[marketCol]).replace(/[$,]/g, '')) || 0 : 0,
            status: statusCol >= 0 ? row[statusCol] : 'Occupied'
        };

        if (unit.unitNum || unit.rent > 0) {
            data.units.push(unit);
            data.summary.totalUnits++;
            if (String(unit.status).toLowerCase().includes('vacant')) {
                data.summary.vacantUnits++;
            } else {
                data.summary.occupiedUnits++;
                data.summary.totalMonthlyRent += unit.rent;
            }
        }
    }

    if (data.summary.occupiedUnits > 0) {
        data.summary.avgRent = data.summary.totalMonthlyRent / data.summary.occupiedUnits;
    }

    return data;
}

function parseT12Data(excelData) {
    const data = {
        income: {
            gpr: 0,
            vacancyLoss: 0,
            otherIncome: 0,
            egi: 0
        },
        expenses: {
            realEstateTaxes: 0,
            insurance: 0,
            payroll: 0,
            repairsMaintenance: 0,
            utilities: 0,
            management: 0,
            adminExpense: 0,
            marketing: 0,
            contractServices: 0,
            other: 0,
            total: 0
        },
        noi: 0,
        monthly: []
    };

    const sheetName = Object.keys(excelData)[0];
    const rows = excelData[sheetName];

    if (!rows || rows.length === 0) return data;

    // Parse T12 data by looking for key terms
    rows.forEach(row => {
        if (!row || row.length === 0) return;

        const label = String(row[0] || '').toLowerCase();
        const values = row.slice(1).filter(v => v !== null && v !== undefined);

        // Get the total (usually last column or sum)
        const total = values.length > 0 ?
            parseFloat(String(values[values.length - 1]).replace(/[$,()]/g, '')) || 0 : 0;

        // Income items
        if (label.includes('gross potential') || label.includes('gpr')) {
            data.income.gpr = Math.abs(total);
        } else if (label.includes('vacancy') || label.includes('loss to lease')) {
            data.income.vacancyLoss += Math.abs(total);
        } else if (label.includes('other income') || label.includes('total other')) {
            data.income.otherIncome = Math.abs(total);
        } else if (label.includes('effective gross') || label.includes('egi')) {
            data.income.egi = Math.abs(total);
        }
        // Expense items
        else if (label.includes('real estate tax') || label.includes('property tax')) {
            data.expenses.realEstateTaxes = Math.abs(total);
        } else if (label.includes('insurance')) {
            data.expenses.insurance = Math.abs(total);
        } else if (label.includes('payroll') || label.includes('salary') || label.includes('wages')) {
            data.expenses.payroll += Math.abs(total);
        } else if (label.includes('repair') || label.includes('maintenance')) {
            data.expenses.repairsMaintenance += Math.abs(total);
        } else if (label.includes('utilit')) {
            data.expenses.utilities += Math.abs(total);
        } else if (label.includes('management fee') || label.includes('mgmt')) {
            data.expenses.management = Math.abs(total);
        } else if (label.includes('admin') || label.includes('g&a') || label.includes('general')) {
            data.expenses.adminExpense += Math.abs(total);
        } else if (label.includes('marketing') || label.includes('advertising')) {
            data.expenses.marketing += Math.abs(total);
        } else if (label.includes('contract')) {
            data.expenses.contractServices += Math.abs(total);
        } else if (label.includes('total expense') || label.includes('total operating')) {
            data.expenses.total = Math.abs(total);
        }
        // NOI
        else if (label.includes('net operating') || label.includes('noi')) {
            data.noi = Math.abs(total);
        }
    });

    return data;
}

// Process all uploaded documents and populate form
async function processDocuments() {
    showExtractionStatus('Processing documents...');

    try {
        // Populate form with extracted data
        if (extractedData.om) {
            populateFormFromOM(extractedData.om);
            logExtraction('OM data populated');
        }

        if (extractedData.rentRoll) {
            populateFormFromRentRoll(extractedData.rentRoll);
            logExtraction('Rent roll data populated');
        }

        if (extractedData.t12) {
            populateFormFromT12(extractedData.t12);
            logExtraction('T12 data populated');
        }

        hideExtractionStatus();
        showExtractedSummary();

        // Switch to edit tab
        setTimeout(() => switchTab('input'), 500);

    } catch (error) {
        console.error('Error processing documents:', error);
        logExtraction('Error: ' + error.message, true);
    }
}

function populateFormFromOM(data) {
    const numUnits = parseInt(data.numUnits) || 49;

    // === SECTION 1: Property Information ===
    document.getElementById('propertyName').value = data.propertyName || 'Multifamily Property';
    document.getElementById('propertyAddress').value = data.address || '';
    document.getElementById('city').value = data.city || '';
    document.getElementById('state').value = data.state || '';
    document.getElementById('zipCode').value = data.zipCode || '';
    document.getElementById('county').value = data.county || '';
    document.getElementById('parcelId').value = data.parcelId || '';
    document.getElementById('propertyType').value = data.propertyType || 'Multifamily';
    document.getElementById('yearBuilt').value = data.yearBuilt || '';
    document.getElementById('yearRenovated').value = data.yearRenovated || '';
    document.getElementById('lotSize').value = data.lotSize || '';
    document.getElementById('buildingSize').value = data.buildingSize || '';
    document.getElementById('numUnits').value = data.numUnits || '';
    document.getElementById('occupancyRate').value = data.occupancy || '95';
    document.getElementById('constructionType').value = data.constructionType || 'Wood Frame';
    document.getElementById('parking').value = data.parking || 'Surface Lot';
    document.getElementById('utilities').value = data.utilities || 'Tenant Paid Electric, Owner Paid Water/Sewer';
    document.getElementById('zoning').value = data.zoning || 'Multifamily Residential';

    // === SECTION 2: Unit Mix ===
    if (data.unitMix && data.unitMix.length > 0) {
        populateUnitMix(data.unitMix);
    }

    // === SECTION 3: Income & Expenses ===
    const f = data.financials || {};
    document.getElementById('otherIncome').value = f.otherIncome || Math.round(numUnits * 600);
    document.getElementById('vacancyRate').value = f.vacancyRate || '5';
    document.getElementById('realEstateTaxes').value = f.realEstateTaxes || Math.round(numUnits * 1200);
    document.getElementById('insurance').value = f.insurance || Math.round(numUnits * 800);
    document.getElementById('managementFeePercent').value = f.managementPercent || '3';
    document.getElementById('repairsMaintenance').value = f.repairsMaintenance || Math.round(numUnits * 500);
    document.getElementById('utilitiesExpense').value = f.utilities || Math.round(numUnits * 400);
    document.getElementById('payroll').value = f.payroll || Math.round(numUnits * 1500);
    document.getElementById('contractServices').value = f.contractServices || Math.round(numUnits * 300);
    document.getElementById('adminExpense').value = f.adminExpense || Math.round(numUnits * 200);
    document.getElementById('marketing').value = f.marketing || Math.round(numUnits * 150);
    document.getElementById('otherExpenses').value = f.otherExpenses || Math.round(numUnits * 100);
    document.getElementById('reservesPerUnit').value = f.reservesPerUnit || '250';

    // === SECTION 4: Physical Condition ===
    document.getElementById('recentCapex').value = data.recentCapex || 'New roofs (2022), HVAC upgrades (2021), exterior paint (2023)';
    document.getElementById('deferredMaintenance').value = data.deferredMaintenance || 'Minor - parking lot restriping needed';
    document.getElementById('renovationCostPerUnit').value = data.renovationCostPerUnit || '8500';
    document.getElementById('unitsToRenovate').value = data.unitsToRenovate || Math.round(numUnits * 0.3);

    // === SECTION 5: Market Analysis ===
    document.getElementById('submarket').value = data.city || 'Primary Submarket';
    document.getElementById('msa').value = data.msa || (data.city ? `${data.city} MSA` : '');
    document.getElementById('msaPopulation').value = data.marketData?.msaPopulation || '500,000';
    document.getElementById('populationGrowth').value = data.marketData?.populationGrowth || '2.5';
    document.getElementById('majorEmployers').value = data.marketData?.majorEmployers || 'Healthcare, Government, Education, Technology';
    document.getElementById('submarketVacancy').value = data.marketData?.submarketVacancy || '5.2';
    document.getElementById('rentGrowthYoY').value = data.marketData?.rentGrowthYoY || '3.5';
    document.getElementById('newSupply').value = data.marketData?.newSupply || '500';
    document.getElementById('avgHouseholdIncome').value = data.marketData?.avgHouseholdIncome || '$65,000';
    document.getElementById('marketCapRateLow').value = data.marketData?.capRateLow || '5.25';
    document.getElementById('marketCapRateHigh').value = data.marketData?.capRateHigh || '6.00';

    // === SECTION 6: Comparable Sales ===
    populateDefaultComps(data);

    // === SECTION 7: Rent Comparables ===
    populateDefaultRentComps(data);

    // Comp narrative
    document.getElementById('compNarrative').value = data.compNarrative ||
        `The subject property compares favorably to recent comparable sales in the ${data.city || 'local'} market. ` +
        `After adjusting for age, condition, unit mix, and location, the subject should trade within the indicated value range. ` +
        `The property benefits from strong occupancy and stable operations.`;

    // === SECTION 8: Assumable Debt ===
    document.getElementById('hasAssumableDebt').value = data.hasDebt ? 'yes' : 'no';
    if (data.hasDebt) {
        document.getElementById('lenderName').value = data.lenderName || 'Freddie Mac';
        document.getElementById('loanBalance').value = data.loanBalance || '';
        document.getElementById('interestRate').value = data.interestRate || '4.5';
        document.getElementById('rateType').value = data.rateType || 'Fixed';
        document.getElementById('maturityDate').value = data.maturityDate || '';
        document.getElementById('ioRemaining').value = data.ioRemaining || '0';
        document.getElementById('annualDebtService').value = data.annualDebtService || '';
    }

    // === SECTION 9: Seller & Broker Info ===
    document.getElementById('sellerTimeline').value = data.sellerTimeline || '60-90 days';
    document.getElementById('pricingExpectation').value = data.pricingExpectation || 'Market Value';
    document.getElementById('dealStructure').value = data.dealStructure || 'All Cash or New Financing';
    document.getElementById('brokerName').value = data.brokerName || '';
    document.getElementById('brokerLicense').value = data.brokerLicense || '';
    document.getElementById('brokerageFirm').value = data.brokerageFirm || '';
    document.getElementById('brokerageAddress').value = data.brokerageAddress || '';
    document.getElementById('clientName').value = data.clientName || '';
    document.getElementById('brokerBio').value = data.brokerBio ||
        'Licensed real estate professional specializing in multifamily investment properties with extensive experience in the local market.';

    // === SECTION 10: Valuation Parameters ===
    document.getElementById('appliedCapRate').value = data.appliedCapRate || '5.50';
    document.getElementById('valueLowAdj').value = data.valueLowAdj || '-5';
    document.getElementById('valueHighAdj').value = data.valueHighAdj || '5';

    // === SECTION 11: Marketing Strategy ===
    document.getElementById('marketingApproach').value = data.marketingApproach ||
        'Targeted marketing campaign to qualified multifamily investors including institutional buyers, private equity, and 1031 exchange buyers.';
    document.getElementById('targetBuyer').value = data.targetBuyer ||
        'Private investors, family offices, regional operators, and institutional buyers seeking stable cash flow with value-add potential.';
    document.getElementById('keySellingPoints').value = data.keySellingPoints ||
        '• Strong in-place cash flow\n• Value-add opportunity through unit renovations\n• Excellent location with strong demographics\n• Well-maintained property with recent capital improvements\n• Assumable financing available (if applicable)';
}

function populateDefaultComps(data) {
    const container = document.getElementById('compsContainer');
    container.innerHTML = '';

    const sampleComps = [
        { name: 'Comparable Sale 1', date: '2024-06', units: 48, year: 2018, price: 8500000, capRate: 5.5, occ: 95, dist: 1.2 },
        { name: 'Comparable Sale 2', date: '2024-03', units: 64, year: 2015, price: 11200000, capRate: 5.75, occ: 94, dist: 2.5 },
        { name: 'Comparable Sale 3', date: '2023-11', units: 36, year: 2020, price: 7200000, capRate: 5.25, occ: 97, dist: 3.1 }
    ];

    const comps = data.comps && data.comps.length > 0 ? data.comps : sampleComps;

    comps.forEach((comp, i) => {
        const row = document.createElement('div');
        row.className = 'comp-row';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${comp.name || ''}" placeholder="Property Name">
                <input type="month" class="compDate" value="${comp.date || ''}">
                <input type="number" class="compUnits" value="${comp.units || ''}" placeholder="Units">
                <input type="number" class="compYearBuilt" value="${comp.year || ''}" placeholder="Year Built">
                <input type="number" class="compPrice" value="${comp.price || ''}" placeholder="Sale Price">
                <input type="number" class="compCapRate" value="${comp.capRate || ''}" step="0.01" placeholder="Cap Rate">
                <input type="number" class="compOccupancy" value="${comp.occ || ''}" placeholder="Occupancy %">
                <input type="number" class="compDistance" value="${comp.dist || ''}" step="0.1" placeholder="Distance (mi)">
            </div>
        `;
        container.appendChild(row);
    });
}

function populateDefaultRentComps(data) {
    const container = document.getElementById('rentCompsContainer');
    container.innerHTML = '';

    const sampleRentComps = [
        { name: 'Rent Comp 1', units: 120, year: 2019, occ: 96, rent: 1450, psf: 1.75, dist: 0.8 },
        { name: 'Rent Comp 2', units: 96, year: 2016, occ: 94, rent: 1325, psf: 1.65, dist: 1.5 },
        { name: 'Rent Comp 3', units: 72, year: 2021, occ: 97, rent: 1550, psf: 1.85, dist: 2.0 }
    ];

    const rentComps = data.rentComps && data.rentComps.length > 0 ? data.rentComps : sampleRentComps;

    rentComps.forEach((rc, i) => {
        const row = document.createElement('div');
        row.className = 'rent-comp-row';
        row.innerHTML = `
            <div class="comp-header">Rent Comp #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeRentCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name || ''}">
                <input type="number" class="rentCompUnits" value="${rc.units || ''}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year || ''}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ || ''}">
                <input type="number" class="rentCompAvgRent" value="${rc.rent || ''}">
                <input type="number" class="rentCompPSF" value="${rc.psf || ''}">
                <input type="number" class="rentCompDistance" value="${rc.dist || ''}">
            </div>
        `;
        container.appendChild(row);
    });
}

function populateUnitMix(unitMix) {
    const container = document.getElementById('unitMixContainer');
    container.innerHTML = '';

    unitMix.forEach(unit => {
        const row = document.createElement('div');
        row.className = 'unit-row';
        row.innerHTML = `
            <input type="text" placeholder="Unit Type" class="unitType" value="${unit.type || ''}">
            <input type="number" placeholder="# Units" class="unitCount" value="${unit.count || ''}">
            <input type="number" placeholder="Avg SF" class="unitSF" value="${unit.sf || ''}">
            <input type="number" placeholder="Current Rent $" class="currentRent" value="${unit.currentRent || ''}">
            <input type="number" placeholder="Market Rent $" class="marketRent" value="${unit.marketRent || ''}">
            <button type="button" class="remove-unit-btn" onclick="removeUnitRow(this)">×</button>
        `;
        container.appendChild(row);
    });
}

function populateFormFromRentRoll(data) {
    if (!data || !data.units) return;

    // Aggregate by unit type
    const unitTypes = {};
    data.units.forEach(unit => {
        const type = unit.type || 'Unknown';
        if (!unitTypes[type]) {
            unitTypes[type] = {
                type: type,
                count: 0,
                totalSF: 0,
                totalRent: 0,
                totalMarketRent: 0
            };
        }
        unitTypes[type].count++;
        unitTypes[type].totalSF += unit.sqft || 0;
        unitTypes[type].totalRent += unit.rent || 0;
        unitTypes[type].totalMarketRent += unit.marketRent || unit.rent || 0;
    });

    // Convert to unit mix array
    const unitMix = Object.values(unitTypes).map(ut => ({
        type: ut.type,
        count: ut.count,
        sf: ut.count > 0 ? Math.round(ut.totalSF / ut.count) : 0,
        currentRent: ut.count > 0 ? Math.round(ut.totalRent / ut.count) : 0,
        marketRent: ut.count > 0 ? Math.round(ut.totalMarketRent / ut.count) : 0
    }));

    if (unitMix.length > 0) {
        populateUnitMix(unitMix);
    }

    // Update summary fields
    if (data.summary) {
        document.getElementById('numUnits').value = data.summary.totalUnits || '';
        const occupancy = data.summary.totalUnits > 0 ?
            ((data.summary.occupiedUnits / data.summary.totalUnits) * 100).toFixed(1) : '';
        document.getElementById('occupancyRate').value = occupancy;
    }
}

function populateFormFromT12(data) {
    if (!data) return;

    // Income
    if (data.income.otherIncome) {
        document.getElementById('otherIncome').value = Math.round(data.income.otherIncome);
    }

    // Calculate vacancy rate if we have GPR and vacancy loss
    if (data.income.gpr > 0 && data.income.vacancyLoss > 0) {
        const vacancyRate = (data.income.vacancyLoss / data.income.gpr * 100).toFixed(1);
        document.getElementById('vacancyRate').value = vacancyRate;
    }

    // Expenses
    if (data.expenses.realEstateTaxes) {
        document.getElementById('realEstateTaxes').value = Math.round(data.expenses.realEstateTaxes);
    }
    if (data.expenses.insurance) {
        document.getElementById('insurance').value = Math.round(data.expenses.insurance);
    }
    if (data.expenses.payroll) {
        document.getElementById('payroll').value = Math.round(data.expenses.payroll);
    }
    if (data.expenses.repairsMaintenance) {
        document.getElementById('repairsMaintenance').value = Math.round(data.expenses.repairsMaintenance);
    }
    if (data.expenses.utilities) {
        document.getElementById('utilitiesExpense').value = Math.round(data.expenses.utilities);
    }
    if (data.expenses.adminExpense) {
        document.getElementById('adminExpense').value = Math.round(data.expenses.adminExpense);
    }
    if (data.expenses.marketing) {
        document.getElementById('marketing').value = Math.round(data.expenses.marketing);
    }
    if (data.expenses.contractServices) {
        document.getElementById('contractServices').value = Math.round(data.expenses.contractServices);
    }

    // Calculate management fee percentage if we have EGI and management fee
    if (data.income.egi > 0 && data.expenses.management > 0) {
        const mgmtPct = (data.expenses.management / data.income.egi * 100).toFixed(1);
        document.getElementById('managementFeePercent').value = mgmtPct;
    }
}

// UI Helper Functions
function showExtractionStatus(message) {
    const statusEl = document.getElementById('extractionStatus');
    const messageEl = document.getElementById('extractionMessage');
    statusEl.style.display = 'block';
    messageEl.textContent = message;
}

function hideExtractionStatus() {
    document.getElementById('extractionStatus').style.display = 'none';
}

function logExtraction(message, isError = false) {
    const logEl = document.getElementById('extractionLog');
    const entry = document.createElement('div');
    entry.className = isError ? 'log-error' : 'log-success';
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logEl.appendChild(entry);
}

function showExtractedSummary() {
    const summaryEl = document.getElementById('extractedSummary');
    const gridEl = document.getElementById('summaryGrid');

    let html = '';

    if (extractedData.om) {
        const om = extractedData.om;
        html += `
            <div class="summary-card">
                <h4>Property Info (from OM)</h4>
                <ul>
                    ${om.propertyName ? `<li><strong>Name:</strong> ${om.propertyName}</li>` : ''}
                    ${om.address ? `<li><strong>Address:</strong> ${om.address}</li>` : ''}
                    ${om.city ? `<li><strong>City:</strong> ${om.city}, ${om.state} ${om.zipCode}</li>` : ''}
                    ${om.numUnits ? `<li><strong>Units:</strong> ${om.numUnits}</li>` : ''}
                    ${om.yearBuilt ? `<li><strong>Year Built:</strong> ${om.yearBuilt}</li>` : ''}
                    ${om.buildingSize ? `<li><strong>Building SF:</strong> ${parseInt(om.buildingSize).toLocaleString()}</li>` : ''}
                    ${om.unitMix.length > 0 ? `<li><strong>Unit Types:</strong> ${om.unitMix.length} found</li>` : ''}
                </ul>
            </div>
        `;
    }

    if (extractedData.rentRoll && extractedData.rentRoll.summary) {
        const rr = extractedData.rentRoll.summary;
        html += `
            <div class="summary-card">
                <h4>Rent Roll Summary</h4>
                <ul>
                    <li><strong>Total Units:</strong> ${rr.totalUnits}</li>
                    <li><strong>Occupied:</strong> ${rr.occupiedUnits}</li>
                    <li><strong>Vacant:</strong> ${rr.vacantUnits}</li>
                    <li><strong>Avg Rent:</strong> $${Math.round(rr.avgRent).toLocaleString()}</li>
                </ul>
            </div>
        `;
    }

    if (extractedData.t12) {
        const t12 = extractedData.t12;
        html += `
            <div class="summary-card">
                <h4>T12 Summary</h4>
                <ul>
                    ${t12.income.gpr ? `<li><strong>GPR:</strong> $${t12.income.gpr.toLocaleString()}</li>` : ''}
                    ${t12.income.egi ? `<li><strong>EGI:</strong> $${t12.income.egi.toLocaleString()}</li>` : ''}
                    ${t12.expenses.total ? `<li><strong>Expenses:</strong> $${t12.expenses.total.toLocaleString()}</li>` : ''}
                    ${t12.noi ? `<li><strong>NOI:</strong> $${t12.noi.toLocaleString()}</li>` : ''}
                </ul>
            </div>
        `;
    }

    if (html) {
        gridEl.innerHTML = html;
        summaryEl.style.display = 'block';
    }
}
