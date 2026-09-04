/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule Engine
 * Handles automated compliance validation, statutory rule matching,
 * font height requirements (Schedule II), and penalty estimation.
 */

class LegalMetrologyRuleEngine {
  constructor() {
    this.rules = {
      RULE_6_1_A: {
        code: 'Rule 6(1)(a)',
        title: 'Manufacturer / Packer / Importer Details',
        description: 'Every package shall bear the name and complete physical address of the manufacturer or packer or importer.',
        category: 'Identity',
        severity: 'HIGH',
        statutoryPenaltySection: 'Section 36(1) of Legal Metrology Act, 2009'
      },
      RULE_6_1_B: {
        code: 'Rule 6(1)(b)',
        title: 'Generic / Common Name of Commodity',
        description: 'The common or generic names of the commodity contained in the package shall be prominently mentioned on the Principal Display Panel.',
        category: 'Product Designation',
        severity: 'MEDIUM',
        statutoryPenaltySection: 'Section 36(1)'
      },
      RULE_6_1_C: {
        code: 'Rule 6(1)(c) & Rule 12',
        title: 'Net Quantity & Standard Metric Units',
        description: 'Net quantity shall be stated in standard metric units (g, kg, ml, l, m, cm, N/U) without full stops or pluralisation (prohibits gm, gms, kgs, ltrs).',
        category: 'Measurement',
        severity: 'CRITICAL',
        statutoryPenaltySection: 'Section 36(1) read with Rules 11, 12, 13'
      },
      RULE_6_1_D: {
        code: 'Rule 6(1)(d)',
        title: 'Month & Year of Manufacture / Packing / Import',
        description: 'The month and year in which the commodity is manufactured or pre-packed or imported shall be clearly indicated.',
        category: 'Date & Traceability',
        severity: 'HIGH',
        statutoryPenaltySection: 'Section 36(1)'
      },
      RULE_6_1_E: {
        code: 'Rule 6(1)(e)',
        title: 'Maximum Retail Price (MRP) & Tax Declaration',
        description: 'MRP must be declared in Indian Rupees as "MRP Rs. xx.xx (inclusive of all taxes)" or "₹ xx.xx (incl. of all taxes)". Missing tax clause or tampering is illegal.',
        category: 'Pricing',
        severity: 'CRITICAL',
        statutoryPenaltySection: 'Section 36(1) and Section 36(2) (Overcharging/Tampering)'
      },
      RULE_6_1_F: {
        code: 'Rule 6(1)(f) (Amendment)',
        title: 'Unit Sale Price (USP)',
        description: 'For packages containing more than 1 kg, 1 L, 1 m, or multi-piece packs, Unit Sale Price (e.g. ₹/g, ₹/kg, ₹/ml, ₹/unit) must be declared on PDP.',
        category: 'Pricing',
        severity: 'MEDIUM',
        statutoryPenaltySection: 'Section 36(1)'
      },
      RULE_6_1_N: {
        code: 'Rule 6(1)(n)',
        title: 'Consumer Care & Grievance Redressal Cell',
        description: 'Name, address, telephone number (or toll-free helpline) and email address of the person/office to be contacted for consumer grievances.',
        category: 'Consumer Protection',
        severity: 'HIGH',
        statutoryPenaltySection: 'Section 36(1)'
      },
      RULE_6_10: {
        code: 'Rule 6(10) / E-Commerce & Imports',
        title: 'Country of Origin Declaration',
        description: 'Declaration of country of origin is mandatory for all imported commodities and pre-packed goods sold across retail & e-commerce.',
        category: 'Origin & Custom',
        severity: 'HIGH',
        statutoryPenaltySection: 'Section 36(1)'
      },
      SCHEDULE_II: {
        code: 'Rule 7 & 8 / Schedule II',
        title: 'Minimum Font Size & Principal Display Panel (PDP)',
        description: 'Minimum prescribed font height for net quantity and mandatory declarations based on package volume/weight and PDP area.',
        category: 'Display & Legibility',
        severity: 'MEDIUM',
        statutoryPenaltySection: 'Schedule II, LMR 2011'
      }
    };

    // Standard Metric Units allowed under Legal Metrology Rules
    this.validMetricUnits = ['g', 'kg', 'mg', 'ml', 'l', 'L', 'm', 'cm', 'mm', 'N', 'U', 'units', 'pieces', 'pack'];
    // Non-standard illegal units
    this.invalidUnitPatterns = [
      { pattern: /\b(\d+)\s*(gms|gm\.|gm|gms\.)\b/i, correct: 'g', reason: "Non-standard unit symbol 'gm/gms' used instead of statutory 'g'" },
      { pattern: /\b(\d+)\s*(kgs|kg\.|kgs\.)\b/i, correct: 'kg', reason: "Plural symbol 'kgs' used instead of statutory 'kg'" },
      { pattern: /\b(\d+)\s*(ltrs|ltr|ltrs\.|lt)\b/i, correct: 'l or ml', reason: "Non-standard symbol 'ltr/ltrs' used instead of 'l' or 'L'" },
      { pattern: /\b(\d+)\s*(caps|capsules|tabs|tablets|pcs\.)\b/i, correct: 'N or U', reason: "Unit count should declare standard number 'N' or 'U'" }
    ];
  }

  /**
   * Main evaluation function that parses extracted label text and metadata
   * @param {Object} data Extracted data from OCR/User
   * @returns {Object} Comprehensive Compliance Report
   */
  evaluateCompliance(data) {
    const rawText = (data.rawText || '').trim();
    const results = [];
    let complianceScore = 100;
    let criticalViolations = 0;
    let highViolations = 0;
    let mediumViolations = 0;

    // 1. Evaluate Rule 6(1)(a) - Manufacturer / Packer / Importer
    const mfgResult = this.checkManufacturer(data, rawText);
    results.push(mfgResult);

    // 2. Evaluate Rule 6(1)(b) - Generic Commodity Name
    const genericResult = this.checkGenericName(data, rawText);
    results.push(genericResult);

    // 3. Evaluate Rule 6(1)(c) - Net Quantity & Metric Units
    const netQtyResult = this.checkNetQuantity(data, rawText);
    results.push(netQtyResult);

    // 4. Evaluate Rule 6(1)(d) - Dates (Mfg/Packed/Exp)
    const dateResult = this.checkDates(data, rawText);
    results.push(dateResult);

    // 5. Evaluate Rule 6(1)(e) - Maximum Retail Price (MRP) & Tax clause
    const mrpResult = this.checkMRP(data, rawText);
    results.push(mrpResult);

    // 6. Evaluate Rule 6(1)(f) - Unit Sale Price (USP)
    const uspResult = this.checkUnitSalePrice(data, rawText, netQtyResult, mrpResult);
    results.push(uspResult);

    // 7. Evaluate Rule 6(1)(n) - Consumer Care & Grievance
    const consumerCareResult = this.checkConsumerCare(data, rawText);
    results.push(consumerCareResult);

    // 8. Evaluate Rule 6(10) - Country of Origin
    const originResult = this.checkCountryOfOrigin(data, rawText);
    results.push(originResult);

    // 9. Evaluate Schedule II - Font Height & PDP
    const fontResult = this.checkFontHeight(data, netQtyResult);
    results.push(fontResult);

    // Calculate Scores and Penalty
    results.forEach(r => {
      if (r.status === 'FAIL') {
        if (r.severity === 'CRITICAL') {
          complianceScore -= 30;
          criticalViolations++;
        } else if (r.severity === 'HIGH') {
          complianceScore -= 20;
          highViolations++;
        } else {
          complianceScore -= 10;
          mediumViolations++;
        }
      } else if (r.status === 'WARNING') {
        complianceScore -= 5;
      }
    });

    complianceScore = Math.max(0, Math.min(100, complianceScore));

    const totalViolations = results.filter(r => r.status === 'FAIL').length;

    let overallStatus = 'COMPLIANT';
    let statusClass = 'success';
    if (criticalViolations > 0 || totalViolations >= 3 || complianceScore < 50) {
      overallStatus = 'NON_COMPLIANT';
      statusClass = 'danger';
    } else if (totalViolations > 0 || complianceScore < 90) {
      overallStatus = 'PARTIAL_COMPLIANT';
      statusClass = 'warning';
    }

    const penaltyDetails = this.calculateStatutoryPenalty(totalViolations, criticalViolations);

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      statusClass,
      complianceScore,
      totalRulesChecked: results.length,
      violationsCount: totalViolations,
      warningsCount: results.filter(r => r.status === 'WARNING').length,
      passedCount: results.filter(r => r.status === 'PASS').length,
      criticalViolations,
      highViolations,
      mediumViolations,
      penaltyDetails,
      rulesResults: results,
      extractedData: {
        manufacturer: mfgResult.extractedValue,
        genericName: genericResult.extractedValue,
        netQuantity: netQtyResult.extractedValue,
        mrp: mrpResult.extractedValue,
        unitSalePrice: uspResult.extractedValue,
        dates: dateResult.extractedValue,
        consumerCare: consumerCareResult.extractedValue,
        countryOfOrigin: originResult.extractedValue,
        pdpMetrics: fontResult.extractedValue
      }
    };
  }

  // --- Individual Checkers ---

  checkManufacturer(data, rawText) {
    const rule = this.rules.RULE_6_1_A;
    const mfgText = data.manufacturer || this.extractPattern(rawText, /(?:mfg by|manufactured by|packed by|marketed by|mfd & pkd by|imported by)[\s:]+([^\n\r\.\;]{10,250})/i);
    
    if (!mfgText) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'FAIL',
        message: 'Missing Name & Complete Address of Manufacturer / Packer / Importer.',
        remediation: 'Mandatorily declare complete registered office address including Plot/Street, City, State and Pincode.',
        extractedValue: 'Not Detected'
      };
    }

    // Check completeness of address: must have state/city or pincode (6 digits in India)
    const hasPincode = /\b\d{6}\b/.test(mfgText) || /\b\d{6}\b/.test(rawText);
    const hasCityState = /(?:delhi|mumbai|bengaluru|bangalore|chennai|kolkata|hyderabad|pune|ahmedabad|gujarat|maharashtra|karnataka|tamil nadu|assam|up|uttar pradesh|haryana|rajasthan|dehradun|india|switzerland|germany|usa|uk)/i.test(mfgText);

    if (!hasPincode && !hasCityState) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: 'Incomplete Address: Missing City/State and 6-digit Postal Pincode in manufacturer declaration.',
        remediation: 'Rule 6(1)(a) mandates complete physical postal address capable of enabling consumer or enforcement contact.',
        extractedValue: mfgText
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: 'Complete Manufacturer/Packer name and address detected with valid geographic parameters.',
      remediation: 'Compliant with Rule 6(1)(a).',
      extractedValue: mfgText
    };
  }

  checkGenericName(data, rawText) {
    const rule = this.rules.RULE_6_1_B;
    const genericName = data.genericName || this.extractPattern(rawText, /(?:generic name|common name|product|commodity)[\s:]+([^\n\r]{3,80})/i) || data.productName;

    if (!genericName || genericName.trim().length < 3) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'FAIL',
        message: 'Generic or Common Name of commodity is missing from Principal Display Panel.',
        remediation: 'Mention common commercial name of the item (e.g. "Black Tea", "Wheat Flour", "Detergent Powder").',
        extractedValue: 'Not Detected'
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `Prominently stated generic name: "${genericName}".`,
      remediation: 'Compliant with Rule 6(1)(b).',
      extractedValue: genericName
    };
  }

  checkNetQuantity(data, rawText) {
    const rule = this.rules.RULE_6_1_C;
    const netQtyStr = data.netQuantity || this.extractPattern(rawText, /(?:net wt\.?|net weight|net quantity|net volume|net content|net qty\.?)[\s:]+([^\n\r]{2,50})/i) || this.extractPattern(rawText, /\b(\d+(?:\.\d+)?\s*(?:kg|g|gms|gm|ml|l|ltr|ltrs|m|cm|mm|N|U|units))\b/i);

    if (!netQtyStr) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'FAIL',
        message: 'Mandatory declaration of Net Quantity is missing.',
        remediation: 'Declare Net Quantity in metric units (g, kg, ml, l, N, U) on the Principal Display Panel.',
        extractedValue: 'Not Detected',
        parsedValue: null
      };
    }

    // Check for illegal non-standard units (gm, gms, kgs, ltrs, pcs)
    for (const inv of this.invalidUnitPatterns) {
      if (inv.pattern.test(netQtyStr) || inv.pattern.test(rawText)) {
        return {
          ruleCode: rule.code,
          title: rule.title,
          severity: 'CRITICAL',
          status: 'FAIL',
          message: `Statutory Unit Violation: ${inv.reason}.`,
          remediation: `Use only standard SI metric units '${inv.correct}'. Prohibit trailing full stops or plurals (Rule 12).`,
          extractedValue: netQtyStr,
          parsedValue: this.parseQuantity(netQtyStr)
        };
      }
    }

    // Valid metric unit extraction
    const parsed = this.parseQuantity(netQtyStr);
    if (!parsed) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: `Indeterminate unit in Net Quantity declaration: "${netQtyStr}".`,
        remediation: 'Declare quantity clearly with standard metric unit symbol.',
        extractedValue: netQtyStr,
        parsedValue: null
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `Net quantity correctly stated as ${parsed.amount} ${parsed.unit} in standard SI metric format.`,
      remediation: 'Compliant with Rule 6(1)(c) & Rule 12.',
      extractedValue: `${parsed.amount} ${parsed.unit}`,
      parsedValue: parsed
    };
  }

  checkDates(data, rawText) {
    const rule = this.rules.RULE_6_1_D;
    const dateStr = data.manufacturingDate || this.extractPattern(rawText, /(?:pkd\.?|packed|mfd\.?|mfg\.?|manufacturing date|packed date|mfg date|pkd date)[\s:]*([^\n\r]{3,60})/i);

    if (!dateStr) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'FAIL',
        message: 'Month & Year of Manufacture or Packaging is missing.',
        remediation: 'Print Month & Year (e.g., "08/2026" or "Aug 2026") prominently on every pre-packed commodity.',
        extractedValue: 'Not Detected'
      };
    }

    // Valid format checks: MM/YYYY, Month YYYY, MM/YY
    const hasValidDate = /(?:\d{1,2}[\/\.-]\d{2,4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,\/\.-]+\d{2,4}\b)/i.test(dateStr) || /(?:\d{1,2}[\/\.-]\d{2,4})/i.test(rawText);

    if (!hasValidDate) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: `Improper Date Format: "${dateStr}". Missing 4-digit or 2-digit Year of Manufacture/Packing.`,
        remediation: 'Specify both Month and Year in unambiguous standard notation (Rule 6(1)(d)).',
        extractedValue: dateStr
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `Date of manufacture/packing clearly declared: "${dateStr}".`,
      remediation: 'Compliant with Rule 6(1)(d).',
      extractedValue: dateStr
    };
  }

  checkMRP(data, rawText) {
    const rule = this.rules.RULE_6_1_E;
    const mrpStr = data.mrp || this.extractPattern(rawText, /(?:mrp|maximum retail price|₹|rs\.?)[\s:]*([^\n\r]{2,60})/i);

    if (!mrpStr) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'FAIL',
        message: 'Maximum Retail Price (MRP) declaration is completely missing.',
        remediation: 'Mandatorily print Maximum Retail Price in format "MRP Rs. xx.xx (incl. of all taxes)".',
        extractedValue: 'Not Detected',
        numericMRP: null
      };
    }

    // Check for mandatory phrase: "inclusive of all taxes" or "incl. of all taxes"
    const hasTaxPhrase = /(?:inclusive of all taxes|incl\.?\s*of all taxes|incl\.?\s*taxes|all taxes incl)/i.test(mrpStr) || /(?:inclusive of all taxes|incl\.?\s*of all taxes)/i.test(rawText);

    const mrpMatch = mrpStr.match(/(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)/i);
    const numericVal = mrpMatch ? parseFloat(mrpMatch[1]) : null;

    if (!hasTaxPhrase) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'CRITICAL',
        status: 'FAIL',
        message: 'Mandatory phrase "(inclusive of all taxes)" or "(incl. of all taxes)" is missing from MRP.',
        remediation: 'Rule 6(1)(e) strictly prohibits publishing price without the explicit tax inclusion declaration.',
        extractedValue: mrpStr,
        numericMRP: numericVal
      };
    }

    if (!numericVal || numericVal <= 0) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'CRITICAL',
        status: 'FAIL',
        message: 'Illegible or blank MRP figure detected.',
        remediation: 'Ensure numerical price in Indian Rupees is clearly printed with Rupee symbol (₹ / Rs.).',
        extractedValue: mrpStr,
        numericMRP: null
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `MRP correctly stated as ₹ ${numericVal.toFixed(2)} with mandatory tax inclusion clause.`,
      remediation: 'Compliant with Rule 6(1)(e).',
      extractedValue: `MRP ₹ ${numericVal.toFixed(2)} (incl. of all taxes)`,
      numericMRP: numericVal
    };
  }

  checkUnitSalePrice(data, rawText, netQtyResult, mrpResult) {
    const rule = this.rules.RULE_6_1_F;
    const uspStr = data.unitSalePrice || this.extractPattern(rawText, /(?:unit sale price|usp|unit price)[\s:]*([^\n\r]{3,50})/i);

    // If net quantity is > 1 kg or > 1 L or multi-pack, USP is mandatory under 2021 amendment
    const parsedQty = netQtyResult.parsedValue;
    let isUSPMandatory = false;

    if (parsedQty) {
      if ((parsedQty.unit === 'kg' && parsedQty.amount >= 1) || 
          (parsedQty.unit === 'l' && parsedQty.amount >= 1) ||
          (parsedQty.unit === 'g' && parsedQty.amount > 1000) ||
          (parsedQty.unit === 'ml' && parsedQty.amount > 1000)) {
        isUSPMandatory = true;
      }
    }

    if (!uspStr && isUSPMandatory) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: `Package quantity is >= 1 kg/L (${parsedQty.amount} ${parsedQty.unit}) but Unit Sale Price (USP) declaration is missing.`,
        remediation: 'Declare Unit Sale Price (₹ per g/kg/ml/l) as required by Legal Metrology Amendment Rules.',
        extractedValue: 'Not Declared'
      };
    }

    if (uspStr) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: rule.severity,
        status: 'PASS',
        message: `Unit Sale Price correctly displayed: "${uspStr}".`,
        remediation: 'Compliant with Rule 6(1)(f).',
        extractedValue: uspStr
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: 'Unit Sale Price not strictly mandatory for small sub-unit packs, or verified optionally.',
      remediation: 'N/A',
      extractedValue: 'Exempt / Optional for small size'
    };
  }

  checkConsumerCare(data, rawText) {
    const rule = this.rules.RULE_6_1_N;
    const careText = data.consumerCare || this.extractPattern(rawText, /(?:consumer care|grievance|customer support|customer care|helpline)[\s:]*([^\n\r\.\;]{10,250})/i);

    const hasPhone = /(?:toll free|tel|phone|call|mob|contact|1800)[\s:\-\+]*(?:\d[\s\-]?){8,12}/i.test(rawText) || /(?:1800[\s\-]?\d{3}[\s\-]?\d{4}|\b\d{10}\b)/.test(rawText);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText);

    if (!hasPhone && !hasEmail) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: 'Consumer Grievance Redressal details completely missing (No telephone or email address).',
        remediation: 'Mandatorily specify Name/Designation, Postal Address, Phone/Toll-Free, and Email for consumer redressal.',
        extractedValue: 'Not Detected'
      };
    }

    if (!hasEmail) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: 'Missing mandatory Consumer Care Email Address in grievance redressal declaration.',
        remediation: 'Rule 6(1)(n) requires both a functional Email address and phone helpline.',
        extractedValue: careText || (hasPhone ? 'Phone present, email missing' : 'Incomplete')
      };
    }

    if (!hasPhone) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: 'Missing Telephone / Toll-Free number for consumer grievance redressal.',
        remediation: 'Provide active helpline telephone number under Rule 6(1)(n).',
        extractedValue: careText || 'Email present, phone missing'
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: 'Comprehensive consumer redressal mechanism detected with verified telephone and email address.',
      remediation: 'Compliant with Rule 6(1)(n).',
      extractedValue: careText || 'Toll-free and email verified'
    };
  }

  checkCountryOfOrigin(data, rawText) {
    const rule = this.rules.RULE_6_10;
    const originMatch = data.countryOfOrigin || this.extractPattern(rawText, /(?:country of origin|made in|origin)[\s:]*([^\n\r]{3,40})/i);

    // If imported item (e.g. Switzerland, USA, Germany mentioned), Indian importer & Origin are strictly checked
    const isImportedMention = /(?:switzerland|germany|usa|france|japan|china|uk|italy|overseas|imported by)/i.test(rawText);

    if (isImportedMention && !originMatch) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'CRITICAL',
        status: 'FAIL',
        message: 'Imported product missing explicit "Country of Origin" declaration.',
        remediation: 'Mandatorily declare country of origin for all imported goods (Rule 6(10)).',
        extractedValue: 'Not Declared'
      };
    }

    if (!originMatch) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'MEDIUM',
        status: 'WARNING',
        message: 'Country of Origin not explicitly labelled on PDP (Standard Indian manufacturer detected).',
        remediation: 'Recommended to explicitly state "Country of Origin: India" on packaging.',
        extractedValue: 'Implicit Domestic'
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `Country of Origin declared: "${originMatch}".`,
      remediation: 'Compliant with Rule 6(10).',
      extractedValue: originMatch
    };
  }

  checkFontHeight(data, netQtyResult) {
    const rule = this.rules.SCHEDULE_II;
    const pdpArea = data.pdpAreaSqCm || 200; // default estimated PDP area
    const fontHeightMm = data.actualFontHeightMm || (data.isSmallFont ? 1.8 : 4.5);

    // Schedule II minimum font height requirements:
    // <= 50g/ml -> 1.0mm (blown/moulded: 2.0mm)
    // 50 - 200g/ml -> 2.0mm (blown/moulded: 4.0mm)
    // 200 - 1000g/ml -> 4.0mm (blown/moulded: 6.0mm)
    // > 1000g/ml -> 6.0mm (blown/moulded: 8.0mm)
    let minPrescribedHeightMm = 2.0;
    const parsed = netQtyResult.parsedValue;

    if (parsed) {
      const gEquivalent = (parsed.unit === 'kg' || parsed.unit === 'l') ? parsed.amount * 1000 : parsed.amount;
      if (gEquivalent <= 50) minPrescribedHeightMm = 1.0;
      else if (gEquivalent <= 200) minPrescribedHeightMm = 2.0;
      else if (gEquivalent <= 1000) minPrescribedHeightMm = 4.0;
      else minPrescribedHeightMm = 6.0;
    }

    if (fontHeightMm < minPrescribedHeightMm) {
      return {
        ruleCode: rule.code,
        title: rule.title,
        severity: 'HIGH',
        status: 'FAIL',
        message: `Font Height Violation: Detected font height is ${fontHeightMm.toFixed(1)} mm, which is less than statutory minimum of ${minPrescribedHeightMm.toFixed(1)} mm.`,
        remediation: `Increase Net Quantity declaration font height to at least ${minPrescribedHeightMm.toFixed(1)} mm as per Schedule II.`,
        extractedValue: `Actual: ${fontHeightMm.toFixed(1)} mm | Min Required: ${minPrescribedHeightMm.toFixed(1)} mm`
      };
    }

    return {
      ruleCode: rule.code,
      title: rule.title,
      severity: rule.severity,
      status: 'PASS',
      message: `Font height (${fontHeightMm.toFixed(1)} mm) meets or exceeds statutory threshold (${minPrescribedHeightMm.toFixed(1)} mm).`,
      remediation: 'Compliant with Schedule II.',
      extractedValue: `Height: ${fontHeightMm.toFixed(1)} mm (Min: ${minPrescribedHeightMm.toFixed(1)} mm)`
    };
  }

  // --- Helper Methods ---

  parseQuantity(qtyStr) {
    if (!qtyStr) return null;
    const m = qtyStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (!m) return null;
    const amount = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    return { amount, unit };
  }

  extractPattern(text, regex) {
    if (!text) return null;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Calculates Statutory Penalties under Section 36 of Legal Metrology Act, 2009
   */
  calculateStatutoryPenalty(violationCount, criticalCount) {
    if (violationCount === 0) {
      return {
        isCompoundable: true,
        recommendedAction: 'CLEAN_PASS',
        actionTitle: 'Statutory Compliance Certified',
        statutorySection: 'Full compliance under LMR 2011',
        firstOffenseFine: 0,
        secondOffenseFine: 0,
        seizureRecommended: false,
        noticeRequired: false
      };
    }

    const firstOffense = 25000;
    const secondOffense = 50000;
    const maxSubsequent = 100000;

    const seizure = criticalCount >= 2 || violationCount >= 3;

    return {
      isCompoundable: criticalCount === 0,
      recommendedAction: seizure ? 'ISSUE_SEIZURE_MEMO' : 'ISSUE_COMPOUNDING_NOTICE',
      actionTitle: seizure ? 'Immediate Seizure & Show Cause Notice' : 'Statutory Notice under Section 36(1)',
      statutorySection: 'Section 36(1) of Legal Metrology Act, 2009',
      firstOffenseFine: firstOffense,
      secondOffenseFine: secondOffense,
      maxSubsequentFine: maxSubsequent,
      seizureRecommended: seizure,
      noticeRequired: true,
      compoundingPeriodDays: 15,
      legalNoticeClause: `Under Section 36(1) of the Legal Metrology Act, 2009, whoever manufactures, packs, imports, sells or distributes any pre-packaged commodity which does not conform to the declarations on the package shall be punishable with fine which may extend to twenty-five thousand rupees for the first offence, fifty thousand rupees for second offence, and up to one lakh rupees or imprisonment for subsequent offences.`
    };
  }
}

// Export for application use
window.LegalMetrologyRuleEngine = LegalMetrologyRuleEngine;
