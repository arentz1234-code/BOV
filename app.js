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
        <div class="comp-header">Comparable #${compCount}</div>
        <div class="comp-grid">
            <input type="text" placeholder="Property Name" class="compName">
            <input type="month" placeholder="Sale Date" class="compDate">
            <input type="number" placeholder="Units" class="compUnits">
            <input type="number" placeholder="Year" class="compYearBuilt">
            <input type="text" placeholder="$0" class="compPrice" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="number" placeholder="0.00" step="0.01" class="compCapRate">
            <input type="number" placeholder="%" class="compOccupancy">
            <input type="number" placeholder="mi" step="0.1" class="compDistance">
            <button type="button" class="remove-btn" onclick="removeCompRow(this)">×</button>
        </div>
    `;
    container.appendChild(row);
}

function removeCompRow(btn) {
    btn.closest('.comp-row').remove();
    // Renumber remaining comps
    document.querySelectorAll('.comp-row .comp-header').forEach((header, idx) => {
        header.textContent = `Comparable #${idx + 1}`;
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
        <div class="comp-header">Rent Comp #${rentCompCount}</div>
        <div class="rent-comp-grid">
            <input type="text" placeholder="Property Name" class="rentCompName">
            <input type="number" placeholder="Units" class="rentCompUnits">
            <input type="number" placeholder="Year" class="rentCompYearBuilt">
            <input type="number" placeholder="%" class="rentCompOccupancy">
            <input type="text" placeholder="$0" class="rentCompAvgRent" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="number" placeholder="$/SF" step="0.01" class="rentCompPSF">
            <input type="number" placeholder="mi" step="0.1" class="rentCompDistance">
            <button type="button" class="remove-btn" onclick="removeRentCompRow(this)">×</button>
        </div>
    `;
    container.appendChild(row);
}

function removeRentCompRow(btn) {
    btn.closest('.rent-comp-row').remove();
    // Renumber remaining rent comps
    document.querySelectorAll('.rent-comp-row .comp-header').forEach((header, idx) => {
        header.textContent = `Rent Comp #${idx + 1}`;
    });
    rentCompCount = document.querySelectorAll('.rent-comp-row').length;
}

// Toggle Debt Section
function toggleDebtSection() {
    const checkbox = document.getElementById('hasAssumableDebt');
    const section = document.getElementById('debtSection');
    section.classList.toggle('hidden', !checkbox.checked);
}

// Format currency value (for BOV output)
function formatCurrencyValue(num) {
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
        propertyName: getValue('propertyName', ''),
        propertyAddress: getValue('propertyAddress', ''),
        city: getValue('city', ''),
        state: getValue('state', ''),
        zipCode: getValue('zipCode', ''),
        county: getValue('county', ''),
        parcelId: getValue('parcelId', ''),
        propertyType: getValue('propertyType', ''),
        yearBuilt: getValue('yearBuilt', ''),
        yearRenovated: getValue('yearRenovated', ''),
        lotSize: getNumericValue('lotSize', 0),
        buildingSize: getNumericValue('buildingSize', 0),
        numUnits: getNumericValue('numUnits', 0),
        occupancyRate: getNumericValue('occupancyRate', 0),
        constructionType: getValue('constructionType', ''),
        parking: getValue('parking', ''),
        utilities: getValue('utilities', ''),
        zoning: getValue('zoning', ''),

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
        recentCapex: getValue('recentCapex', ''),
        deferredMaintenance: getValue('deferredMaintenance', ''),
        renovationCostPerUnit: getNumericValue('renovationCostPerUnit', 0),
        unitsToRenovate: getNumericValue('unitsToRenovate', 0),

        // Market Data
        submarket: getValue('submarket', ''),
        msa: getValue('msa', ''),
        msaPopulation: getValue('msaPopulation', ''),
        populationGrowth: getNumericValue('populationGrowth', 0),
        majorEmployers: getValue('majorEmployers', ''),
        submarketVacancy: getNumericValue('submarketVacancy', 5),
        rentGrowthYoY: getNumericValue('rentGrowthYoY', 0),
        newSupply: getNumericValue('newSupply', 0),
        marketCapRateLow: getNumericValue('marketCapRateLow', 5),
        marketCapRateHigh: getNumericValue('marketCapRateHigh', 6),

        // Comps
        comps: getCompsData(),
        compNarrative: getValue('compNarrative', ''),

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
        sellerTimeline: getValue('sellerTimeline', ''),
        pricingExpectation: getValue('pricingExpectation', ''),
        dealStructure: getValue('dealStructure', ''),
        brokerName: getValue('brokerName', ''),
        brokerLicense: getValue('brokerLicense', ''),
        brokerageFirm: getValue('brokerageFirm', ''),
        brokerageAddress: getValue('brokerageAddress', ''),
        clientName: getValue('clientName', ''),
        brokerBio: getValue('brokerBio', ''),

        // Valuation
        appliedCapRate: getNumericValue('appliedCapRate', 5.5),
        stabilizedCapRate: getNumericValue('stabilizedCapRate', 5.25),
        valueLowAdj: getNumericValue('valueLowAdj', -3),
        valueHighAdj: getNumericValue('valueHighAdj', 3),

        // Marketing
        marketingApproach: getValue('marketingApproach', 'Broad Market'),
        targetBuyer: getValue('targetBuyer', ''),
        keySellingPoints: getValue('keySellingPoints', '').split('\n').filter(p => p.trim())
    };

    // Calculate financials
    const financials = calculateFinancials(data);

    // Generate HTML
    const bovHtml = generateBOVHtml(data, financials);

    // Display
    document.getElementById('bov-output').innerHTML = bovHtml;
    switchTab('preview');

    // Initialize charts after DOM is updated
    setTimeout(() => {
        initializeCharts(data, financials);
        initializeMap(data.propertyAddress, data.city, data.state);
    }, 100);
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
                : ''}
            <div class="cover-info">
                ${data.brokerName || data.brokerageFirm ? `<strong>Prepared by:</strong> ${[data.brokerName, data.brokerageFirm].filter(x => x).join(', ')}<br>` : ''}
                ${data.clientName ? `<strong>Prepared for:</strong> ${data.clientName}<br>` : ''}
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

            <p>The property is currently ${data.occupancyRate}% occupied with an average in-place rent of ${formatCurrencyValue(fin.avgCurrentRent)} per unit. ${fin.avgMarketRent > fin.avgCurrentRent ? `There is meaningful upside potential with market rents averaging ${formatCurrencyValue(fin.avgMarketRent)}, representing a ${formatPercent(((fin.avgMarketRent - fin.avgCurrentRent) / fin.avgCurrentRent) * 100, 1)} premium to in-place rents.` : 'Current rents are at or near market levels.'}</p>

            <p>Based on our analysis of comparable sales, current market conditions, and the property's income-producing potential, we have concluded the following value range:</p>

            <div class="value-box">
                <h3>VALUATION SUMMARY</h3>
                <div class="value-grid">
                    <div class="value-item">
                        <div class="value-label">Concluded As-Is Value</div>
                        <div class="value-amount">${formatCurrencyValue(fin.valueLow)} – ${formatCurrencyValue(fin.valueHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Price Per Unit</div>
                        <div class="value-amount">${formatCurrencyValue(fin.pricePerUnitLow)} – ${formatCurrencyValue(fin.pricePerUnitHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Implied Cap Rate (In-Place)</div>
                        <div class="value-amount">${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Suggested List Price</div>
                        <div class="value-amount">${formatCurrencyValue(fin.suggestedListPrice)}</div>
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
                ${data.county ? `<tr><td><strong>County / State</strong></td><td>${data.county} / ${data.state}</td></tr>` : ''}
                ${data.parcelId ? `<tr><td><strong>Parcel ID (APN)</strong></td><td>${data.parcelId}</td></tr>` : ''}
                ${data.propertyType ? `<tr><td><strong>Property Type</strong></td><td>${data.propertyType}</td></tr>` : ''}
                <tr><td><strong>Year Built${data.yearRenovated ? ' / Renovated' : ''}</strong></td><td>${data.yearBuilt}${data.yearRenovated ? ' / ' + data.yearRenovated : ''}</td></tr>
                ${data.lotSize ? `<tr><td><strong>Lot Size</strong></td><td>${data.lotSize} acres</td></tr>` : ''}
                <tr><td><strong>Building Size (GBA)</strong></td><td>${data.buildingSize.toLocaleString()} SF</td></tr>
                <tr><td><strong>Number of Units</strong></td><td>${data.numUnits}</td></tr>
                ${data.unitMix.length > 0 ? `<tr><td><strong>Unit Mix</strong></td><td>${data.unitMix.map(u => u.count + ' × ' + u.type).join(', ')}</td></tr>` : ''}
                ${data.parking ? `<tr><td><strong>Parking</strong></td><td>${data.parking}</td></tr>` : ''}
                ${data.constructionType ? `<tr><td><strong>Construction Type</strong></td><td>${data.constructionType}</td></tr>` : ''}
                ${data.utilities ? `<tr><td><strong>Utilities</strong></td><td>${data.utilities}</td></tr>` : ''}
                ${data.zoning ? `<tr><td><strong>Zoning</strong></td><td>${data.zoning}</td></tr>` : ''}
            </table>

            <!-- LOCATION MAP -->
            ${createLocationMap(data.propertyAddress, data.city, data.state)}

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
                            <td>${formatCurrencyValue(u.currentRent)}</td>
                            <td>${formatCurrencyValue(u.marketRent)}</td>
                            <td>${formatPercent(u.currentRent > 0 ? ((u.marketRent - u.currentRent) / u.currentRent) * 100 : 0, 1)}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background: #e2e8f0;">
                        <td>Totals / Averages</td>
                        <td>${fin.totalUnits}</td>
                        <td>${fin.totalUnits > 0 ? Math.round(fin.totalSF / fin.totalUnits).toLocaleString() : '—'}</td>
                        <td>${formatCurrencyValue(fin.avgCurrentRent)}</td>
                        <td>${formatCurrencyValue(fin.avgMarketRent)}</td>
                        <td>${formatPercent(fin.avgCurrentRent > 0 ? ((fin.avgMarketRent - fin.avgCurrentRent) / fin.avgCurrentRent) * 100 : 0, 1)}</td>
                    </tr>
                </tbody>
            </table>

            ${(data.recentCapex || data.deferredMaintenance) ? `<h3>2C. Physical Condition & Capital Needs</h3>
            ${data.recentCapex ? `<p><strong>Recent Capital Expenditures:</strong> ${data.recentCapex}</p>` : ''}
            ${data.deferredMaintenance ? `<p><strong>Deferred Maintenance / Known Capital Needs:</strong> ${data.deferredMaintenance}</p>` : ''}` : ''}
        </section>

        <!-- MARKET ANALYSIS -->
        <section>
            <h2>Section 3: Market Analysis</h2>

            <h3>3A. Submarket Overview</h3>
            <p>The subject property is located in ${data.submarket ? `the <strong>${data.submarket}</strong> submarket of ` : ''}${data.msa ? `the ${data.msa} metropolitan statistical area` : 'the local market'}. ${data.msaPopulation ? `The MSA has a population of approximately ${data.msaPopulation}` : ''}${data.populationGrowth ? ` and has experienced population growth of ${formatPercent(data.populationGrowth, 1)} year-over-year` : ''}.</p>
            ${data.majorEmployers ? `<p><strong>Major Employers:</strong> ${data.majorEmployers}</p>` : ''}
            <p>The submarket currently reports a vacancy rate of ${formatPercent(data.submarketVacancy, 1)}, ${data.submarketVacancy < 5 ? 'indicating a tight rental market with strong demand' : data.submarketVacancy < 7 ? 'indicating healthy market conditions' : 'reflecting current market softness'}. ${data.newSupply ? `There are approximately ${data.newSupply.toLocaleString()} units under construction or planned within a 3-mile radius of the subject property.` : ''}</p>

            <h3>3B. Rental Rate Trends</h3>
            <p>Year-over-year rent growth in the submarket has been ${formatPercent(data.rentGrowthYoY, 1)}. ${data.rentGrowthYoY > 3 ? 'This above-average growth reflects strong demand fundamentals.' : data.rentGrowthYoY > 0 ? 'This modest growth is consistent with a stable market.' : 'Rent growth has been flat to negative as the market absorbs new supply.'}</p>

            <h3>3C. Cap Rate Environment</h3>
            <p>Current market cap rates for comparable ${data.propertyType ? data.propertyType.toLowerCase() : 'multifamily'} assets in this market range from ${formatPercent(data.marketCapRateLow)} to ${formatPercent(data.marketCapRateHigh)}. The buyer pool for this asset type typically includes local private investors, regional syndicators, and 1031 exchange buyers seeking value-add opportunities or stable cash flow.</p>
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
                            <td>${formatCurrencyValue(c.price)}</td>
                            <td>${formatCurrencyValue(c.units > 0 ? c.price / c.units : 0)}</td>
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
                        <td><strong>${formatCurrencyValue(fin.valueLow)} – ${formatCurrencyValue(fin.valueHigh)}</strong></td>
                        <td><strong>${formatCurrencyValue(fin.pricePerUnitLow)} – ${formatCurrencyValue(fin.pricePerUnitHigh)}</strong></td>
                        <td><strong>${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</strong></td>
                        <td>${data.occupancyRate}%</td>
                        <td>—</td>
                    </tr>
                </tbody>
            </table>

            ${data.compNarrative ? `<p style="margin-top: 20px;">${data.compNarrative}</p>` : ''}

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
                            <td>${formatCurrencyValue(rc.avgRent)}</td>
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
                        <td><strong>${formatCurrencyValue(fin.avgCurrentRent)}</strong></td>
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
<div class="line-item"><span>  ${fin.totalUnits} units × ${formatCurrencyValue(fin.avgCurrentRent)} avg × 12</span><span>${formatCurrencyValue(fin.gpr)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>VACANCY & CREDIT LOSS</span><span></span></div>
<div class="line-item"><span>  ${formatPercent(data.vacancyRate, 1)} vacancy allowance</span><span>(${formatCurrencyValue(fin.vacancyLoss)})</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>OTHER INCOME</span><span></span></div>
<div class="line-item"><span>  Laundry / Parking / Fees / RUBS</span><span>${formatCurrencyValue(data.otherIncome)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item total-line"><span>EFFECTIVE GROSS INCOME (EGI)</span><span>${formatCurrencyValue(fin.egi)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>OPERATING EXPENSES</span><span></span></div>
<div class="line-item"><span>  Real Estate Taxes</span><span>(${formatCurrencyValue(data.realEstateTaxes)})</span></div>
<div class="line-item"><span>  Insurance</span><span>(${formatCurrencyValue(data.insurance)})</span></div>
<div class="line-item"><span>  Property Management (${formatPercent(data.managementFeePercent, 1)} of EGI)</span><span>(${formatCurrencyValue(fin.managementFee)})</span></div>
<div class="line-item"><span>  Repairs & Maintenance</span><span>(${formatCurrencyValue(data.repairsMaintenance)})</span></div>
<div class="line-item"><span>  Utilities (owner-paid)</span><span>(${formatCurrencyValue(data.utilitiesExpense)})</span></div>
<div class="line-item"><span>  Landscaping / Pest / Other</span><span>(${formatCurrencyValue(data.otherExpenses)})</span></div>
<div class="line-item"><span>  Reserves for Replacement (${formatCurrencyValue(data.reservesPerUnit)}/unit/yr)</span><span>(${formatCurrencyValue(fin.reserves)})</span></div>
<div class="line-item total-line"><span>TOTAL OPERATING EXPENSES</span><span>(${formatCurrencyValue(fin.totalExpenses)})</span></div>
<div class="line-item"><span>Expense Ratio</span><span>${formatPercent(fin.expenseRatio, 1)}</span></div>
<div class="line-item noi-line"><span>NET OPERATING INCOME (NOI)</span><span>${formatCurrencyValue(fin.noi)}</span></div>
            </div>

            <h3>5B. Valuation via Direct Capitalization</h3>
            <div class="income-statement">
<div class="line-item"><span>As-Is NOI:</span><span>${formatCurrencyValue(fin.noi)}</span></div>
<div class="line-item"><span>Applied Cap Rate:</span><span>${formatPercent(data.appliedCapRate)}</span></div>
<div class="line-item total-line"><span>Indicated Value:</span><span><strong>${formatCurrencyValue(fin.indicatedValue)}</strong></span></div>
<div class="line-item"><span>Price Per Unit:</span><span><strong>${formatCurrencyValue(fin.pricePerUnit)}</strong></span></div>
            </div>

            ${data.unitsToRenovate > 0 && data.renovationCostPerUnit > 0 ? `
            <h3>5C. Value-Add Scenario</h3>
            <div class="income-statement">
<div class="line-item"><span>Pro Forma Market Rent (avg):</span><span>${formatCurrencyValue(fin.avgMarketRent)}/unit/mo</span></div>
<div class="line-item"><span>Pro Forma GPR:</span><span>${formatCurrencyValue(fin.proFormaGpr)}</span></div>
<div class="line-item"><span>Pro Forma Vacancy (${formatPercent(data.vacancyRate, 1)}):</span><span>(${formatCurrencyValue(fin.proFormaVacancyLoss)})</span></div>
<div class="line-item"><span>Pro Forma Other Income:</span><span>${formatCurrencyValue(data.otherIncome)}</span></div>
<div class="line-item total-line"><span>Pro Forma EGI:</span><span>${formatCurrencyValue(fin.proFormaEgi)}</span></div>
<div class="line-item"><span>Pro Forma Expenses:</span><span>(${formatCurrencyValue(fin.proFormaTotalExpenses)})</span></div>
<div class="line-item noi-line"><span>Pro Forma NOI:</span><span>${formatCurrencyValue(fin.proFormaNoi)}</span></div>
<div class="line-item"><span></span><span></span></div>
<div class="line-item"><span>Stabilized Cap Rate Applied:</span><span>${formatPercent(data.stabilizedCapRate)}</span></div>
<div class="line-item"><span>Pro Forma Value:</span><span>${formatCurrencyValue(fin.proFormaValue)}</span></div>
<div class="line-item"><span>Estimated Renovation Cost:</span><span>(${formatCurrencyValue(fin.renovationCost)}) (${data.unitsToRenovate} units × ${formatCurrencyValue(data.renovationCostPerUnit)}/unit)</span></div>
<div class="line-item total-line"><span>Net Value-Add Upside:</span><span><strong>${formatCurrencyValue(fin.valueAddUpside)}</strong></span></div>
            </div>
            ` : ''}

            <!-- FINANCIAL CHARTS -->
            ${createFinancialCharts(data, fin)}

            <!-- SENSITIVITY ANALYSIS -->
            ${generateSensitivityTableHtml(fin.noi, data.appliedCapRate)}
        </section>

        ${data.hasAssumableDebt ? `
        <!-- DEBT ASSUMPTION -->
        <section>
            <h2>Section 6: Debt Assumption Analysis</h2>
            <div class="debt-table">
                <table>
                    ${data.lenderName ? `<tr><td><strong>Lender</strong></td><td>${data.lenderName}</td></tr>` : ''}
                    <tr><td><strong>Outstanding Balance</strong></td><td>${formatCurrencyValue(data.loanBalance)}</td></tr>
                    <tr><td><strong>Interest Rate</strong></td><td>${formatPercent(data.interestRate)} (${data.rateType})</td></tr>
                    ${data.maturityDate ? `<tr><td><strong>Maturity Date</strong></td><td>${new Date(data.maturityDate + '-01').toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</td></tr>` : ''}
                    ${data.ioRemaining ? `<tr><td><strong>IO Period Remaining</strong></td><td>${data.ioRemaining} months</td></tr>` : ''}
                    <tr><td><strong>Annual Debt Service</strong></td><td>${formatCurrencyValue(data.annualDebtService)}</td></tr>
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
            <p>Based on our analysis of comparable sales, current market cap rates, and the subject property's income-producing characteristics, we have concluded a value range for the property. The comparable sales support pricing in the ${formatCurrencyValue(fin.pricePerUnitLow)} to ${formatCurrencyValue(fin.pricePerUnitHigh)} per unit range, while the direct capitalization approach at a ${formatPercent(data.appliedCapRate)} cap rate indicates a value of ${formatCurrencyValue(fin.indicatedValue)}.</p>

            <p>Considering the property's ${data.occupancyRate}% occupancy, ${data.yearBuilt < 1990 ? 'vintage condition' : 'relative age'}, ${fin.avgMarketRent > fin.avgCurrentRent ? 'value-add potential through rent increases,' : ''} and submarket fundamentals, we believe the property should be positioned competitively to attract qualified buyers within the concluded range.</p>

            <div class="value-box">
                <h3>VALUATION CONCLUSION</h3>
                <div class="value-grid">
                    <div class="value-item">
                        <div class="value-label">As-Is Value Range</div>
                        <div class="value-amount">${formatCurrencyValue(fin.valueLow)} – ${formatCurrencyValue(fin.valueHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Price Per Unit</div>
                        <div class="value-amount">${formatCurrencyValue(fin.pricePerUnitLow)} – ${formatCurrencyValue(fin.pricePerUnitHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Implied In-Place Cap Rate</div>
                        <div class="value-amount">${formatPercent(fin.impliedCapRateLow)} – ${formatPercent(fin.impliedCapRateHigh)}</div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Suggested List Price</div>
                        <div class="value-amount">${formatCurrencyValue(fin.suggestedListPrice)}</div>
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
            ${data.sellerTimeline ? `<p><strong>Seller's Timeline:</strong> ${data.sellerTimeline}</p>` : ''}
            ${data.pricingExpectation ? `<p><strong>Pricing Expectation:</strong> ${data.pricingExpectation}</p>` : ''}
            ${data.dealStructure ? `<p><strong>Deal Structure Preference:</strong> ${data.dealStructure}</p>` : ''}

            ${data.targetBuyer ? `<h3>8B. Target Buyer Profile</h3>
            <p>${data.targetBuyer}</p>` : ''}

            ${data.keySellingPoints.length > 0 ? `<h3>8C. Key Selling Points</h3>
            <ul>${data.keySellingPoints.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
        </section>

        <!-- BROKER QUALIFICATIONS -->
        <section>
            <h2>Section 9: Broker Qualifications & Disclosures</h2>

            ${(data.brokerName || data.brokerLicense || data.brokerageFirm || data.brokerageAddress || data.brokerBio) ? `
            <h3>Broker Qualifications</h3>
            ${data.brokerName ? `<p><strong>Broker:</strong> ${data.brokerName}</p>` : ''}
            ${data.brokerLicense ? `<p><strong>License Number:</strong> ${data.brokerLicense}</p>` : ''}
            ${data.brokerageFirm ? `<p><strong>Firm:</strong> ${data.brokerageFirm}</p>` : ''}
            ${data.brokerageAddress ? `<p><strong>Address:</strong> ${data.brokerageAddress}</p>` : ''}
            ${data.brokerBio ? `<p>${data.brokerBio}</p>` : ''}
            ` : ''}

            <h3>Disclosures</h3>
            <div class="disclaimer">
                <p>This Broker Opinion of Value (BOV) is not an appraisal and has not been prepared in accordance with the Uniform Standards of Professional Appraisal Practice (USPAP). It is prepared by a licensed real estate broker based on publicly available market data, comparable sales, and information provided by the owner. The conclusions herein represent the broker's professional judgment and are subject to change based on additional information, market conditions, or due diligence findings. This document is confidential and intended solely for the named recipient.</p>
            </div>
        </section>
    `;
}

// Clear All Data
function clearAllData() {
    // Clear localStorage
    localStorage.removeItem('bovDraft');

    // Reset all form fields
    const form = document.getElementById('bov-form');
    if (form) form.reset();

    // Clear dynamic rows
    const compsContainer = document.getElementById('compsContainer');
    const rentCompsContainer = document.getElementById('rentCompsContainer');
    const unitMixContainer = document.getElementById('unitMixContainer');

    if (compsContainer) compsContainer.innerHTML = '';
    if (rentCompsContainer) rentCompsContainer.innerHTML = '';
    if (unitMixContainer) {
        unitMixContainer.innerHTML = '';
        addUnitRow(); // Add one empty row
    }

    compCount = 0;
    rentCompCount = 0;

    alert('All data cleared! You can now load fresh data.');
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
            <div class="comp-header">Comparable #${i + 1}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name}">
                <input type="text" class="compDate" value="${c.date}" placeholder="YYYY-MM">
                <input type="number" class="compUnits" value="${c.units}">
                <input type="number" class="compYearBuilt" value="${c.year}">
                <input type="text" class="compPrice" value="$${c.price.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="compCapRate" step="0.01" value="${c.cap}">
                <input type="number" class="compOccupancy" value="${c.occ}">
                <input type="number" class="compDistance" step="0.1" value="${c.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeCompRow(this)">×</button>' : '<span></span>'}
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
            <div class="comp-header">Rent Comp #${i + 1}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name}">
                <input type="number" class="rentCompUnits" value="${rc.units}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ}">
                <input type="text" class="rentCompAvgRent" value="$${rc.rent.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="rentCompPSF" step="0.01" value="${rc.psf}">
                <input type="number" class="rentCompDistance" step="0.1" value="${rc.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeRentCompRow(this)">×</button>' : '<span></span>'}
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
    // Clear any stale localStorage data first
    localStorage.removeItem('bovDraft');

    // Set property photo from official website
    const azulPhotoUrl = 'https://images.myrazz.com/uc-image/44e771ce-d422-4ac9-89af-ba2017754e26/-/scale_crop/1200x630/smart/-/format/webp/-/quality/lighter/Azul%20Luxury%20Residences.jpeg.webp';
    propertyPhotoData = azulPhotoUrl;
    const preview = document.getElementById('photoPreview');
    if (preview) {
        preview.src = azulPhotoUrl;
        preview.style.display = 'block';
    }
    document.getElementById('photoUploadZone').classList.add('has-file');
    document.getElementById('photoStatus').innerHTML = '<span class="success">AZUL property photo loaded</span>';

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
        { name: 'Indigo Stuart', date: '2024-12', units: 212, year: 2023, price: 67300000, cap: 5.25, occ: 95, dist: 3.0 },
        { name: 'Mason Stuart', date: '2024-06', units: 270, year: 2024, price: 81000000, cap: 5.35, occ: 96, dist: 4.7 },
        { name: 'AxisOne Stuart', date: '2023-09', units: 284, year: 2021, price: 72500000, cap: 5.50, occ: 95, dist: 2.5 },
        { name: 'Serenity Stuart', date: '2024-03', units: 172, year: 2023, price: 51600000, cap: 5.15, occ: 99, dist: 2.1 }
    ];

    compData.forEach((c, i) => {
        compCount++;
        const row = document.createElement('div');
        row.className = 'comp-row';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name}">
                <input type="text" class="compDate" value="${c.date}" placeholder="YYYY-MM">
                <input type="number" class="compUnits" value="${c.units}">
                <input type="number" class="compYearBuilt" value="${c.year}">
                <input type="text" class="compPrice" value="$${c.price.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="compCapRate" step="0.01" value="${c.cap}">
                <input type="number" class="compOccupancy" value="${c.occ}">
                <input type="number" class="compDistance" step="0.1" value="${c.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeCompRow(this)">×</button>' : '<span></span>'}
            </div>
        `;
        compContainer.appendChild(row);
    });

    document.getElementById('compNarrative').value = `The primary sales comparable is Indigo Stuart, which sold in December 2024 for $67.3M ($317,453/unit, $328.29/SF). Indigo Stuart is a 212-unit luxury resort-style community built in 2023, located 3.0 miles from the subject.

AZUL benefits from its 2019 concrete block construction and premier downtown Stuart location adjacent to the St. Lucie River. The subject's boutique size (49 units) commands a per-unit premium given the scarcity of Class A product in this submarket, though the smaller scale limits the institutional buyer pool.

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
            <div class="comp-header">Rent Comp #${i + 1}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name}">
                <input type="number" class="rentCompUnits" value="${rc.units}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ}">
                <input type="text" class="rentCompAvgRent" value="$${rc.rent.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="rentCompPSF" step="0.01" value="${rc.psf}">
                <input type="number" class="rentCompDistance" step="0.1" value="${rc.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeRentCompRow(this)">×</button>' : '<span></span>'}
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
    document.getElementById('dealStructure').value = 'Fee simple interest subject to land lease with City of Stuart; offered free and clear of debt';
    document.getElementById('brokerName').value = 'Ned Roberts, CCIM & Jason Hague';
    document.getElementById('brokerLicense').value = 'FL SL3146498 & FL SL3421498';
    document.getElementById('brokerageFirm').value = 'Marcus & Millichap';
    document.getElementById('brokerageAddress').value = '201 N Franklin St, Suite 1100, Tampa, FL 33602';
    document.getElementById('clientName').value = 'AZUL Stuart, LLC';
    document.getElementById('brokerBio').value = `Ned Roberts, CCIM - Senior Vice President Investments, National Multi Housing Group. Specializes in multifamily investment sales throughout Florida with over $1B in career transactions.

Jason Hague - Senior Associate, National Multi Housing Group. Focused on Florida multifamily markets with expertise in Class A garden-style and mid-rise communities.`;

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

// ============================================================================
// AUTO-SAVE FUNCTIONALITY
// ============================================================================

const AUTO_SAVE_KEY = 'bovDraft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
let autoSaveTimer = null;

// Initialize auto-save on page load
document.addEventListener('DOMContentLoaded', () => {
    initAutoSave();
    checkForSavedDraft();
});

function initAutoSave() {
    // Auto-save every 30 seconds
    autoSaveTimer = setInterval(autoSave, AUTO_SAVE_INTERVAL);

    // Also save on any form field change
    document.getElementById('bov-form')?.addEventListener('change', debounce(autoSave, 2000));
    document.getElementById('bov-form')?.addEventListener('input', debounce(autoSave, 5000));
}

function autoSave() {
    const formData = collectAllFormData();
    const draft = {
        data: formData,
        savedAt: new Date().toISOString(),
        propertyName: formData.propertyName || 'Untitled Property'
    };

    try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
        showAutoSaveIndicator();
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

function checkForSavedDraft() {
    try {
        const draft = localStorage.getItem(AUTO_SAVE_KEY);
        if (draft) {
            const parsed = JSON.parse(draft);
            const savedDate = new Date(parsed.savedAt);
            const timeDiff = Date.now() - savedDate.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            // Only prompt if draft is less than 24 hours old
            if (hoursDiff < 24) {
                showRestorePrompt(parsed);
            }
        }
    } catch (e) {
        console.warn('Error checking for saved draft:', e);
    }
}

function showRestorePrompt(draft) {
    const savedDate = new Date(draft.savedAt);
    const timeString = savedDate.toLocaleString();

    const modal = document.createElement('div');
    modal.className = 'restore-modal-overlay';
    modal.innerHTML = `
        <div class="restore-modal">
            <h3>Restore Previous Work?</h3>
            <p>Found an auto-saved draft from <strong>${timeString}</strong></p>
            <p>Property: <strong>${draft.propertyName}</strong></p>
            <div class="restore-actions">
                <button class="btn-primary" onclick="restoreDraft()">Restore Draft</button>
                <button class="btn-secondary" onclick="discardDraft()">Start Fresh</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function restoreDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(AUTO_SAVE_KEY));
        if (draft && draft.data) {
            populateFormFromData(draft.data);
            showNotification('Draft restored successfully!', 'success');
        }
    } catch (e) {
        console.error('Error restoring draft:', e);
        showNotification('Error restoring draft', 'error');
    }
    closeRestoreModal();
}

function discardDraft() {
    localStorage.removeItem(AUTO_SAVE_KEY);
    closeRestoreModal();
}

function closeRestoreModal() {
    document.querySelector('.restore-modal-overlay')?.remove();
}

function showAutoSaveIndicator() {
    let indicator = document.querySelector('.auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        document.body.appendChild(indicator);
    }
    indicator.textContent = 'Auto-saved';
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 2000);
}

// ============================================================================
// IMPORT/EXPORT JSON FUNCTIONALITY
// ============================================================================

function exportFormData() {
    const formData = collectAllFormData();
    const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        propertyName: formData.propertyName || 'Untitled',
        data: formData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOV_${formData.propertyName?.replace(/[^a-z0-9]/gi, '_') || 'Export'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Data exported successfully!', 'success');
}

function importFormData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (importData.data) {
                populateFormFromData(importData.data);
                showNotification(`Imported: ${importData.propertyName || 'Property data'}`, 'success');
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('Error importing file: ' + error.message, 'error');
        }
    };
    input.click();
}

function collectAllFormData() {
    return {
        // Property Info
        propertyName: getValue('propertyName'),
        propertyAddress: getValue('propertyAddress'),
        city: getValue('city'),
        state: getValue('state'),
        zipCode: getValue('zipCode'),
        county: getValue('county'),
        parcelId: getValue('parcelId'),
        propertyType: getValue('propertyType'),
        yearBuilt: getValue('yearBuilt'),
        yearRenovated: getValue('yearRenovated'),
        lotSize: getNumericValue('lotSize'),
        buildingSize: getNumericValue('buildingSize'),
        numUnits: getNumericValue('numUnits'),
        occupancyRate: getNumericValue('occupancyRate'),
        constructionType: getValue('constructionType'),
        parking: getValue('parking'),
        utilities: getValue('utilities'),
        zoning: getValue('zoning'),

        // Unit Mix
        unitMix: getUnitMixData(),

        // Income & Expenses
        otherIncome: getNumericValue('otherIncome'),
        vacancyRate: getNumericValue('vacancyRate'),
        realEstateTaxes: getNumericValue('realEstateTaxes'),
        insurance: getNumericValue('insurance'),
        managementFeePercent: getNumericValue('managementFeePercent'),
        repairsMaintenance: getNumericValue('repairsMaintenance'),
        utilitiesExpense: getNumericValue('utilitiesExpense'),
        payroll: getNumericValue('payroll'),
        contractServices: getNumericValue('contractServices'),
        adminExpense: getNumericValue('adminExpense'),
        marketing: getNumericValue('marketing'),
        otherExpenses: getNumericValue('otherExpenses'),
        reservesPerUnit: getNumericValue('reservesPerUnit'),

        // Capital & Condition
        recentCapex: getValue('recentCapex'),
        deferredMaintenance: getValue('deferredMaintenance'),
        renovationCostPerUnit: getNumericValue('renovationCostPerUnit'),
        unitsToRenovate: getNumericValue('unitsToRenovate'),

        // Market Data
        submarket: getValue('submarket'),
        msa: getValue('msa'),
        msaPopulation: getValue('msaPopulation'),
        populationGrowth: getNumericValue('populationGrowth'),
        majorEmployers: getValue('majorEmployers'),
        submarketVacancy: getNumericValue('submarketVacancy'),
        rentGrowthYoY: getNumericValue('rentGrowthYoY'),
        newSupply: getNumericValue('newSupply'),
        avgHouseholdIncome: getValue('avgHouseholdIncome'),
        marketCapRateLow: getNumericValue('marketCapRateLow'),
        marketCapRateHigh: getNumericValue('marketCapRateHigh'),

        // Comps
        comps: getCompsData(),
        compNarrative: getValue('compNarrative'),
        rentComps: getRentCompsData(),

        // Debt
        hasAssumableDebt: document.getElementById('hasAssumableDebt')?.checked || false,
        lenderName: getValue('lenderName'),
        loanBalance: getNumericValue('loanBalance'),
        interestRate: getNumericValue('interestRate'),
        rateType: getValue('rateType'),
        maturityDate: getValue('maturityDate'),
        ioRemaining: getValue('ioRemaining'),
        annualDebtService: getNumericValue('annualDebtService'),

        // Seller & Broker
        sellerTimeline: getValue('sellerTimeline'),
        pricingExpectation: getValue('pricingExpectation'),
        dealStructure: getValue('dealStructure'),
        brokerName: getValue('brokerName'),
        brokerLicense: getValue('brokerLicense'),
        brokerageFirm: getValue('brokerageFirm'),
        brokerageAddress: getValue('brokerageAddress'),
        clientName: getValue('clientName'),
        brokerBio: getValue('brokerBio'),

        // Valuation
        appliedCapRate: getNumericValue('appliedCapRate'),
        stabilizedCapRate: getNumericValue('stabilizedCapRate'),
        valueLowAdj: getNumericValue('valueLowAdj'),
        valueHighAdj: getNumericValue('valueHighAdj'),

        // Marketing
        marketingApproach: getValue('marketingApproach'),
        targetBuyer: getValue('targetBuyer'),
        keySellingPoints: getValue('keySellingPoints'),

        // Photo
        propertyPhoto: propertyPhotoData
    };
}

function populateFormFromData(data) {
    // Property Info
    setFieldValue('propertyName', data.propertyName);
    setFieldValue('propertyAddress', data.propertyAddress);
    setFieldValue('city', data.city);
    setFieldValue('state', data.state);
    setFieldValue('zipCode', data.zipCode);
    setFieldValue('county', data.county);
    setFieldValue('parcelId', data.parcelId);
    setFieldValue('propertyType', data.propertyType);
    setFieldValue('yearBuilt', data.yearBuilt);
    setFieldValue('yearRenovated', data.yearRenovated);
    setFieldValue('lotSize', data.lotSize);
    setFieldValue('buildingSize', data.buildingSize);
    setFieldValue('numUnits', data.numUnits);
    setFieldValue('occupancyRate', data.occupancyRate);
    setFieldValue('constructionType', data.constructionType);
    setFieldValue('parking', data.parking);
    setFieldValue('utilities', data.utilities);
    setFieldValue('zoning', data.zoning);

    // Unit Mix
    if (data.unitMix && data.unitMix.length > 0) {
        populateUnitMixFromData(data.unitMix);
    }

    // Income & Expenses
    setFieldValue('otherIncome', data.otherIncome);
    setFieldValue('vacancyRate', data.vacancyRate);
    setFieldValue('realEstateTaxes', data.realEstateTaxes);
    setFieldValue('insurance', data.insurance);
    setFieldValue('managementFeePercent', data.managementFeePercent);
    setFieldValue('repairsMaintenance', data.repairsMaintenance);
    setFieldValue('utilitiesExpense', data.utilitiesExpense);
    setFieldValue('payroll', data.payroll);
    setFieldValue('contractServices', data.contractServices);
    setFieldValue('adminExpense', data.adminExpense);
    setFieldValue('marketing', data.marketing);
    setFieldValue('otherExpenses', data.otherExpenses);
    setFieldValue('reservesPerUnit', data.reservesPerUnit);

    // Capital & Condition
    setFieldValue('recentCapex', data.recentCapex);
    setFieldValue('deferredMaintenance', data.deferredMaintenance);
    setFieldValue('renovationCostPerUnit', data.renovationCostPerUnit);
    setFieldValue('unitsToRenovate', data.unitsToRenovate);

    // Market Data
    setFieldValue('submarket', data.submarket);
    setFieldValue('msa', data.msa);
    setFieldValue('msaPopulation', data.msaPopulation);
    setFieldValue('populationGrowth', data.populationGrowth);
    setFieldValue('majorEmployers', data.majorEmployers);
    setFieldValue('submarketVacancy', data.submarketVacancy);
    setFieldValue('rentGrowthYoY', data.rentGrowthYoY);
    setFieldValue('newSupply', data.newSupply);
    setFieldValue('avgHouseholdIncome', data.avgHouseholdIncome);
    setFieldValue('marketCapRateLow', data.marketCapRateLow);
    setFieldValue('marketCapRateHigh', data.marketCapRateHigh);

    // Comps
    if (data.comps && data.comps.length > 0) {
        populateCompsFromData(data.comps);
    }
    setFieldValue('compNarrative', data.compNarrative);
    if (data.rentComps && data.rentComps.length > 0) {
        populateRentCompsFromData(data.rentComps);
    }

    // Debt
    if (data.hasAssumableDebt) {
        document.getElementById('hasAssumableDebt').checked = true;
        toggleDebtSection();
        setFieldValue('lenderName', data.lenderName);
        setFieldValue('loanBalance', data.loanBalance);
        setFieldValue('interestRate', data.interestRate);
        setFieldValue('rateType', data.rateType);
        setFieldValue('maturityDate', data.maturityDate);
        setFieldValue('ioRemaining', data.ioRemaining);
        setFieldValue('annualDebtService', data.annualDebtService);
    }

    // Seller & Broker
    setFieldValue('sellerTimeline', data.sellerTimeline);
    setFieldValue('pricingExpectation', data.pricingExpectation);
    setFieldValue('dealStructure', data.dealStructure);
    setFieldValue('brokerName', data.brokerName);
    setFieldValue('brokerLicense', data.brokerLicense);
    setFieldValue('brokerageFirm', data.brokerageFirm);
    setFieldValue('brokerageAddress', data.brokerageAddress);
    setFieldValue('clientName', data.clientName);
    setFieldValue('brokerBio', data.brokerBio);

    // Valuation
    setFieldValue('appliedCapRate', data.appliedCapRate);
    setFieldValue('stabilizedCapRate', data.stabilizedCapRate);
    setFieldValue('valueLowAdj', data.valueLowAdj);
    setFieldValue('valueHighAdj', data.valueHighAdj);

    // Marketing
    setFieldValue('marketingApproach', data.marketingApproach);
    setFieldValue('targetBuyer', data.targetBuyer);
    setFieldValue('keySellingPoints', data.keySellingPoints);

    // Photo
    if (data.propertyPhoto) {
        propertyPhotoData = data.propertyPhoto;
        const preview = document.getElementById('photoPreview');
        if (preview) {
            preview.src = data.propertyPhoto;
            preview.style.display = 'block';
        }
        document.getElementById('photoUploadZone')?.classList.add('has-file');
    }

    // Update average row
    updateAverageRow();
}

function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
        el.value = value;
    }
}

function populateUnitMixFromData(unitMix) {
    const container = document.getElementById('unitMixContainer');
    if (!container) return;
    container.innerHTML = '';

    unitMix.forEach(u => {
        const row = document.createElement('div');
        row.className = 'unit-row';
        row.innerHTML = `
            <input type="text" placeholder="e.g., 1BR/1BA" class="unitType" value="${u.type || ''}">
            <input type="number" placeholder="0" class="unitCount" value="${u.count || ''}">
            <input type="number" placeholder="0" class="unitSF" value="${u.sf || ''}">
            <input type="text" placeholder="$0" class="currentRent" value="${u.currentRent ? '$' + parseInt(u.currentRent).toLocaleString() : ''}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <input type="text" placeholder="$0" class="marketRent" value="${u.marketRent ? '$' + parseInt(u.marketRent).toLocaleString() : ''}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
            <button type="button" class="remove-unit-btn" onclick="removeUnitRow(this)">×</button>
        `;
        container.appendChild(row);
    });

    updateAverageRow();
}

function populateCompsFromData(comps) {
    const container = document.getElementById('compsContainer');
    if (!container) return;
    container.innerHTML = '';
    compCount = 0;

    comps.forEach((c, i) => {
        compCount++;
        const row = document.createElement('div');
        row.className = 'comp-row';
        // Map various field name formats from AI
        const date = c.date || '';
        const units = c.units || '';
        const yearBuilt = c.yearBuilt || c.year_built || c.year || '';
        const price = c.price || c.sale_price || '';
        const capRate = c.capRate || c.cap_rate || c.cap || '';
        const occupancy = c.occupancy || c.occ || '';
        const distance = c.distance || c.dist || '';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name || ''}">
                <input type="month" class="compDate" value="${date}">
                <input type="number" class="compUnits" value="${units}">
                <input type="number" class="compYearBuilt" value="${yearBuilt}">
                <input type="text" class="compPrice" value="${price ? '$' + parseInt(price).toLocaleString() : ''}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="compCapRate" value="${capRate}" step="0.01">
                <input type="number" class="compOccupancy" value="${occupancy}">
                <input type="number" class="compDistance" value="${distance}" step="0.1">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeCompRow(this)">×</button>' : '<span></span>'}
            </div>
        `;
        container.appendChild(row);
    });
}

function populateRentCompsFromData(rentComps) {
    const container = document.getElementById('rentCompsContainer');
    if (!container) return;
    container.innerHTML = '';
    rentCompCount = 0;

    rentComps.forEach((rc, i) => {
        rentCompCount++;
        const row = document.createElement('div');
        row.className = 'rent-comp-row';
        // Map various field name formats from AI
        const yearBuilt = rc.yearBuilt || rc.year_built || rc.year || '';
        const occupancy = rc.occupancy || rc.occ || '';
        const avgRent = rc.avgRent || rc.avg_rent || rc.rent || rc.average_rent || '';
        const psf = rc.psf || rc.price_per_sf || rc.rent_psf || '';
        const distance = rc.distance || rc.dist || '';
        row.innerHTML = `
            <div class="comp-header">Rent Comp #${i + 1}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name || ''}">
                <input type="number" class="rentCompUnits" value="${rc.units || ''}">
                <input type="number" class="rentCompYearBuilt" value="${yearBuilt}">
                <input type="number" class="rentCompOccupancy" value="${occupancy}">
                <input type="text" class="rentCompAvgRent" value="${avgRent ? '$' + parseInt(avgRent).toLocaleString() : ''}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="rentCompPSF" value="${psf}" step="0.01">
                <input type="number" class="rentCompDistance" value="${distance}" step="0.1">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeRentCompRow(this)">×</button>' : '<span></span>'}
            </div>
        `;
        container.appendChild(row);
    });
}

// ============================================================================
// FIELD VALIDATION & PROGRESS TRACKING
// ============================================================================

const REQUIRED_FIELDS = [
    'propertyAddress', 'city', 'state', 'propertyType', 'yearBuilt',
    'buildingSize', 'numUnits', 'occupancyRate', 'submarket',
    'brokerName', 'brokerageFirm', 'clientName', 'appliedCapRate'
];

const VALUE_WARNINGS = {
    appliedCapRate: { min: 4, max: 8, message: 'Cap rate outside typical range (4-8%)' },
    occupancyRate: { min: 80, max: 100, message: 'Occupancy rate outside typical range' },
    vacancyRate: { min: 0, max: 15, message: 'Vacancy rate outside typical range' },
    managementFeePercent: { min: 2, max: 10, message: 'Management fee outside typical range (2-10%)' }
};

function validateForm() {
    let isValid = true;
    const warnings = [];

    // Check required fields
    REQUIRED_FIELDS.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            const value = field.value?.trim();
            if (!value) {
                field.classList.add('field-error');
                isValid = false;
            } else {
                field.classList.remove('field-error');
            }
        }
    });

    // Check value warnings
    Object.entries(VALUE_WARNINGS).forEach(([fieldId, config]) => {
        const field = document.getElementById(fieldId);
        if (field && field.value) {
            const value = parseFloat(field.value);
            if (!isNaN(value) && (value < config.min || value > config.max)) {
                field.classList.add('field-warning');
                warnings.push(config.message);
            } else {
                field.classList.remove('field-warning');
            }
        }
    });

    return { isValid, warnings };
}

function calculateProgress() {
    let filled = 0;
    let total = 0;

    // Check all input fields in the form
    const form = document.getElementById('bov-form');
    if (!form) return 0;

    const inputs = form.querySelectorAll('input:not([readonly]), select, textarea');
    inputs.forEach(input => {
        total++;
        if (input.value?.trim()) {
            filled++;
        }
    });

    return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function updateProgressIndicator() {
    const progress = calculateProgress();
    let indicator = document.querySelector('.progress-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'progress-indicator';
        document.querySelector('.tabs')?.after(indicator);
    }

    indicator.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress}% Complete</span>
    `;
}

// Update progress on form changes
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bov-form');
    if (form) {
        form.addEventListener('input', debounce(updateProgressIndicator, 500));
        form.addEventListener('change', updateProgressIndicator);
        // Initial update
        setTimeout(updateProgressIndicator, 100);
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

function generateSensitivityTable(noi) {
    const capRates = [4.5, 5.0, 5.25, 5.5, 5.75, 6.0, 6.5];
    const rows = capRates.map(cap => {
        const value = noi / (cap / 100);
        return { capRate: cap, value: value };
    });
    return rows;
}

// ============================================================================
// PRO FORMA PROJECTIONS
// ============================================================================

function generateProForma(data, fin, years = 5) {
    const projections = [];
    const rentGrowth = (data.rentGrowthYoY || 3) / 100;
    const expenseGrowth = 0.03; // 3% expense growth
    const exitCapRate = (data.stabilizedCapRate || data.appliedCapRate || 5.5) / 100;

    let currentNoi = fin.noi;

    for (let year = 1; year <= years; year++) {
        const yearData = {
            year: year,
            egi: fin.egi * Math.pow(1 + rentGrowth, year),
            expenses: fin.totalExpenses * Math.pow(1 + expenseGrowth, year),
            noi: 0,
            value: 0
        };
        yearData.noi = yearData.egi - yearData.expenses;
        yearData.value = yearData.noi / exitCapRate;
        projections.push(yearData);
    }

    return projections;
}

// ============================================================================
// RENOVATION ROI CALCULATOR
// ============================================================================

function calculateRenovationROI(renovationCost, currentRent, newRent, vacancyMonths = 1) {
    const annualRentIncrease = (newRent - currentRent) * 12;
    const lostRent = currentRent * vacancyMonths;
    const totalCost = renovationCost + lostRent;

    const paybackMonths = totalCost / ((newRent - currentRent));
    const annualROI = (annualRentIncrease / totalCost) * 100;
    const valueCreation = annualRentIncrease / 0.055; // At 5.5% cap

    return {
        paybackMonths: Math.round(paybackMonths),
        annualROI: annualROI.toFixed(1),
        valueCreation: Math.round(valueCreation)
    };
}

// ============================================================================
// PDF EXPORT FUNCTIONALITY
// ============================================================================

async function downloadPDF() {
    const element = document.getElementById('bov-output');
    if (!element || element.innerHTML.includes('empty-state')) {
        showNotification('Please generate the BOV first', 'error');
        return;
    }

    showNotification('Generating PDF...', 'info');

    const propertyName = document.getElementById('propertyName')?.value || 'BOV';
    const fileName = `${propertyName.replace(/[^a-z0-9]/gi, '_')}_BOV_${new Date().toISOString().slice(0, 10)}.pdf`;

    const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: {
            unit: 'mm',
            format: 'letter',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // Generate PDF and open in new tab
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        showNotification('PDF opened in new tab!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF', 'error');
    }
}

// ============================================================================
// FINANCIAL CHARTS
// ============================================================================

let incomeExpenseChart = null;
let rentComparisonChart = null;
let capRateSensitivityChart = null;

function createFinancialCharts(data, fin) {
    // Only create charts if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return '';
    }

    return `
        <div class="charts-grid">
            <div class="chart-container">
                <h4>Income vs Expenses</h4>
                <div class="chart-wrapper">
                    <canvas id="incomeExpenseChart"></canvas>
                </div>
            </div>
            <div class="chart-container">
                <h4>Rent Comparison</h4>
                <div class="chart-wrapper">
                    <canvas id="rentComparisonChart"></canvas>
                </div>
            </div>
        </div>
        <div class="chart-container">
            <h4>Cap Rate Sensitivity Analysis</h4>
            <div class="chart-wrapper">
                <canvas id="capRateSensitivityChart"></canvas>
            </div>
        </div>
    `;
}

function initializeCharts(data, fin) {
    if (typeof Chart === 'undefined') return;

    // Destroy existing charts
    if (incomeExpenseChart) incomeExpenseChart.destroy();
    if (rentComparisonChart) rentComparisonChart.destroy();
    if (capRateSensitivityChart) capRateSensitivityChart.destroy();

    // Income/Expense Pie Chart
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCtx) {
        incomeExpenseChart = new Chart(incomeExpenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['NOI', 'Taxes', 'Insurance', 'Management', 'Repairs', 'Utilities', 'Other'],
                datasets: [{
                    data: [
                        fin.noi,
                        data.realEstateTaxes,
                        data.insurance,
                        fin.managementFee,
                        data.repairsMaintenance,
                        data.utilitiesExpense,
                        data.otherExpenses + fin.reserves
                    ],
                    backgroundColor: [
                        '#38a169',
                        '#e53e3e',
                        '#dd6b20',
                        '#d69e2e',
                        '#805ad5',
                        '#3182ce',
                        '#718096'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Rent Comparison Bar Chart
    const rentComparisonCtx = document.getElementById('rentComparisonChart');
    if (rentComparisonCtx && data.unitMix && data.unitMix.length > 0) {
        rentComparisonChart = new Chart(rentComparisonCtx, {
            type: 'bar',
            data: {
                labels: data.unitMix.map(u => u.type),
                datasets: [
                    {
                        label: 'Current Rent',
                        data: data.unitMix.map(u => u.currentRent),
                        backgroundColor: '#3182ce'
                    },
                    {
                        label: 'Market Rent',
                        data: data.unitMix.map(u => u.marketRent),
                        backgroundColor: '#38a169'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }

    // Cap Rate Sensitivity Chart
    const sensitivityCtx = document.getElementById('capRateSensitivityChart');
    if (sensitivityCtx) {
        const capRates = [4.5, 5.0, 5.25, 5.5, 5.75, 6.0, 6.5];
        const values = capRates.map(cap => fin.noi / (cap / 100));

        capRateSensitivityChart = new Chart(sensitivityCtx, {
            type: 'line',
            data: {
                labels: capRates.map(c => c + '%'),
                datasets: [{
                    label: 'Property Value',
                    data: values,
                    borderColor: '#1a365d',
                    backgroundColor: 'rgba(26, 54, 93, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: value => '$' + (value / 1000000).toFixed(1) + 'M'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => '$' + Math.round(context.raw).toLocaleString()
                        }
                    }
                }
            }
        });
    }
}

// ============================================================================
// LOCATION MAP
// ============================================================================

let propertyMap = null;

function createLocationMap(address, city, state) {
    if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded');
        return '';
    }

    return `
        <div class="location-map">
            <div id="propertyMap"></div>
        </div>
    `;
}

async function initializeMap(address, city, state) {
    if (typeof L === 'undefined') return;

    const mapContainer = document.getElementById('propertyMap');
    if (!mapContainer) return;

    // Geocode the address using Nominatim
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const results = await response.json();

        if (results && results.length > 0) {
            const { lat, lon } = results[0];

            if (propertyMap) {
                propertyMap.remove();
            }

            propertyMap = L.map('propertyMap').setView([lat, lon], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(propertyMap);

            L.marker([lat, lon])
                .addTo(propertyMap)
                .bindPopup(`<b>${address}</b><br>${city}, ${state}`)
                .openPopup();
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
}

// ============================================================================
// PHOTO GALLERY
// ============================================================================

let propertyPhotos = [];

function initPhotoGallery() {
    const photoInput = document.getElementById('photoFile');
    const photoZone = document.getElementById('photoUploadZone');

    if (photoInput) {
        photoInput.addEventListener('change', handleMultiplePhotos);
    }

    if (photoZone) {
        photoZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            photoZone.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            handlePhotoFiles(files);
        });
    }
}

function handleMultiplePhotos(e) {
    const files = Array.from(e.target.files);
    handlePhotoFiles(files);
}

function handlePhotoFiles(files) {
    const maxPhotos = 6;
    const remainingSlots = maxPhotos - propertyPhotos.length;

    if (remainingSlots <= 0) {
        showNotification('Maximum 6 photos allowed', 'error');
        return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            propertyPhotos.push(e.target.result);
            updatePhotoGallery();
        };
        reader.readAsDataURL(file);
    });

    // Update the main preview with first photo
    if (propertyPhotos.length > 0) {
        propertyPhotoData = propertyPhotos[0];
        const preview = document.getElementById('photoPreview');
        if (preview) {
            preview.src = propertyPhotos[0];
            preview.style.display = 'none'; // Hide since we're using gallery
        }
    }

    document.getElementById('photoUploadZone')?.classList.add('has-file');
}

function updatePhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    gallery.innerHTML = propertyPhotos.map((photo, idx) => `
        <div class="photo-gallery-item" draggable="true" data-index="${idx}">
            <img src="${photo}" alt="Property photo ${idx + 1}">
            <span class="photo-number">${idx + 1}</span>
            <button class="remove-photo" onclick="removePhoto(${idx})">×</button>
        </div>
    `).join('');

    document.getElementById('photoStatus').innerHTML =
        `<span class="success">${propertyPhotos.length} photo(s) uploaded</span>`;
}

function removePhoto(index) {
    propertyPhotos.splice(index, 1);
    updatePhotoGallery();

    // Update main photo data
    propertyPhotoData = propertyPhotos[0] || null;
}

function generatePhotoGalleryHtml() {
    if (propertyPhotos.length <= 1) return '';

    return `
        <div class="property-photo-gallery">
            <h3>Property Photos</h3>
            <div class="gallery-grid">
                ${propertyPhotos.slice(0, 6).map((photo, idx) => `
                    <div class="gallery-item">
                        <img src="${photo}" alt="Property photo ${idx + 1}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================================
// BRANDING FUNCTIONALITY
// ============================================================================

let companyLogoData = null;
let brokerPhotoData = null;

function initBranding() {
    // Logo upload
    const logoZone = document.getElementById('logoUploadZone');
    const logoInput = document.getElementById('companyLogo');

    if (logoZone && logoInput) {
        logoZone.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    companyLogoData = e.target.result;
                    const preview = document.getElementById('logoPreview');
                    if (preview) {
                        preview.src = companyLogoData;
                        preview.style.display = 'block';
                    }
                    logoZone.querySelector('.upload-hint')?.remove();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Broker photo upload
    const brokerZone = document.getElementById('brokerPhotoZone');
    const brokerInput = document.getElementById('brokerPhotoFile');

    if (brokerZone && brokerInput) {
        brokerZone.addEventListener('click', () => brokerInput.click());
        brokerInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    brokerPhotoData = e.target.result;
                    const preview = document.getElementById('brokerPhotoPreview');
                    if (preview) {
                        preview.src = brokerPhotoData;
                        preview.style.display = 'block';
                    }
                    brokerZone.querySelector('.upload-hint')?.remove();
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// ============================================================================
// SENSITIVITY ANALYSIS HTML
// ============================================================================

function generateSensitivityTableHtml(noi, appliedCapRate) {
    const capRates = [4.5, 5.0, 5.25, 5.5, 5.75, 6.0, 6.5];

    const rows = capRates.map(cap => {
        const value = noi / (cap / 100);
        const isApplied = Math.abs(cap - appliedCapRate) < 0.1;
        return `
            <tr class="${isApplied ? 'highlight-row' : ''}">
                <td>${cap.toFixed(2)}%</td>
                <td>${formatCurrencyValue(value)}</td>
                <td>${formatCurrencyValue(value / document.getElementById('numUnits')?.value || 1)}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="sensitivity-analysis">
            <h3>Cap Rate Sensitivity Analysis</h3>
            <table class="sensitivity-table">
                <thead>
                    <tr>
                        <th>Cap Rate</th>
                        <th>Property Value</th>
                        <th>Price Per Unit</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================================================
// PRO FORMA HTML
// ============================================================================

function generateProFormaHtml(data, fin) {
    const projections = generateProForma(data, fin, 5);
    const rentGrowth = data.rentGrowthYoY || 3;
    const exitCap = data.stabilizedCapRate || data.appliedCapRate || 5.5;

    const rows = projections.map(p => `
        <tr>
            <td>Year ${p.year}</td>
            <td>${formatCurrencyValue(p.egi)}</td>
            <td>${formatCurrencyValue(p.expenses)}</td>
            <td>${formatCurrencyValue(p.noi)}</td>
            <td>${formatCurrencyValue(p.value)}</td>
        </tr>
    `).join('');

    return `
        <div class="proforma-section">
            <h3>5-Year Pro Forma Projections</h3>
            <p class="assumptions">Assumptions: ${rentGrowth}% annual rent growth, 3% expense growth, ${exitCap.toFixed(2)}% exit cap rate</p>
            <table class="proforma-table">
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>EGI</th>
                        <th>Expenses</th>
                        <th>NOI</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Initialize all new features on page load
document.addEventListener('DOMContentLoaded', () => {
    initPhotoGallery();
    initBranding();
    // Don't load fake default comps - let user enter real data or load from AI parsing
});

// Load default comparables on page load
function initDefaultComps() {
    // Only initialize if containers are empty (no saved draft restored)
    const compContainer = document.getElementById('compsContainer');
    const rentCompContainer = document.getElementById('rentCompsContainer');

    // Check if comps already have data (from saved draft)
    const existingComps = compContainer.querySelectorAll('.comp-row');
    const existingRentComps = rentCompContainer.querySelectorAll('.rent-comp-row');

    // If there's only the default empty row, load default comps
    if (existingComps.length <= 1) {
        const firstCompName = compContainer.querySelector('.compName');
        if (!firstCompName || !firstCompName.value) {
            loadDefaultSaleComps();
        }
    }

    if (existingRentComps.length <= 1) {
        const firstRentCompName = rentCompContainer.querySelector('.rentCompName');
        if (!firstRentCompName || !firstRentCompName.value) {
            loadDefaultRentComps();
        }
    }
}

function loadDefaultSaleComps() {
    const compContainer = document.getElementById('compsContainer');
    compContainer.innerHTML = '';
    compCount = 0;

    const defaultCompData = [
        { name: 'Comparable Property 1', date: '2024-06', units: 150, year: 2020, price: 45000000, cap: 5.25, occ: 95, dist: 1.5 },
        { name: 'Comparable Property 2', date: '2024-03', units: 200, year: 2018, price: 52000000, cap: 5.50, occ: 94, dist: 2.0 },
        { name: 'Comparable Property 3', date: '2023-12', units: 120, year: 2015, price: 32000000, cap: 5.75, occ: 96, dist: 3.2 },
        { name: 'Comparable Property 4', date: '2023-09', units: 180, year: 2019, price: 48000000, cap: 5.35, occ: 93, dist: 2.8 }
    ];

    defaultCompData.forEach((c, i) => {
        compCount++;
        const row = document.createElement('div');
        row.className = 'comp-row';
        row.innerHTML = `
            <div class="comp-header">Comparable #${i + 1}</div>
            <div class="comp-grid">
                <input type="text" class="compName" value="${c.name}">
                <input type="text" class="compDate" value="${c.date}" placeholder="YYYY-MM">
                <input type="number" class="compUnits" value="${c.units}">
                <input type="number" class="compYearBuilt" value="${c.year}">
                <input type="text" class="compPrice" value="$${c.price.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="compCapRate" step="0.01" value="${c.cap}">
                <input type="number" class="compOccupancy" value="${c.occ}">
                <input type="number" class="compDistance" step="0.1" value="${c.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeCompRow(this)">×</button>' : '<span></span>'}
            </div>
        `;
        compContainer.appendChild(row);
    });
}

function loadDefaultRentComps() {
    const rentCompContainer = document.getElementById('rentCompsContainer');
    rentCompContainer.innerHTML = '';
    rentCompCount = 0;

    const defaultRentCompData = [
        { name: 'Rent Comp Property 1', units: 180, year: 2021, occ: 96, rent: 1850, psf: 1.95, dist: 1.2 },
        { name: 'Rent Comp Property 2', units: 220, year: 2019, occ: 94, rent: 1750, psf: 1.85, dist: 1.8 },
        { name: 'Rent Comp Property 3', units: 150, year: 2022, occ: 97, rent: 1950, psf: 2.05, dist: 2.5 },
        { name: 'Rent Comp Property 4', units: 200, year: 2020, occ: 95, rent: 1825, psf: 1.90, dist: 3.0 },
        { name: 'Rent Comp Property 5', units: 175, year: 2018, occ: 93, rent: 1700, psf: 1.80, dist: 4.2 }
    ];

    defaultRentCompData.forEach((rc, i) => {
        rentCompCount++;
        const row = document.createElement('div');
        row.className = 'rent-comp-row';
        row.innerHTML = `
            <div class="comp-header">Rent Comp #${i + 1}</div>
            <div class="rent-comp-grid">
                <input type="text" class="rentCompName" value="${rc.name}">
                <input type="number" class="rentCompUnits" value="${rc.units}">
                <input type="number" class="rentCompYearBuilt" value="${rc.year}">
                <input type="number" class="rentCompOccupancy" value="${rc.occ}">
                <input type="text" class="rentCompAvgRent" value="$${rc.rent.toLocaleString()}" oninput="formatCurrency(this)" onblur="formatCurrency(this)">
                <input type="number" class="rentCompPSF" step="0.01" value="${rc.psf}">
                <input type="number" class="rentCompDistance" step="0.1" value="${rc.dist}">
                ${i > 0 ? '<button type="button" class="remove-btn" onclick="removeRentCompRow(this)">×</button>' : '<span></span>'}
            </div>
        `;
        rentCompContainer.appendChild(row);
    });
}

// ============================================
// AI ANALYSIS FUNCTIONS
// ============================================

// Run full AI analysis on the property data
async function runAIAnalysis() {
    const formData = collectAllFormData();

    // Calculate financials to include in analysis
    const financials = calculateFinancialsForAnalysis(formData);
    const propertyData = { ...formData, ...financials };

    // Show loading state
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Running AI analysis... This may take a moment.</span>';
        statusEl.style.display = 'block';
    }

    try {
        // Run full analysis
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysisType: 'full_analysis',
                propertyData: propertyData
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.analysis) {
            applyAnalysisResults(result.analysis);
            if (statusEl) {
                statusEl.innerHTML = '<span class="success">AI analysis complete! Fields have been populated.</span>';
            }
        } else {
            throw new Error(result.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('AI Analysis error:', error);
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Analysis error: ${error.message}</span>`;
        }
    }
}

// Run specific analysis type
async function runSpecificAnalysis(analysisType) {
    const formData = collectAllFormData();
    const financials = calculateFinancialsForAnalysis(formData);
    const propertyData = { ...formData, ...financials };

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysisType: analysisType,
                propertyData: propertyData
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.analysis) {
            return result.analysis;
        } else {
            throw new Error(result.error || 'Analysis failed');
        }
    } catch (error) {
        console.error(`${analysisType} error:`, error);
        throw error;
    }
}

// Calculate financials for analysis context
function calculateFinancialsForAnalysis(data) {
    const units = data.unitMix || [];
    let gpr = 0;
    units.forEach(u => {
        const rent = parseFloat(String(u.currentRent).replace(/[$,]/g, '')) || 0;
        gpr += (u.count || 0) * rent * 12;
    });

    const vacancyRate = data.vacancyRate || 5;
    const vacancyLoss = gpr * (vacancyRate / 100);
    const otherIncome = data.otherIncome || 0;
    const egi = gpr - vacancyLoss + otherIncome;

    const numUnits = data.numUnits || units.reduce((sum, u) => sum + (u.count || 0), 0);
    const managementFee = egi * ((data.managementFeePercent || 5) / 100);
    const reserves = (data.reservesPerUnit || 250) * numUnits;

    const totalExpenses = (data.realEstateTaxes || 0) +
                          (data.insurance || 0) +
                          managementFee +
                          (data.repairsMaintenance || 0) +
                          (data.utilitiesExpense || 0) +
                          (data.otherExpenses || 0) +
                          reserves;

    const noi = egi - totalExpenses;

    return {
        gpr: gpr,
        egi: egi,
        totalExpenses: totalExpenses,
        noi: noi,
        expenseRatio: egi > 0 ? ((totalExpenses / egi) * 100).toFixed(1) : 0
    };
}

// Apply full analysis results to the form
function applyAnalysisResults(analysis) {
    // Executive Summary & Marketing
    if (analysis.executiveSummary) {
        // Store for use in BOV generation
        window.aiExecutiveSummary = analysis.executiveSummary;
    }

    if (analysis.investmentHighlights) {
        window.aiInvestmentHighlights = analysis.investmentHighlights;
    }

    // Key Selling Points
    if (analysis.keySellingPoints) {
        document.getElementById('keySellingPoints').value = analysis.keySellingPoints;
    }

    // Target Buyer Profile
    if (analysis.targetBuyers) {
        document.getElementById('targetBuyer').value = analysis.targetBuyers;
    }

    // Cap Rate Recommendation
    if (analysis.recommendedCapRate) {
        if (!document.getElementById('appliedCapRate').value) {
            const avgCap = (analysis.recommendedCapRate.low + analysis.recommendedCapRate.high) / 2;
            document.getElementById('appliedCapRate').value = avgCap.toFixed(2);
        }
        document.getElementById('marketCapRateLow').value = analysis.recommendedCapRate.low;
        document.getElementById('marketCapRateHigh').value = analysis.recommendedCapRate.high;
    }

    // Market Analysis
    if (analysis.marketAnalysis) {
        window.aiMarketAnalysis = analysis.marketAnalysis;
    }

    // Risk Assessment
    if (analysis.riskAssessment) {
        window.aiRiskAssessment = analysis.riskAssessment;
    }

    // Value Add Opportunities
    if (analysis.valueAddOpportunities) {
        window.aiValueAddOpportunities = analysis.valueAddOpportunities;
    }

    // Due Diligence Items
    if (analysis.dueDiligenceItems) {
        window.aiDueDiligenceItems = analysis.dueDiligenceItems;
    }

    console.log('AI Analysis applied:', analysis);
}

// Run market research analysis
async function runMarketResearch() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Researching market data...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('market_research');

        // Apply market data to form
        if (analysis.msaPopulation) {
            document.getElementById('msaPopulation').value = analysis.msaPopulation;
        }
        if (analysis.populationGrowth) {
            document.getElementById('populationGrowth').value = analysis.populationGrowth;
        }
        if (analysis.majorEmployers) {
            document.getElementById('majorEmployers').value = analysis.majorEmployers;
        }
        if (analysis.submarketVacancy) {
            document.getElementById('submarketVacancy').value = analysis.submarketVacancy;
        }
        if (analysis.rentGrowthYoY) {
            document.getElementById('rentGrowthYoY').value = analysis.rentGrowthYoY;
        }
        if (analysis.medianHouseholdIncome) {
            document.getElementById('avgHouseholdIncome').value = analysis.medianHouseholdIncome;
        }

        if (statusEl) {
            statusEl.innerHTML = '<span class="success">Market research complete!</span>';
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Market research error: ${error.message}</span>`;
        }
    }
}

// Run valuation recommendation
async function runValuationAnalysis() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Analyzing valuation...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('valuation_recommendation');

        if (analysis.recommendedCapRateLow) {
            document.getElementById('marketCapRateLow').value = analysis.recommendedCapRateLow;
        }
        if (analysis.recommendedCapRateHigh) {
            document.getElementById('marketCapRateHigh').value = analysis.recommendedCapRateHigh;
        }
        if (!document.getElementById('appliedCapRate').value && analysis.recommendedCapRateLow && analysis.recommendedCapRateHigh) {
            const avgCap = (analysis.recommendedCapRateLow + analysis.recommendedCapRateHigh) / 2;
            document.getElementById('appliedCapRate').value = avgCap.toFixed(2);
        }

        window.aiValuationAnalysis = analysis;

        if (statusEl) {
            statusEl.innerHTML = `<span class="success">Valuation analysis complete! Recommended cap rate: ${analysis.recommendedCapRateLow}% - ${analysis.recommendedCapRateHigh}%</span>`;
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Valuation error: ${error.message}</span>`;
        }
    }
}

// Generate marketing copy
async function generateMarketingCopy() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Generating marketing copy...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('marketing_copy');

        if (analysis.keySellingPoints) {
            document.getElementById('keySellingPoints').value = analysis.keySellingPoints;
        }
        if (analysis.targetBuyerProfile) {
            document.getElementById('targetBuyer').value = analysis.targetBuyerProfile;
        }
        if (analysis.executiveSummary) {
            window.aiExecutiveSummary = analysis.executiveSummary;
        }
        if (analysis.investmentHighlights) {
            window.aiInvestmentHighlights = analysis.investmentHighlights;
        }

        if (statusEl) {
            statusEl.innerHTML = '<span class="success">Marketing copy generated!</span>';
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Marketing copy error: ${error.message}</span>`;
        }
    }
}

// Run risk assessment
async function runRiskAssessment() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Assessing risks...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('risk_assessment');
        window.aiRiskAssessment = analysis;

        if (statusEl) {
            statusEl.innerHTML = `<span class="success">Risk assessment complete! Overall rating: ${analysis.overallRiskRating}</span>`;
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Risk assessment error: ${error.message}</span>`;
        }
    }
}

// Run expense benchmarking
async function runExpenseBenchmarking() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Benchmarking expenses...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('expense_benchmarking');
        window.aiExpenseAnalysis = analysis;

        const anomalies = analysis.anomalies?.length || 0;
        if (statusEl) {
            statusEl.innerHTML = `<span class="success">Expense benchmarking complete! ${anomalies} anomalies found.</span>`;
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Expense benchmarking error: ${error.message}</span>`;
        }
    }
}

// Generate comp analysis narrative
async function generateCompNarrative() {
    const statusEl = document.getElementById('aiAnalysisStatus');
    if (statusEl) {
        statusEl.innerHTML = '<span class="loading">Analyzing comparables...</span>';
        statusEl.style.display = 'block';
    }

    try {
        const analysis = await runSpecificAnalysis('comp_analysis');

        if (analysis.salesCompNarrative) {
            const currentNarrative = document.getElementById('compNarrative').value;
            const newNarrative = analysis.salesCompNarrative +
                (analysis.rentCompNarrative ? '\n\n' + analysis.rentCompNarrative : '');
            document.getElementById('compNarrative').value = newNarrative;
        }

        window.aiCompAnalysis = analysis;

        if (statusEl) {
            statusEl.innerHTML = '<span class="success">Comp analysis narrative generated!</span>';
        }
    } catch (error) {
        if (statusEl) {
            statusEl.innerHTML = `<span class="error">Comp analysis error: ${error.message}</span>`;
        }
    }
}
