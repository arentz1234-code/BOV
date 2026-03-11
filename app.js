// Tab functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Photo upload handling
let propertyPhotoData = null;

document.getElementById('photoUploadZone').addEventListener('click', () => {
    document.getElementById('photoFile').click();
});

document.getElementById('photoFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handlePhotoUpload(file);
    }
});

document.getElementById('photoUploadZone').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
});

document.getElementById('photoUploadZone').addEventListener('dragleave', (e) => {
    e.currentTarget.classList.remove('drag-over');
});

document.getElementById('photoUploadZone').addEventListener('drop', (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handlePhotoUpload(file);
    }
});

function handlePhotoUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        propertyPhotoData = e.target.result;
        const preview = document.getElementById('photoPreview');
        preview.src = propertyPhotoData;
        preview.style.display = 'block';
        document.getElementById('photoUploadZone').classList.add('has-file');
        document.getElementById('photoStatus').innerHTML = `<span class="file-name">${file.name}</span>`;
        document.getElementById('photoStatus').classList.add('success');
    };
    reader.readAsDataURL(file);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Format currency with dollar sign and commas
function formatCurrency(input) {
    // Remove all non-digit characters
    let value = input.value.replace(/[^0-9]/g, '');

    if (value === '') {
        input.value = '';
        return;
    }

    // Convert to number and format with commas
    const number = parseInt(value, 10);
    input.value = '$' + number.toLocaleString('en-US');
}

// Parse currency string to number (removes $ and commas)
function parseCurrency(value) {
    if (!value) return 0;
    return parseInt(value.replace(/[$,]/g, ''), 10) || 0;
}

// Auto-update average row when unit values change
document.getElementById('unitMixContainer').addEventListener('input', (e) => {
    if (e.target.closest('.unit-row:not(.average-row)')) {
        updateAverageRow();
    }
});

// Unit Mix Management
let compCount = 1;

function addUnitRow() {
    const container = document.getElementById('unitMixContainer');
    const row = document.createElement('div');
    row.className = 'unit-row';
    row.innerHTML = `
        <input type="text" placeholder="e.g., 1BR/1BA" class="unitType">
        <input type="number" placeholder="0" class="unitCount">
        <input type="number" placeholder="0" class="unitSF">
        <input type="text" placeholder="$0" class="currentRent" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
        <input type="text" placeholder="$0" class="marketRent" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
        <button type="button" class="remove-unit-btn" onclick="removeUnitRow(this)">×</button>
    `;

    // Insert before average row if it exists
    const avgRow = container.querySelector('.average-row');
    if (avgRow) {
        container.insertBefore(row, avgRow);
    } else {
        container.appendChild(row);
    }

    // Recalculate average
    updateAverageRow();
}

function removeUnitRow(btn) {
    const container = document.getElementById('unitMixContainer');
    const unitRows = container.querySelectorAll('.unit-row:not(.average-row)');
    if (unitRows.length > 1) {
        btn.parentElement.remove();
        // Recalculate average
        updateAverageRow();
    }
}

function updateAverageRow() {
    const container = document.getElementById('unitMixContainer');
    const unitRows = container.querySelectorAll('.unit-row:not(.average-row)');

    // Calculate totals and weighted averages
    let totalUnits = 0;
    let totalSF = 0;
    let totalCurrentRent = 0;
    let totalMarketRent = 0;

    unitRows.forEach(row => {
        const count = parseInt(row.querySelector('.unitCount').value) || 0;
        const sf = parseInt(row.querySelector('.unitSF').value) || 0;
        const currentRent = parseCurrency(row.querySelector('.currentRent').value);
        const marketRent = parseCurrency(row.querySelector('.marketRent').value);

        totalUnits += count;
        totalSF += sf * count;
        totalCurrentRent += currentRent * count;
        totalMarketRent += marketRent * count;
    });

    const avgSF = totalUnits > 0 ? Math.round(totalSF / totalUnits) : 0;
    const avgCurrentRent = totalUnits > 0 ? Math.round(totalCurrentRent / totalUnits) : 0;
    const avgMarketRent = totalUnits > 0 ? Math.round(totalMarketRent / totalUnits) : 0;

    // Format currency values
    const formattedCurrentRent = '$' + avgCurrentRent.toLocaleString('en-US');
    const formattedMarketRent = '$' + avgMarketRent.toLocaleString('en-US');

    // Find or create average row
    let avgRow = container.querySelector('.average-row');
    if (!avgRow) {
        avgRow = document.createElement('div');
        avgRow.className = 'unit-row average-row';
        container.appendChild(avgRow);
    }

    avgRow.innerHTML = `
        <input type="text" class="unitType" value="AVERAGE" readonly style="font-weight: bold; background: linear-gradient(135deg, #e6f0ff, #f0f4f8); border: 2px solid #2563eb;">
        <input type="number" class="unitCount" value="${totalUnits}" readonly style="font-weight: bold; background: linear-gradient(135deg, #e6f0ff, #f0f4f8); border: 2px solid #2563eb; text-align: center;">
        <input type="number" class="unitSF" value="${avgSF}" readonly style="font-weight: bold; background: linear-gradient(135deg, #e6f0ff, #f0f4f8); border: 2px solid #2563eb; text-align: center;">
        <input type="text" class="currentRent" value="${formattedCurrentRent}" readonly style="font-weight: bold; background: linear-gradient(135deg, #e6f0ff, #f0f4f8); border: 2px solid #2563eb; text-align: right; font-family: 'Courier New', monospace;">
        <input type="text" class="marketRent" value="${formattedMarketRent}" readonly style="font-weight: bold; background: linear-gradient(135deg, #e6f0ff, #f0f4f8); border: 2px solid #2563eb; text-align: right; font-family: 'Courier New', monospace;">
        <div style="width: 36px;"></div>
    `;
}

// Comparable Sales Management
function addCompRow() {
    compCount++;
    const container = document.getElementById('compsContainer');
    const row = document.createElement('div');
    row.className = 'comp-row';
    row.innerHTML = `
        <div class="comp-header">Comparable #${compCount} <button type="button" class="remove-unit-btn" onclick="removeCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button></div>
        <div class="comp-grid">
            <input type="text" placeholder="Property Name" class="compName">
            <input type="month" placeholder="Sale Date" class="compDate">
            <input type="number" placeholder="Units" class="compUnits">
            <input type="number" placeholder="Year" class="compYearBuilt">
            <input type="text" placeholder="$0" class="compPrice" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="number" placeholder="0.00" step="0.01" class="compCapRate">
            <input type="number" placeholder="%" class="compOccupancy">
            <input type="number" placeholder="mi" step="0.1" class="compDistance">
        </div>
    `;
    container.appendChild(row);
}

function removeCompRow(btn) {
    btn.closest('.comp-row').remove();
    // Renumber remaining comps
    document.querySelectorAll('.comp-row .comp-header').forEach((header, idx) => {
        const btnHtml = header.querySelector('button') ? header.querySelector('button').outerHTML : '';
        header.innerHTML = `Comparable #${idx + 1} ${btnHtml}`;
    });
    compCount = document.querySelectorAll('.comp-row').length;
}

// Rent Comparables Management
let rentCompCount = 1;

function addRentCompRow() {
    rentCompCount++;
    const container = document.getElementById('rentCompsContainer');
    const row = document.createElement('div');
    row.className = 'rent-comp-row';
    row.innerHTML = `
        <div class="comp-header">Rent Comp #${rentCompCount} <button type="button" class="remove-unit-btn" onclick="removeRentCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button></div>
        <div class="rent-comp-grid">
            <input type="text" placeholder="Property Name" class="rentCompName">
            <input type="number" placeholder="Units" class="rentCompUnits">
            <input type="number" placeholder="Year" class="rentCompYearBuilt">
            <input type="number" placeholder="%" class="rentCompOccupancy">
            <input type="text" placeholder="$0" class="rentCompAvgRent" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="number" placeholder="$/SF" step="0.01" class="rentCompPSF">
            <input type="number" placeholder="mi" step="0.1" class="rentCompDistance">
        </div>
    `;
    container.appendChild(row);
}

function removeRentCompRow(btn) {
    btn.closest('.rent-comp-row').remove();
    // Renumber remaining rent comps
    document.querySelectorAll('.rent-comp-row .comp-header').forEach((header, idx) => {
        const btnHtml = header.querySelector('button') ? header.querySelector('button').outerHTML : '';
        header.innerHTML = `Rent Comp #${idx + 1} ${btnHtml}`;
    });
    rentCompCount = document.querySelectorAll('.rent-comp-row').length;
}

// Collect rent comparables data
function getRentCompsData() {
    const rentComps = [];
    document.querySelectorAll('.rent-comp-row').forEach(row => {
        const name = row.querySelector('.rentCompName').value;
        const units = parseInt(row.querySelector('.rentCompUnits').value) || 0;
        const yearBuilt = row.querySelector('.rentCompYearBuilt').value;
        const occupancy = parseFloat(row.querySelector('.rentCompOccupancy').value) || 0;
        const avgRent = parseFloat(row.querySelector('.rentCompAvgRent').value) || 0;
        const psf = parseFloat(row.querySelector('.rentCompPSF').value) || 0;
        const distance = parseFloat(row.querySelector('.rentCompDistance').value) || 0;

        if (name) {
            rentComps.push({ name, units, yearBuilt, occupancy, avgRent, psf, distance });
        }
    });
    return rentComps;
}

// Toggle Debt Section
function toggleDebtSection() {
    const checkbox = document.getElementById('hasAssumableDebt');
    const section = document.getElementById('debtSection');
    section.classList.toggle('hidden', !checkbox.checked);
}

// Format currency
function formatCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return '$0';
    return '$' + Math.round(num).toLocaleString('en-US');
}

// Format percentage
function formatPercent(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0.00%';
    return num.toFixed(decimals) + '%';
}

// Get form value
function getValue(id, defaultVal = '') {
    const el = document.getElementById(id);
    if (!el) return defaultVal;
    return el.value || defaultVal;
}

function getNumericValue(id, defaultVal = 0) {
    const val = parseFloat(getValue(id));
    return isNaN(val) ? defaultVal : val;
}

// Collect unit mix data (excluding the average row)
function getUnitMixData() {
    const units = [];
    document.querySelectorAll('.unit-row:not(.average-row)').forEach(row => {
        const type = row.querySelector('.unitType').value;
        const count = parseInt(row.querySelector('.unitCount').value) || 0;
        const sf = parseInt(row.querySelector('.unitSF').value) || 0;
        const currentRent = parseCurrency(row.querySelector('.currentRent').value);
        const marketRent = parseCurrency(row.querySelector('.marketRent').value);

        if (type && count > 0) {
            units.push({ type, count, sf, currentRent, marketRent });
        }
    });
    return units;
}

// Collect comparable sales data
function getCompsData() {
    const comps = [];
    document.querySelectorAll('.comp-row').forEach(row => {
        const name = row.querySelector('.compName').value;
        const date = row.querySelector('.compDate').value;
        const units = parseInt(row.querySelector('.compUnits').value) || 0;
        const yearBuilt = row.querySelector('.compYearBuilt').value;
        const price = parseCurrency(row.querySelector('.compPrice').value);
        const capRate = parseFloat(row.querySelector('.compCapRate').value) || 0;
        const occupancy = parseFloat(row.querySelector('.compOccupancy').value) || 0;
        const distance = parseFloat(row.querySelector('.compDistance').value) || 0;

        if (name && price > 0) {
            comps.push({ name, date, units, yearBuilt, price, capRate, occupancy, distance });
        }
    });
    return comps;
}

// Collect rent comparable data
function getRentCompsData() {
    const rentComps = [];
    document.querySelectorAll('.rent-comp-row').forEach(row => {
        const name = row.querySelector('.rentCompName').value;
        const units = parseInt(row.querySelector('.rentCompUnits').value) || 0;
        const yearBuilt = row.querySelector('.rentCompYearBuilt').value;
        const occupancy = parseFloat(row.querySelector('.rentCompOccupancy').value) || 0;
        const avgRent = parseCurrency(row.querySelector('.rentCompAvgRent').value);
        const psf = parseFloat(row.querySelector('.rentCompPSF').value) || 0;
        const distance = parseFloat(row.querySelector('.rentCompDistance').value) || 0;

        if (name && avgRent > 0) {
            rentComps.push({ name, units, yearBuilt, occupancy, avgRent, psf, distance });
        }
    });
    return rentComps;
}

// Generate BOV Document
function generateBOV() {
    // Collect all data
    const data = {
        // Property Info
        propertyName: getValue('propertyName', 'Subject Property'),
        propertyAddress: getValue('propertyAddress', '[Address not provided]'),
        city: getValue('city', '[City]'),
        state: getValue('state', '[State]'),
        zipCode: getValue('zipCode', ''),
        county: getValue('county', '[County not provided]'),
        parcelId: getValue('parcelId', '[APN not provided]'),
        propertyType: getValue('propertyType', '[Type not specified]'),
        yearBuilt: getValue('yearBuilt', '[Year not provided]'),
        yearRenovated: getValue('yearRenovated', 'N/A'),
        lotSize: getNumericValue('lotSize', 0),
        buildingSize: getNumericValue('buildingSize', 0),
        numUnits: getNumericValue('numUnits', 0),
        occupancyRate: getNumericValue('occupancyRate', 0),
        constructionType: getValue('constructionType', '[Not provided]'),
        parking: getValue('parking', '[Not provided]'),
        utilities: getValue('utilities', '[Not provided]'),
        zoning: getValue('zoning', '[Not provided]'),

        // Unit Mix
        unitMix: getUnitMixData(),

        // Income & Expenses
        otherIncome: getNumericValue('otherIncome', 0),
        vacancyRate: getNumericValue('vacancyRate', 5),
        realEstateTaxes: getNumericValue('realEstateTaxes', 0),
        insurance: getNumericValue('insurance', 0),
        managementFeePercent: getNumericValue('managementFeePercent', 5),
        repairsMaintenance: getNumericValue('repairsMaintenance', 0),
        utilitiesExpense: getNumericValue('utilitiesExpense', 0),
        otherExpenses: getNumericValue('otherExpenses', 0),
        reservesPerUnit: getNumericValue('reservesPerUnit', 250),

        // Capital & Condition
        recentCapex: getValue('recentCapex', '[Not provided]'),
        deferredMaintenance: getValue('deferredMaintenance', '[Not provided]'),
        renovationCostPerUnit: getNumericValue('renovationCostPerUnit', 0),
        unitsToRenovate: getNumericValue('unitsToRenovate', 0),

        // Market Data
        submarket: getValue('submarket', '[Submarket]'),
        msa: getValue('msa', '[MSA not provided]'),
        msaPopulation: getValue('msaPopulation', '[Not provided]'),
        populationGrowth: getNumericValue('populationGrowth', 0),
        majorEmployers: getValue('majorEmployers', '[Not provided]'),
        submarketVacancy: getNumericValue('submarketVacancy', 5),
        rentGrowthYoY: getNumericValue('rentGrowthYoY', 0),
        newSupply: getNumericValue('newSupply', 0),
        marketCapRateLow: getNumericValue('marketCapRateLow', 5),
        marketCapRateHigh: getNumericValue('marketCapRateHigh', 6),

        // Comps
        comps: getCompsData(),
        compNarrative: getValue('compNarrative', '[Comparable analysis narrative not provided]'),

        // Rent Comps
        rentComps: getRentCompsData(),

        // Property Photo
        propertyPhoto: propertyPhotoData,

        // Debt
        hasAssumableDebt: document.getElementById('hasAssumableDebt').checked,
        lenderName: getValue('lenderName', ''),
        loanBalance: getNumericValue('loanBalance', 0),
        interestRate: getNumericValue('interestRate', 0),
        rateType: getValue('rateType', 'Fixed'),
        maturityDate: getValue('maturityDate', ''),
        ioRemaining: getValue('ioRemaining', 'None'),
        annualDebtService: getNumericValue('annualDebtService', 0),

        // Seller & Broker
        sellerTimeline: getValue('sellerTimeline', '[Not specified]'),
        pricingExpectation: getValue('pricingExpectation', '[Not specified]'),
        dealStructure: getValue('dealStructure', '[Not specified]'),
        brokerName: getValue('brokerName', '[Broker Name]'),
        brokerLicense: getValue('brokerLicense', '[License #]'),
        brokerageFirm: getValue('brokerageFirm', '[Brokerage Firm]'),
        brokerageAddress: getValue('brokerageAddress', '[Address]'),
        clientName: getValue('clientName', '[Client Name]'),
        brokerBio: getValue('brokerBio', '[Broker qualifications not provided]'),

        // Valuation
        appliedCapRate: getNumericValue('appliedCapRate', 5.5),
        stabilizedCapRate: getNumericValue('stabilizedCapRate', 5.25),
        valueLowAdj: getNumericValue('valueLowAdj', -3),
        valueHighAdj: getNumericValue('valueHighAdj', 3),

        // Marketing
        marketingApproach: getValue('marketingApproach', 'Broad Market'),
        targetBuyer: getValue('targetBuyer', '[Target buyer not specified]'),
        keySellingPoints: getValue('keySellingPoints', '').split('\n').filter(p => p.trim())
    };

    // Calculate financials
    const financials = calculateFinancials(data);

    // Generate HTML
    const bovHtml = generateBOVHtml(data, financials);

    // Display
    document.getElementById('bov-output').innerHTML = bovHtml;
    switchTab('preview');
}

function calculateFinancials(data) {
    // Calculate GPR from unit mix
    let totalUnits = 0;
    let totalCurrentRent = 0;
    let totalMarketRent = 0;
    let totalSF = 0;

    data.unitMix.forEach(unit => {
        totalUnits += unit.count;
        totalCurrentRent += unit.count * unit.currentRent;
        totalMarketRent += unit.count * unit.marketRent;
        totalSF += unit.count * unit.sf;
    });

    // If no unit mix provided, estimate from numUnits
    if (totalUnits === 0) {
        totalUnits = data.numUnits;
    }

    const avgCurrentRent = totalUnits > 0 ? totalCurrentRent / totalUnits : 0;
    const avgMarketRent = totalUnits > 0 ? totalMarketRent / totalUnits : 0;

    // Annual figures
    const gpr = totalCurrentRent * 12;
    const proFormaGpr = totalMarketRent * 12;
    const vacancyLoss = gpr * (data.vacancyRate / 100);
    const proFormaVacancyLoss = proFormaGpr * (data.vacancyRate / 100);
    const egi = gpr - vacancyLoss + data.otherIncome;
    const proFormaEgi = proFormaGpr - proFormaVacancyLoss + data.otherIncome;

    // Expenses
    const managementFee = egi * (data.managementFeePercent / 100);
    const proFormaManagementFee = proFormaEgi * (data.managementFeePercent / 100);
    const reserves = totalUnits * data.reservesPerUnit;

    const totalExpenses = data.realEstateTaxes + data.insurance + managementFee +
                         data.repairsMaintenance + data.utilitiesExpense +
                         data.otherExpenses + reserves;

    const proFormaTotalExpenses = data.realEstateTaxes + data.insurance + proFormaManagementFee +
                                  data.repairsMaintenance + data.utilitiesExpense +
                                  data.otherExpenses + reserves;

    const noi = egi - totalExpenses;
    const proFormaNoi = proFormaEgi - proFormaTotalExpenses;

    const expenseRatio = egi > 0 ? (totalExpenses / egi) * 100 : 0;

    // Valuation
    const indicatedValue = noi / (data.appliedCapRate / 100);
    const proFormaValue = proFormaNoi / (data.stabilizedCapRate / 100);
    const renovationCost = data.renovationCostPerUnit * data.unitsToRenovate;
    const valueAddUpside = proFormaValue - indicatedValue - renovationCost;

    const valueLow = indicatedValue * (1 + data.valueLowAdj / 100);
    const valueHigh = indicatedValue * (1 + data.valueHighAdj / 100);
    const suggestedListPrice = indicatedValue;

    const pricePerUnit = totalUnits > 0 ? indicatedValue / totalUnits : 0;
    const pricePerUnitLow = totalUnits > 0 ? valueLow / totalUnits : 0;
    const pricePerUnitHigh = totalUnits > 0 ? valueHigh / totalUnits : 0;

    const impliedCapRateLow = valueLow > 0 ? (noi / valueHigh) * 100 : 0;
    const impliedCapRateHigh = valueHigh > 0 ? (noi / valueLow) * 100 : 0;

    // Debt metrics
    let dscr = 0;
    let ltv = 0;
    if (data.hasAssumableDebt && data.annualDebtService > 0) {
        dscr = noi / data.annualDebtService;
        ltv = indicatedValue > 0 ? (data.loanBalance / indicatedValue) * 100 : 0;
    }

    return {
        totalUnits,
        totalSF,
        avgCurrentRent,
        avgMarketRent,
        gpr,
        proFormaGpr,
        vacancyLoss,
        proFormaVacancyLoss,
        egi,
        proFormaEgi,
        managementFee,
        proFormaManagementFee,
        reserves,
        totalExpenses,
        proFormaTotalExpenses,
        noi,
        proFormaNoi,
        expenseRatio,
        indicatedValue,
        proFormaValue,
        renovationCost,
        valueAddUpside,
        valueLow,
        valueHigh,
        suggestedListPrice,
        pricePerUnit,
        pricePerUnitLow,
        pricePerUnitHigh,
        impliedCapRateLow,
        impliedCapRateHigh,
        dscr,
        ltv
    };
}

function generateBOVHtml(data, fin) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullAddress = `${data.propertyAddress}, ${data.city}, ${data.state} ${data.zipCode}`;

    return `
        <!-- COVER PAGE -->
        <div class="cover-page">
            <h1>BROKER OPINION OF VALUE</h1>
            <div class="address">${data.propertyName}<br>${fullAddress}</div>
            ${data.propertyPhoto
                ? `<div class="property-photo"><img src="${data.propertyPhoto}" alt="${data.propertyName}" style="max-width:100%; max-height:400px; border-radius:8px; margin:30px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"></div>`
                : `<div class="photo-placeholder">[INSERT AERIAL OR FAÇADE PHOTO]</div>`}
            <div class="cover-info">
                <strong>Prepared by:</strong> ${data.brokerName}, ${data.brokerageFirm}<br>
                <strong>Prepared for:</strong> ${data.clientName}<br>
                <strong>Date of Opinion:</strong> ${today}
            </div>
            <div class="disclaimer">
                <em>This Broker Opinion of Value is prepared for informational purposes only and does not constitute a certified appraisal. It is intended solely for the use of the named recipient and may not be relied upon by any third party. Values are estimates based on market data available at the time of preparation.</em>
            </div>
        </div>

        <!-- EXECUTIVE SUMMARY -->
        <section>
            <h2>Section 1: Executive Summary</h2>
            <p><strong>${data.propertyName}</strong> is a ${data.numUnits}-unit ${data.propertyType.toLowerCase()} property located at ${fullAddress}. Built in ${data.yearBuilt}${data.yearRenovated !== 'N/A' ? ' and renovated in ' + data.yearRenovated : ''}, the property comprises approximately ${data.buildingSize.toLocaleString()} square feet of gross building area on ${data.lotSize} acres.</p>

            <p>The property is currently ${data.occupancyRate}% occupied with an average in-place rent of ${formatCurrency(fin.avgCurrentRent)} per unit. ${fin.avgMarketRent > fin.avgCurrentRent ? `There is meaningful upside potential with market rents averaging ${formatCurrency(fin.avgMarketRent)}, representing a ${formatPercent(((fin.avgMarketRent - fin.avgCurrentRent) / fin.avgCurrentRent) * 100, 1)} premium to in-place rents.` : 'Current rents are at or near market levels.'}</p>

            <p>Based on our analysis of comparable sales, current market conditions, and the property's income-producing potential, we have concluded the following value range:</p>

            <div class="value-box">
                <h3>VALUATION SUMMARY</h3>
                <div class="value-grid">
                    <div class="value-item">
                        <div class="value-label">Concluded As-Is Value</div>
                        <div class="value-amount">${formatCurrency(fin.valueLow)} – ${formatCurrency(fin.valueHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Price Per Unit</div>
                        <div class="value-amount">${formatCurrency(fin.pricePerUnitLow)} – ${formatCurrency(fin.pricePerUnitHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Implied Cap Rate (In-Place)</div>
                        <div class="value-amount">${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Suggested List Price</div>
                        <div class="value-amount">${formatCurrency(fin.suggestedListPrice)}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- PROPERTY DESCRIPTION -->
        <section>
            <h2>Section 2: Property Description</h2>

            <h3>2A. General Property Information</h3>
            <table>
                <tr><td><strong>Address</strong></td><td>${fullAddress}</td></tr>
                <tr><td><strong>County / State</strong></td><td>${data.county} / ${data.state}</td></tr>
                <tr><td><strong>Parcel ID (APN)</strong></td><td>${data.parcelId}</td></tr>
                <tr><td><strong>Property Type</strong></td><td>${data.propertyType}</td></tr>
                <tr><td><strong>Year Built / Renovated</strong></td><td>${data.yearBuilt} / ${data.yearRenovated}</td></tr>
                <tr><td><strong>Lot Size</strong></td><td>${data.lotSize} acres</td></tr>
                <tr><td><strong>Building Size (GBA)</strong></td><td>${data.buildingSize.toLocaleString()} SF</td></tr>
                <tr><td><strong>Number of Units</strong></td><td>${data.numUnits}</td></tr>
                <tr><td><strong>Unit Mix</strong></td><td>${data.unitMix.map(u => `${u.count} × ${u.type}`).join(', ') || '[See table below]'}</td></tr>
                <tr><td><strong>Parking</strong></td><td>${data.parking}</td></tr>
                <tr><td><strong>Construction Type</strong></td><td>${data.constructionType}</td></tr>
                <tr><td><strong>Utilities</strong></td><td>${data.utilities}</td></tr>
                <tr><td><strong>Zoning</strong></td><td>${data.zoning}</td></tr>
            </table>

            <h3>2B. Unit Mix & Rent Roll Summary</h3>
            <table>
                <thead>
                    <tr>
                        <th>Unit Type</th>
                        <th># Units</th>
                        <th>Avg SF</th>
                        <th>Current Rent</th>
                        <th>Market Rent</th>
                        <th>Upside</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.unitMix.map(u => `
                        <tr>
                            <td>${u.type}</td>
                            <td>${u.count}</td>
                            <td>${u.sf.toLocaleString()}</td>
                            <td>${formatCurrency(u.currentRent)}</td>
                            <td>${formatCurrency(u.marketRent)}</td>
                            <td>${formatPercent(u.currentRent > 0 ? ((u.marketRent - u.currentRent) / u.currentRent) * 100 : 0, 1)}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background: #e2e8f0;">
                        <td>Totals / Averages</td>
                        <td>${fin.totalUnits}</td>
                        <td>${fin.totalUnits > 0 ? Math.round(fin.totalSF / fin.totalUnits).toLocaleString() : '—'}</td>
                        <td>${formatCurrency(fin.avgCurrentRent)}</td>
                        <td>${formatCurrency(fin.avgMarketRent)}</td>
                        <td>${formatPercent(fin.avgCurrentRent > 0 ? ((fin.avgMarketRent - fin.avgCurrentRent) / fin.avgCurrentRent) * 100 : 0, 1)}</td>
                    </tr>
                </tbody>
            </table>

            <h3>2C. Physical Condition & Capital Needs</h3>
            <p><strong>Recent Capital Expenditures:</strong> ${data.recentCapex}</p>
            <p><strong>Deferred Maintenance / Known Capital Needs:</strong> ${data.deferredMaintenance}</p>
        </section>

        <!-- MARKET ANALYSIS -->
        <section>
            <h2>Section 3: Market Analysis</h2>

            <h3>3A. Submarket Overview</h3>
            <p>The subject property is located in the <strong>${data.submarket}</strong> submarket of the ${data.msa} metropolitan statistical area. The MSA has a population of approximately ${data.msaPopulation} and has experienced population growth of ${formatPercent(data.populationGrowth, 1)} year-over-year.</p>
            <p><strong>Major Employers:</strong> ${data.majorEmployers}</p>
            <p>The submarket currently reports a vacancy rate of ${formatPercent(data.submarketVacancy, 1)}, ${data.submarketVacancy < 5 ? 'indicating a tight rental market with strong demand' : data.submarketVacancy < 7 ? 'indicating healthy market conditions' : 'reflecting current market softness'}. There are approximately ${data.newSupply.toLocaleString()} units under construction or planned within a 3-mile radius of the subject property.</p>

            <h3>3B. Rental Rate Trends</h3>
            <p>Year-over-year rent growth in the submarket has been ${formatPercent(data.rentGrowthYoY, 1)}. ${data.rentGrowthYoY > 3 ? 'This above-average growth reflects strong demand fundamentals.' : data.rentGrowthYoY > 0 ? 'This modest growth is consistent with a stable market.' : 'Rent growth has been flat to negative as the market absorbs new supply.'}</p>

            <h3>3C. Cap Rate Environment</h3>
            <p>Current market cap rates for comparable ${data.propertyType.toLowerCase()} assets in this market range from ${formatPercent(data.marketCapRateLow)} to ${formatPercent(data.marketCapRateHigh)}. The buyer pool for this asset type typically includes local private investors, regional syndicators, and 1031 exchange buyers seeking value-add opportunities or stable cash flow.</p>
        </section>

        <!-- COMPARABLE SALES -->
        <section>
            <h2>Section 4: Comparable Sales Analysis</h2>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Property</th>
                        <th>Sale Date</th>
                        <th>Units</th>
                        <th>Year Built</th>
                        <th>Sale Price</th>
                        <th>$/Unit</th>
                        <th>Cap Rate</th>
                        <th>Occ.</th>
                        <th>Dist.</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.comps.map((c, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${c.name}</td>
                            <td>${c.date ? new Date(c.date).toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : '—'}</td>
                            <td>${c.units}</td>
                            <td>${c.yearBuilt}</td>
                            <td>${formatCurrency(c.price)}</td>
                            <td>${formatCurrency(c.units > 0 ? c.price / c.units : 0)}</td>
                            <td>${formatPercent(c.capRate)}</td>
                            <td>${c.occupancy}%</td>
                            <td>${c.distance} mi</td>
                        </tr>
                    `).join('')}
                    <tr class="subject-row">
                        <td>—</td>
                        <td><strong>Subject</strong></td>
                        <td>—</td>
                        <td>${data.numUnits}</td>
                        <td>${data.yearBuilt}</td>
                        <td><strong>${formatCurrency(fin.valueLow)} – ${formatCurrency(fin.valueHigh)}</strong></td>
                        <td><strong>${formatCurrency(fin.pricePerUnitLow)} – ${formatCurrency(fin.pricePerUnitHigh)}</strong></td>
                        <td><strong>${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</strong></td>
                        <td>${data.occupancyRate}%</td>
                        <td>—</td>
                    </tr>
                </tbody>
            </table>

            <p style="margin-top: 20px;">${data.compNarrative}</p>

            ${data.rentComps && data.rentComps.length > 0 ? `
            <h3>4B. Rent Comparables</h3>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Property</th>
                        <th>Units</th>
                        <th>Year Built</th>
                        <th>Occupancy</th>
                        <th>Avg Rent</th>
                        <th>$/SF</th>
                        <th>Distance</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.rentComps.map((rc, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${rc.name}</td>
                            <td>${rc.units}</td>
                            <td>${rc.yearBuilt || '—'}</td>
                            <td>${rc.occupancy}%</td>
                            <td>${formatCurrency(rc.avgRent)}</td>
                            <td>$${rc.psf.toFixed(2)}</td>
                            <td>${rc.distance} mi</td>
                        </tr>
                    `).join('')}
                    <tr class="subject-row">
                        <td>—</td>
                        <td><strong>Subject</strong></td>
                        <td>${data.numUnits}</td>
                        <td>${data.yearBuilt}</td>
                        <td>${data.occupancyRate}%</td>
                        <td><strong>${formatCurrency(fin.avgCurrentRent)}</strong></td>
                        <td><strong>$${fin.totalSF > 0 ? ((fin.avgCurrentRent * 12) / (fin.totalSF / fin.totalUnits)).toFixed(2) : '—'}</strong></td>
                        <td>—</td>
                    </tr>
                </tbody>
            </table>
            ` : ''}
        </section>

        <!-- INCOME & VALUATION -->
        <section>
            <h2>Section 5: Income & Valuation Analysis</h2>

            <h3>5A. In-Place (As-Is) Income Analysis</h3>
            <div class="income-statement">
<div class="line-item"><span>GROSS POTENTIAL RENT (GPR)</span><span></span></div>
<div class="line-item"><span>  ${fin.totalUnits} units × ${formatCurrency(fin.avgCurrentRent)} avg × 12</span><span>${formatCurrency(fin.gpr)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>VACANCY & CREDIT LOSS</span><span></span></div>
<div class="line-item"><span>  ${formatPercent(data.vacancyRate, 1)} vacancy allowance</span><span>(${formatCurrency(fin.vacancyLoss)})</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>OTHER INCOME</span><span></span></div>
<div class="line-item"><span>  Laundry / Parking / Fees / RUBS</span><span>${formatCurrency(data.otherIncome)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item total-line"><span>EFFECTIVE GROSS INCOME (EGI)</span><span>${formatCurrency(fin.egi)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>OPERATING EXPENSES</span><span></span></div>
<div class="line-item"><span>  Real Estate Taxes</span><span>(${formatCurrency(data.realEstateTaxes)})</span></div>
<div class="line-item"><span>  Insurance</span><span>(${formatCurrency(data.insurance)})</span></div>
<div class="line-item"><span>  Property Management (${formatPercent(data.managementFeePercent, 1)} of EGI)</span><span>(${formatCurrency(fin.managementFee)})</span></div>
<div class="line-item"><span>  Repairs & Maintenance</span><span>(${formatCurrency(data.repairsMaintenance)})</span></div>
<div class="line-item"><span>  Utilities (owner-paid)</span><span>(${formatCurrency(data.utilitiesExpense)})</span></div>
<div class="line-item"><span>  Landscaping / Pest / Other</span><span>(${formatCurrency(data.otherExpenses)})</span></div>
<div class="line-item"><span>  Reserves for Replacement (${formatCurrency(data.reservesPerUnit)}/unit/yr)</span><span>(${formatCurrency(fin.reserves)})</span></div>
<div class="line-item total-line"><span>TOTAL OPERATING EXPENSES</span><span>(${formatCurrency(fin.totalExpenses)})</span></div>
<div class="line-item"><span>Expense Ratio</span><span>${formatPercent(fin.expenseRatio, 1)}</span></div>
<div class="line-item noi-line"><span>NET OPERATING INCOME (NOI)</span><span>${formatCurrency(fin.noi)}</span></div>
            </div>

            <h3>5B. Valuation via Direct Capitalization</h3>
            <div class="income-statement">
<div class="line-item"><span>As-Is NOI:</span><span>${formatCurrency(fin.noi)}</span></div>
<div class="line-item"><span>Applied Cap Rate:</span><span>${formatPercent(data.appliedCapRate)}</span></div>
<div class="line-item total-line"><span>Indicated Value:</span><span><strong>${formatCurrency(fin.indicatedValue)}</strong></span></div>
<div class="line-item"><span>Price Per Unit:</span><span><strong>${formatCurrency(fin.pricePerUnit)}</strong></span></div>
            </div>

            ${data.unitsToRenovate > 0 && data.renovationCostPerUnit > 0 ? `
            <h3>5C. Value-Add Scenario</h3>
            <div class="income-statement">
<div class="line-item"><span>Pro Forma Market Rent (avg):</span><span>${formatCurrency(fin.avgMarketRent)}/unit/mo</span></div>
<div class="line-item"><span>Pro Forma GPR:</span><span>${formatCurrency(fin.proFormaGpr)}</span></div>
<div class="line-item"><span>Pro Forma Vacancy (${formatPercent(data.vacancyRate, 1)}):</span><span>(${formatCurrency(fin.proFormaVacancyLoss)})</span></div>
<div class="line-item"><span>Pro Forma Other Income:</span><span>${formatCurrency(data.otherIncome)}</span></div>
<div class="line-item total-line"><span>Pro Forma EGI:</span><span>${formatCurrency(fin.proFormaEgi)}</span></div>
<div class="line-item"><span>Pro Forma Expenses:</span><span>(${formatCurrency(fin.proFormaTotalExpenses)})</span></div>
<div class="line-item noi-line"><span>Pro Forma NOI:</span><span>${formatCurrency(fin.proFormaNoi)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>Stabilized Cap Rate Applied:</span><span>${formatPercent(data.stabilizedCapRate)}</span></div>
<div class="line-item"><span>Pro Forma Value:</span><span>${formatCurrency(fin.proFormaValue)}</span></div>
<div class="line-item"><span>Estimated Renovation Cost:</span><span>(${formatCurrency(fin.renovationCost)}) (${data.unitsToRenovate} units × ${formatCurrency(data.renovationCostPerUnit)}/unit)</span></div>
<div class="line-item total-line"><span>Net Value-Add Upside:</span><span><strong>${formatCurrency(fin.valueAddUpside)}</strong></span></div>
            </div>
            ` : ''}
        </section>

        ${data.hasAssumableDebt ? `
        <!-- DEBT ASSUMPTION -->
        <section>
            <h2>Section 6: Debt Assumption Analysis</h2>
            <div class="debt-table">
                <table>
                    <tr><td><strong>Lender</strong></td><td>${data.lenderName || '[Not provided]'}</td></tr>
                    <tr><td><strong>Outstanding Balance</strong></td><td>${formatCurrency(data.loanBalance)}</td></tr>
                    <tr><td><strong>Interest Rate</strong></td><td>${formatPercent(data.interestRate)} (${data.rateType})</td></tr>
                    <tr><td><strong>Maturity Date</strong></td><td>${data.maturityDate ? new Date(data.maturityDate + '-01').toLocaleDateString('en-US', {month: 'long', year: 'numeric'}) : '[Not provided]'}</td></tr>
                    <tr><td><strong>IO Period Remaining</strong></td><td>${data.ioRemaining} months</td></tr>
                    <tr><td><strong>Annual Debt Service</strong></td><td>${formatCurrency(data.annualDebtService)}</td></tr>
                    <tr><td><strong>DSCR (in-place)</strong></td><td>${fin.dscr.toFixed(2)}x</td></tr>
                    <tr><td><strong>Loan-to-Value (at indicated value)</strong></td><td>${formatPercent(fin.ltv, 1)}</td></tr>
                </table>
            </div>
            <p style="margin-top: 15px;">${data.interestRate < 6 ? 'The assumable financing represents a significant buyer advantage given current market rates.' : 'The existing financing may be assumed subject to lender approval and standard assumption fees.'}</p>
        </section>
        ` : ''}

        <!-- VALUATION CONCLUSION -->
        <section>
            <h2>Section 7: Valuation Conclusion</h2>
            <p>Based on our analysis of comparable sales, current market cap rates, and the subject property's income-producing characteristics, we have concluded a value range for the property. The comparable sales support pricing in the ${formatCurrency(fin.pricePerUnitLow)} to ${formatCurrency(fin.pricePerUnitHigh)} per unit range, while the direct capitalization approach at a ${formatPercent(data.appliedCapRate)} cap rate indicates a value of ${formatCurrency(fin.indicatedValue)}.</p>

            <p>Considering the property's ${data.occupancyRate}% occupancy, ${data.yearBuilt < 1990 ? 'vintage condition' : 'relative age'}, ${fin.avgMarketRent > fin.avgCurrentRent ? 'value-add potential through rent increases,' : ''} and submarket fundamentals, we believe the property should be positioned competitively to attract qualified buyers within the concluded range.</p>

            <div class="value-box">
                <h3>VALUATION CONCLUSION</h3>
                <div class="value-grid">
                    <div class="value-item">
                        <div class="value-label">As-Is Value Range</div>
                        <div class="value-amount">${formatCurrency(fin.valueLow)} – ${formatCurrency(fin.valueHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Price Per Unit</div>
                        <div class="value-amount">${formatCurrency(fin.pricePerUnitLow)} – ${formatCurrency(fin.pricePerUnitHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Implied In-Place Cap Rate</div>
                        <div class="value-amount">${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Suggested List Price</div>
                        <div class="value-amount">${formatCurrency(fin.suggestedListPrice)}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- MARKETING STRATEGY -->
        <section>
            <h2>Section 8: Marketing & Disposition Strategy</h2>

            <h3>8A. Suggested Go-to-Market Approach</h3>
            <p><strong>Approach:</strong> ${data.marketingApproach}</p>
            <p>We recommend a comprehensive marketing campaign targeting qualified buyers with a typical timeline of 3-6 weeks to offers, followed by a 30-60 day closing period.</p>
            <p><strong>Seller's Timeline:</strong> ${data.sellerTimeline}</p>
            <p><strong>Pricing Expectation:</strong> ${data.pricingExpectation}</p>
            <p><strong>Deal Structure Preference:</strong> ${data.dealStructure}</p>

            <h3>8B. Target Buyer Profile</h3>
            <p>${data.targetBuyer}</p>

            <h3>8C. Key Selling Points</h3>
            <ul>
                ${data.keySellingPoints.length > 0 ? data.keySellingPoints.map(p => `<li>${p}</li>`).join('') : '<li>[Key selling points not provided]</li>'}
            </ul>
        </section>

        <!-- BROKER QUALIFICATIONS -->
        <section>
            <h2>Section 9: Broker Qualifications & Disclosures</h2>

            <h3>Broker Qualifications</h3>
            <p><strong>Broker:</strong> ${data.brokerName}</p>
            <p><strong>License Number:</strong> ${data.brokerLicense}</p>
            <p><strong>Firm:</strong> ${data.brokerageFirm}</p>
            <p><strong>Address:</strong> ${data.brokerageAddress}</p>
            <p>${data.brokerBio}</p>

            <h3>Disclosures</h3>
            <div class="disclaimer">
                <p>This Broker Opinion of Value (BOV) is not an appraisal and has not been prepared in accordance with the Uniform Standards of Professional Appraisal Practice (USPAP). It is prepared by a licensed real estate broker based on publicly available market data, comparable sales, and information provided by the owner. The conclusions herein represent the broker's professional judgment and are subject to change based on additional information, market conditions, or due diligence findings. This document is confidential and intended solely for the named recipient.</p>
            </div>
        </section>
    `;
}

// Load Sample Data
function loadSampleData() {
    // Property Info
    document.getElementById('propertyName').value = 'Sunset Gardens Apartments';
    document.getElementById('propertyAddress').value = '4521 Riverside Drive';
    document.getElementById('city').value = 'Austin';
    document.getElementById('state').value = 'TX';
    document.getElementById('zipCode').value = '78741';
    document.getElementById('county').value = 'Travis';
    document.getElementById('parcelId').value = '02-1234-5678-00';
    document.getElementById('propertyType').value = 'Multifamily';
    document.getElementById('yearBuilt').value = '1986';
    document.getElementById('yearRenovated').value = '2019';
    document.getElementById('lotSize').value = '3.2';
    document.getElementById('buildingSize').value = '52000';
    document.getElementById('numUnits').value = '64';
    document.getElementById('occupancyRate').value = '94';
    document.getElementById('constructionType').value = 'Wood Frame with Brick Veneer';
    document.getElementById('parking').value = '128 surface spaces (2:1 ratio)';
    document.getElementById('utilities').value = 'Tenant-paid electric; Owner-paid water/sewer/trash';
    document.getElementById('zoning').value = 'MF-3 (Multifamily Medium Density)';

    // Unit Mix - clear existing and add sample data
    const unitContainer = document.getElementById('unitMixContainer');
    unitContainer.innerHTML = '';

    const unitData = [
        { type: '1BR/1BA', count: 10, sf: 800, current: 2100, market: 2225 },
        { type: '2BR/1BA (A)', count: 3, sf: 1050, current: 2650, market: 2795 },
        { type: '2BR/1BA (B)', count: 3, sf: 1080, current: 2525, market: 2650 },
        { type: '2BR/2BA (A)', count: 30, sf: 1175, current: 2850, market: 3025 },
        { type: '2BR/2BA (B)', count: 12, sf: 1300, current: 3025, market: 3200 },
        { type: '2BR/2BA (C)', count: 2, sf: 1375, current: 2975, market: 3125 },
        { type: '3BR/2BA', count: 4, sf: 1550, current: 3450, market: 3650 }
    ];

    unitData.forEach(u => {
        const row = document.createElement('div');
        row.className = 'unit-row';
        const formattedCurrent = '$' + u.current.toLocaleString('en-US');
        const formattedMarket = '$' + u.market.toLocaleString('en-US');
        row.innerHTML = `
            <input type="text" placeholder="e.g., 1BR/1BA" class="unitType" value="${u.type}">
            <input type="number" placeholder="0" class="unitCount" value="${u.count}">
            <input type="number" placeholder="0" class="unitSF" value="${u.sf}">
            <input type="text" placeholder="$0" class="currentRent" value="${formattedCurrent}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="text" placeholder="$0" class="marketRent" value="${formattedMarket}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <button type="button" class="remove-unit-btn" onclick="removeUnitRow(this)">×</button>
        `;
        unitContainer.appendChild(row);
    });

    // Add average row
    updateAverageRow();

    // Income & Expenses
    document.getElementById('otherIncome').value = '38400';
    document.getElementById('vacancyRate').value = '5';
    document.getElementById('realEstateTaxes').value = '98000';
    document.getElementById('insurance').value = '32000';
    document.getElementById('managementFeePercent').value = '5';
    document.getElementById('repairsMaintenance').value = '42000';
    document.getElementById('utilitiesExpense').value = '48000';
    document.getElementById('otherExpenses').value = '24000';
    document.getElementById('reservesPerUnit').value = '300';

    // Capital & Condition
    document.getElementById('recentCapex').value = 'Roof replaced 2022 ($185,000); Common area renovations completed 2019 ($120,000); New pool equipment 2021 ($25,000)';
    document.getElementById('deferredMaintenance').value = 'Parking lot resurfacing needed within 2 years (est. $65,000); 24 units have original interiors requiring renovation';
    document.getElementById('renovationCostPerUnit').value = '12500';
    document.getElementById('unitsToRenovate').value = '24';

    // Market Data
    document.getElementById('submarket').value = 'East Austin';
    document.getElementById('msa').value = 'Austin-Round Rock-Georgetown';
    document.getElementById('msaPopulation').value = '2.4 million';
    document.getElementById('populationGrowth').value = '2.8';
    document.getElementById('majorEmployers').value = 'Tesla, Apple, Dell Technologies, Samsung, University of Texas, St. David\'s Healthcare';
    document.getElementById('submarketVacancy').value = '5.8';
    document.getElementById('rentGrowthYoY').value = '4.2';
    document.getElementById('newSupply').value = '1250';
    document.getElementById('marketCapRateLow').value = '5.00';
    document.getElementById('marketCapRateHigh').value = '5.75';

    // Comparable Sales
    const compContainer = document.getElementById('compsContainer');
    compContainer.innerHTML = '';
    compCount = 0;

    const compData = [
        { name: 'River Oaks Apartments, 3200 E Riverside Dr', date: '2025-11-15', units: 72, year: 1988, price: 8640000, cap: 5.35, occ: 96, dist: 0.8 },
        { name: 'Eastside Flats, 5100 E 7th St', date: '2025-09-22', units: 56, year: 1992, price: 6440000, cap: 5.50, occ: 93, dist: 1.2 },
        { name: 'Bluebonnet Village, 2800 Manor Rd', date: '2025-08-10', units: 84, year: 1984, price: 9660000, cap: 5.65, occ: 91, dist: 2.1 },
        { name: 'Pecan Grove Apartments, 4800 S Congress Ave', date: '2025-06-30', units: 48, year: 1990, price: 5760000, cap: 5.25, occ: 97, dist: 3.5 }
    ];

    compData.forEach((c, i) => {
        compCount++;
        const row = document.createElement('div');
        row.className = 'comp-row';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name}">
                <input type="date" class="compDate" value="${c.date}">
                <input type="number" class="compUnits" value="${c.units}">
                <input type="number" class="compYearBuilt" value="${c.year}">
                <input type="number" class="compPrice" value="${c.price}">
                <input type="number" class="compCapRate" value="${c.cap}">
                <input type="number" class="compOccupancy" value="${c.occ}">
                <input type="number" class="compDistance" value="${c.dist}">
            </div>
        `;
        compContainer.appendChild(row);
    });

    document.getElementById('compNarrative').value = 'The subject property compares favorably to the comparable sales. Comps 1 and 4 represent superior locations with higher price points, while Comps 2 and 3 are slightly inferior in terms of vintage and condition. After adjustments for age (subject renovated 2019), unit mix (subject has favorable 2BR concentration), and location (subject benefits from Riverside Drive frontage), we conclude the subject should trade at the mid-to-upper range of the comparable set, supported by the value-add potential in the unrenovated units.';

    // Rent Comparables
    const rentCompContainer = document.getElementById('rentCompsContainer');
    rentCompContainer.innerHTML = '';
    rentCompCount = 0;

    const rentCompData = [
        { name: 'The Edison at Riverside', units: 180, year: 2020, occ: 96, rent: 1425, psf: 1.85, dist: 0.5 },
        { name: 'Eastwood Apartments', units: 92, year: 1995, occ: 94, rent: 1275, psf: 1.62, dist: 0.8 },
        { name: 'Montage at East Austin', units: 240, year: 2018, occ: 95, rent: 1550, psf: 1.95, dist: 1.5 },
        { name: 'Travis Heights Living', units: 68, year: 1982, occ: 92, rent: 1195, psf: 1.48, dist: 2.0 }
    ];

    rentCompData.forEach((rc, i) => {
        rentCompCount++;
        const row = document.createElement('div');
        row.className = 'rent-comp-row';
        row.innerHTML = `
            <div class="comp-header">Rent Comp #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeRentCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name}">
                <input type="number" class="rentCompUnits" value="${rc.units}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ}">
                <input type="number" class="rentCompAvgRent" value="${rc.rent}">
                <input type="number" class="rentCompPSF" value="${rc.psf}">
                <input type="number" class="rentCompDistance" value="${rc.dist}">
            </div>
        `;
        rentCompContainer.appendChild(row);
    });

    // Debt
    document.getElementById('hasAssumableDebt').checked = true;
    toggleDebtSection();
    document.getElementById('lenderName').value = 'Fannie Mae (Serviced by Walker & Dunlop)';
    document.getElementById('loanBalance').value = '4200000';
    document.getElementById('interestRate').value = '4.35';
    document.getElementById('rateType').value = 'Fixed';
    document.getElementById('maturityDate').value = '2029-08';
    document.getElementById('ioRemaining').value = '0';
    document.getElementById('annualDebtService').value = '252000';

    // Seller & Broker
    document.getElementById('sellerTimeline').value = 'Prefer closing within 60 days; flexible on close date if pricing is strong';
    document.getElementById('pricingExpectation').value = '$7.5M - $8.0M';
    document.getElementById('dealStructure').value = 'Prefer loan assumption; will consider all-cash offers at appropriate pricing';
    document.getElementById('brokerName').value = 'Michael Richardson';
    document.getElementById('brokerLicense').value = 'TX-0587234';
    document.getElementById('brokerageFirm').value = 'Lone Star Investment Properties';
    document.getElementById('brokerageAddress').value = '100 Congress Avenue, Suite 1500, Austin, TX 78701';
    document.getElementById('clientName').value = 'Riverside Holdings LLC';
    document.getElementById('brokerBio').value = '18+ years of multifamily investment sales experience in Central Texas. Over $750M in closed transactions including 45+ multifamily properties. Former CBRE and Marcus & Millichap. Specializes in value-add and core-plus multifamily assets in the Austin MSA.';

    // Valuation
    document.getElementById('appliedCapRate').value = '5.40';
    document.getElementById('stabilizedCapRate').value = '5.15';
    document.getElementById('valueLowAdj').value = '-3';
    document.getElementById('valueHighAdj').value = '3';

    // Marketing
    document.getElementById('marketingApproach').value = 'Broad Market';
    document.getElementById('targetBuyer').value = 'Value-add syndicators targeting 15%+ IRR; 1031 exchange buyers seeking Austin exposure; Regional operators with renovation experience';
    document.getElementById('keySellingPoints').value = `Below-market rents with 12%+ upside to market across all unit types
Assumable Fannie Mae financing at 4.35% fixed rate (below current market)
Strong East Austin location benefiting from continued urban migration
24 units with unrenovated interiors representing clear value-add opportunity
Recent capital improvements including new roof (2022) and common area renovations (2019)
Proven rent growth in submarket with 4.2% YoY increases`;

    alert('Sample data loaded! Click "Generate BOV" to preview the document.');
}

// Load AZUL Property Data (from Offering Memorandum)
function loadAzulData() {
    // Property Info
    document.getElementById('propertyName').value = 'AZUL';
    document.getElementById('propertyAddress').value = '201 Southwest Joan Jefferson Way';
    document.getElementById('city').value = 'Stuart';
    document.getElementById('state').value = 'FL';
    document.getElementById('zipCode').value = '34994';
    document.getElementById('county').value = 'Martin';
    document.getElementById('parcelId').value = '05-38-41-014-004-00060-6';
    document.getElementById('propertyType').value = 'Multifamily';
    document.getElementById('yearBuilt').value = '2019';
    document.getElementById('yearRenovated').value = 'N/A';
    document.getElementById('lotSize').value = '1.48';
    document.getElementById('buildingSize').value = '59414';
    document.getElementById('numUnits').value = '49';
    document.getElementById('occupancyRate').value = '96';
    document.getElementById('constructionType').value = 'Concrete Block, 3 Stories, Metal & TPO Roof';
    document.getElementById('parking').value = 'Garage Port Parking, Surface Parking';
    document.getElementById('utilities').value = 'All utilities paid by resident (Electric, Water/Sewer, Trash, Pest, Cable)';
    document.getElementById('zoning').value = 'RPUD (Residential Planned Unit Development)';

    // Unit Mix - from Actual Rent Roll (12.8.25)
    const unitContainer = document.getElementById('unitMixContainer');
    unitContainer.innerHTML = '';

    const unitData = [
        { type: '1BR/1BA', count: 7, sf: 864, current: 1991, market: 1986 },
        { type: '2BR/1BA (A)', count: 2, sf: 1088, current: 2696, market: 2595 },
        { type: '2BR/1BA (B)', count: 2, sf: 1099, current: 2247, market: 2345 },
        { type: '2BR/2BA (A)', count: 23, sf: 1204, current: 2645, market: 2697 },
        { type: '2BR/2BA (B)', count: 9, sf: 1346, current: 2791, market: 2866 },
        { type: '2BR/2BA (C)', count: 2, sf: 1401, current: 2772, market: 2899 },
        { type: '3BR/2BA', count: 4, sf: 1596, current: 3317, market: 3295 }
    ];

    unitData.forEach(u => {
        const row = document.createElement('div');
        row.className = 'unit-row';
        const formattedCurrent = '$' + u.current.toLocaleString('en-US');
        const formattedMarket = '$' + u.market.toLocaleString('en-US');
        row.innerHTML = `
            <input type="text" placeholder="e.g., 1BR/1BA" class="unitType" value="${u.type}">
            <input type="number" placeholder="0" class="unitCount" value="${u.count}">
            <input type="number" placeholder="0" class="unitSF" value="${u.sf}">
            <input type="text" placeholder="$0" class="currentRent" value="${formattedCurrent}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="text" placeholder="$0" class="marketRent" value="${formattedMarket}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <button type="button" class="remove-unit-btn" onclick="removeUnitRow(this)">×</button>
        `;
        unitContainer.appendChild(row);
    });

    // Add average row
    updateAverageRow();

    // Income & Expenses (Actual T12 from Excel - December 2025)
    // Other Income from T12: $1,554,803 Total Revenue - $1,540,760 GPR = $14,043
    document.getElementById('otherIncome').value = '14043';
    // Physical Vacancy: 2 vacant units (203, 222) out of 49 = 4.08%
    document.getElementById('vacancyRate').value = '4';
    // Real Estate Taxes T12 Actual: $167,788
    document.getElementById('realEstateTaxes').value = '167788';
    // Insurance T12 Actual: $129,979
    document.getElementById('insurance').value = '129979';
    // Management Fee: 3.5% of EGI
    document.getElementById('managementFeePercent').value = '3.5';
    // Repairs & Maintenance T12: $10,571 + Turnover: $8,627 = $19,198
    document.getElementById('repairsMaintenance').value = '19198';
    // Utilities T12 Actual: $133,031 (Electric, Water/Sewer, Trash, Cable, Other)
    document.getElementById('utilitiesExpense').value = '133031';
    // Other Expenses: Payroll $73,500 + Contract Services $22,393 + G&A $9,800 + Marketing $9,800 + Land Lease $48,000 = $163,493
    document.getElementById('otherExpenses').value = '163493';
    // Reserves: $250/unit
    document.getElementById('reservesPerUnit').value = '250';

    // Capital & Condition
    document.getElementById('recentCapex').value = 'Property built in 2019 with modern Class A finishes. Features include 10\' ceiling heights, stainless steel appliances, granite countertops with undermount sinks, white shaker cabinets, and washer/dryer in each unit. Comprehensive amenity set includes clubhouse, fitness center, swimming pool & spa, BBQ grills, and gated community access.';
    document.getElementById('deferredMaintenance').value = 'None identified. Property is only 5 years old with concrete block construction, metal and TPO roofing in excellent condition. No near-term capital expenditure needs anticipated.';
    document.getElementById('renovationCostPerUnit').value = '0';
    document.getElementById('unitsToRenovate').value = '0';

    // Market Data (from OM Pages 22-26)
    document.getElementById('submarket').value = 'Downtown Stuart / Treasure Coast';
    document.getElementById('msa').value = 'Port St. Lucie-Stuart-Fort Pierce, FL MSA';
    document.getElementById('msaPopulation').value = '517,511 (MSA); Stuart: 18,253; 10-mi radius: 305,516';
    document.getElementById('populationGrowth').value = '14.4';  // 10-mile projected growth to 349,435 by 2029
    document.getElementById('majorEmployers').value = 'Cleveland Clinic Martin North Hospital (521-bed, 27K+ patients annually), Martin Memorial Hospital, Vought Aircraft, Indian River State College (22K+ students), Municipal Government';
    document.getElementById('submarketVacancy').value = '5';  // Based on 95% avg occupancy of comps
    document.getElementById('rentGrowthYoY').value = '3.0';
    document.getElementById('newSupply').value = '1200';  // Based on new developments listed (Rio Marine Village, Costco mixed-use, etc.)
    document.getElementById('marketCapRateLow').value = '5.00';
    document.getElementById('marketCapRateHigh').value = '5.75';

    // Comparable Sales (from OM Page 45)
    const compContainer = document.getElementById('compsContainer');
    compContainer.innerHTML = '';
    compCount = 0;

    const compData = [
        { name: 'Indigo Stuart, 3800 South Kanner Highway, Stuart FL', date: '2024-12-10', units: 212, year: 2023, price: 67300000, cap: 5.25, occ: 95, dist: 3.0 }
    ];

    compData.forEach((c, i) => {
        compCount++;
        const row = document.createElement('div');
        row.className = 'comp-row';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name}">
                <input type="date" class="compDate" value="${c.date}">
                <input type="number" class="compUnits" value="${c.units}">
                <input type="number" class="compYearBuilt" value="${c.year}">
                <input type="number" class="compPrice" value="${c.price}">
                <input type="number" class="compCapRate" value="${c.cap}">
                <input type="number" class="compOccupancy" value="${c.occ}">
                <input type="number" class="compDistance" value="${c.dist}">
            </div>
        `;
        compContainer.appendChild(row);
    });

    document.getElementById('compNarrative').value = `The primary sales comparable is Indigo Stuart, which sold in December 2024 for $67.3M ($317,453/unit, $328.29/SF). Indigo Stuart is a 212-unit luxury resort-style community built in 2023, located 3.0 miles from the subject.

AZUL benefits from its 2019 concrete block construction and premier downtown Stuart location adjacent to the St. Lucie River. The subject's boutique size (49 units) commands a per-unit premium given the scarcity of Class A product in this submarket, though the smaller scale limits the institutional buyer pool.

Rent comparables in the market demonstrate strong fundamentals:
- Serenity Stuart (172 units, 2023): 99% occupancy, 2.1 miles
- AxisOne (284 units, 2021): 95% occupancy, 2.5 miles
- Mason Stuart (270 units, 2024): 96% occupancy, 4.7 miles
- Indigo Stuart (212 units, 2023): 95% occupancy, 3.0 miles
- Tradewinds at Hobe Sound (177 units, 2024): 98% occupancy, 11.5 miles

Average occupancy across the competitive set is 95%, supporting the subject's current 96% occupancy. The subject's average rent of $2,634/unit ($2.17/SF) compares favorably to market averages, with 16.73% EGI upside achievable through lease-up to market rents by Year Two.`;

    // Rent Comparables (from OM Page 20)
    const rentCompContainer = document.getElementById('rentCompsContainer');
    rentCompContainer.innerHTML = '';
    rentCompCount = 0;

    const rentCompData = [
        { name: 'Serenity Stuart', units: 172, year: 2023, occ: 99, rent: 2450, psf: 2.15, dist: 2.1 },
        { name: 'AxisOne', units: 284, year: 2021, occ: 95, rent: 2380, psf: 2.08, dist: 2.5 },
        { name: 'Mason Stuart', units: 270, year: 2024, occ: 96, rent: 2520, psf: 2.22, dist: 4.7 },
        { name: 'Indigo Stuart', units: 212, year: 2023, occ: 95, rent: 2485, psf: 2.18, dist: 3.0 },
        { name: 'Tradewinds at Hobe Sound', units: 177, year: 2024, occ: 98, rent: 2295, psf: 2.05, dist: 11.5 }
    ];

    rentCompData.forEach((rc, i) => {
        rentCompCount++;
        const row = document.createElement('div');
        row.className = 'rent-comp-row';
        row.innerHTML = `
            <div class="comp-header">Rent Comp #${i + 1}${i > 0 ? ' <button type="button" class="remove-unit-btn" onclick="removeRentCompRow(this)" style="float:right;width:28px;height:28px;font-size:1rem;">×</button>' : ''}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name}">
                <input type="number" class="rentCompUnits" value="${rc.units}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ}">
                <input type="number" class="rentCompAvgRent" value="${rc.rent}">
                <input type="number" class="rentCompPSF" value="${rc.psf}">
                <input type="number" class="rentCompDistance" value="${rc.dist}">
            </div>
        `;
        rentCompContainer.appendChild(row);
    });

    // No Assumable Debt - offered free and clear
    document.getElementById('hasAssumableDebt').checked = false;
    toggleDebtSection();

    // Seller & Broker (Listing info from Marcus & Millichap OM Pages 3, 54)
    document.getElementById('sellerTimeline').value = 'Market-bid basis with flexible timing; seller will respond to offers as received';
    document.getElementById('pricingExpectation').value = 'TBD by Market - Offers solicited on market-bid basis';
    document.getElementById('dealStructure').value = 'Fee simple interest subject to land lease with City of Stuart; offered free and clear of debt. Listing Broker: Ned Roberts, CCIM & Jason Hague, Marcus & Millichap (Tampa Office)';
    document.getElementById('brokerName').value = '';  // Leave blank for user to fill in
    document.getElementById('brokerLicense').value = '';  // Leave blank for user to fill in
    document.getElementById('brokerageFirm').value = '';  // Leave blank for user to fill in
    document.getElementById('brokerageAddress').value = '';  // Leave blank for user to fill in
    document.getElementById('clientName').value = '[Property Owner]';
    document.getElementById('brokerBio').value = '';  // Leave blank for user to fill in

    // Valuation - based on Actual T12 NOI of $794,404 (GPR $1,540,760, OpEx $760,399)
    document.getElementById('appliedCapRate').value = '5.50';
    document.getElementById('stabilizedCapRate').value = '5.25';
    document.getElementById('valueLowAdj').value = '-5';
    document.getElementById('valueHighAdj').value = '5';

    // Marketing
    document.getElementById('marketingApproach').value = 'Broad Market';
    document.getElementById('targetBuyer').value = 'Private capital and family offices seeking Florida Treasure Coast exposure; 1031 exchange buyers targeting Class A product; Regional operators with sub-100 unit expertise; High-net-worth individuals seeking stable cash flow with growth potential';
    document.getElementById('keySellingPoints').value = `49-unit boutique Class 'A' multifamily community in Downtown Stuart, FL
2019 concrete block construction with 10' ceilings and premium finishes
Immediate walkability to historic downtown Stuart shops and restaurants
96% occupancy with 16.73% EGI upside achievable by Year Two
$97,079 average household income within 5-mile radius ($94,268 within 2-mile)
Attractive unit mix: 78% two-bedroom, 14% one-bedroom, 8% three-bedroom
Washer/dryer in every unit; comprehensive amenity set including pool, spa, fitness center
1.2 miles to Cleveland Clinic Martin North Hospital (521 beds)
15 minutes to I-95 and Stuart Beach / Atlantic Ocean
Named "America's Happiest Seaside Town" (Coastal Living Magazine, 2023)`;

    alert('AZUL property data loaded from Offering Memorandum! Click "Generate BOV" to preview the document.');
}
