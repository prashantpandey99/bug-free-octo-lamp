/**
 * Digital Inspection Report and Statutory Legal Notice Generator
 * Exports reports in PDF format (via jsPDF / Print API) and JSON/CSV data tables.
 */

class ReportGenerator {
  constructor() {
    this.departmentName = 'Department of Consumer Affairs, Government of India';
    this.divisionName = 'Legal Metrology Enforcement & Verification Division';
  }

  /**
   * Generates formatted HTML for the Official Inspection Report
   */
  generateReportHtml(inspectionData) {
    const p = inspectionData.product || {};
    const evalData = inspectionData.evaluation || {};
    const penalty = evalData.penaltyDetails || {};
    const rules = evalData.rulesResults || [];

    const isCompliant = evalData.overallStatus === 'COMPLIANT';
    const isPartial = evalData.overallStatus === 'PARTIAL_COMPLIANT';

    const statusBadgeHtml = isCompliant
      ? `<span class="badge badge-success">✓ STATUTORY COMPLIANT (Score: ${evalData.complianceScore}%)</span>`
      : isPartial
      ? `<span class="badge badge-warning">⚠ PARTIALLY COMPLIANT / MINOR VIOLATION (Score: ${evalData.complianceScore}%)</span>`
      : `<span class="badge badge-danger">✕ NON-COMPLIANT / STATUTORY BREACH (Score: ${evalData.complianceScore}%)</span>`;

    const rulesRows = rules.map((r, idx) => `
      <tr class="${r.status === 'FAIL' ? 'row-fail' : (r.status === 'WARNING' ? 'row-warn' : 'row-pass')}">
        <td style="font-weight:700;">${idx + 1}. ${r.ruleCode}</td>
        <td><strong>${r.title}</strong><br><small style="color:#64748b;">${r.message}</small></td>
        <td><code>${r.extractedValue || 'N/A'}</code></td>
        <td>
          <span class="status-pill status-${r.status.toLowerCase()}">${r.status}</span>
        </td>
        <td style="font-size:12px;">${r.remediation || 'Compliant'}</td>
      </tr>
    `).join('');

    return `
      <div class="official-report-document" id="printableReport">
        <!-- Header -->
        <div class="report-header">
          <div class="gov-seal">
            <img src="assets/emblem.svg" alt="Emblem" style="width:64px; height:64px;">
          </div>
          <div class="header-titles">
            <h3>GOVERNMENT OF INDIA</h3>
            <h4>MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION</h4>
            <h5>DIRECTORATE OF LEGAL METROLOGY</h5>
            <p>Statutory Inspection Report under Legal Metrology (Packaged Commodities) Rules, 2011</p>
          </div>
        </div>

        <hr class="report-divider">

        <!-- Inspection Metadata -->
        <div class="meta-grid">
          <div><strong>Report / Notice Ref:</strong> ${inspectionData.inspectionId || 'INSP-' + Date.now()}</div>
          <div><strong>Date & Time:</strong> ${new Date(inspectionData.date || Date.now()).toLocaleString('en-IN')}</div>
          <div><strong>Inspecting Officer:</strong> ${inspectionData.officerName || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().name : 'Insp. Rajesh Verma')} (${inspectionData.officerBadge || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().badgeNo : 'IND-LM-0942')})</div>
          <div><strong>Jurisdiction / Station:</strong> ${inspectionData.station || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().station : 'Central Legal Metrology Enforcement Wing')}</div>
        </div>

        <!-- Product Identity -->
        <div class="section-box">
          <div class="section-header">1. PACKAGED COMMODITY DETAILS</div>
          <div class="meta-grid" style="margin-top:8px;">
            <div><strong>Product Name:</strong> ${p.productName || 'N/A'}</div>
            <div><strong>Brand:</strong> ${p.brand || 'N/A'}</div>
            <div><strong>Category:</strong> ${p.category || 'N/A'}</div>
            <div><strong>Batch / Lot No:</strong> ${p.batchNo || 'N/A'}</div>
            <div><strong>Barcode (EAN/UPC):</strong> ${p.barcode || 'N/A'}</div>
            <div><strong>Overall Status:</strong> ${statusBadgeHtml}</div>
          </div>
        </div>

        <!-- Clause by Clause Findings Table -->
        <div class="section-box">
          <div class="section-header">2. STATUTORY DECLARATION AUDIT CHECKLIST (RULE 6 &amp; SCHEDULE II)</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width:18%;">Rule Clause</th>
                <th style="width:30%;">Mandatory Declaration</th>
                <th style="width:22%;">Extracted Text</th>
                <th style="width:10%;">Result</th>
                <th style="width:20%;">Remediation / Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rulesRows}
            </tbody>
          </table>
        </div>

        <!-- Penalty and Statutory Action Assessment -->
        <div class="section-box">
          <div class="section-header">3. LEGAL ASSESSMENT &amp; PENALTY SUMMARY (SECTION 36)</div>
          <div class="penalty-summary-box ${isCompliant ? 'clean' : 'breach'}">
            <p><strong>Recommended Enforcement Action:</strong> ${penalty.actionTitle || 'N/A'}</p>
            <p><strong>Applicable Act & Section:</strong> ${penalty.statutorySection || 'Section 36(1) of Legal Metrology Act, 2009'}</p>
            ${!isCompliant ? `
              <p><strong>Prescribed Statutory Fine (First Offence):</strong> ₹ ${penalty.firstOffenseFine ? penalty.firstOffenseFine.toLocaleString('en-IN') : '25,000'}</p>
              <p><strong>Subsequent Offence Liability:</strong> Up to ₹ 1,00,000 and/or Imprisonment under Section 36(1)</p>
              <p><strong>Compounding Window:</strong> ${penalty.compoundingPeriodDays || 15} calendar days from receipt of notice</p>
            ` : '<p style="color:#059669; font-weight:700;">No violation detected. Commodity meets all statutory provisions of Legal Metrology Act, 2009.</p>'}
          </div>
        </div>

        <!-- Inspector Signature & Stamp -->
        <div class="report-footer">
          <div class="signature-block">
            <div class="sig-line"></div>
            <p><strong>${inspectionData.officerName || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().name : 'Insp. Rajesh Verma')}</strong></p>
            <small>${inspectionData.officerDesignation || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().designation : 'Senior Enforcement Officer')}<br>Badge: ${inspectionData.officerBadge || (window.AuthManager && window.AuthManager.getActiveOfficer() ? window.AuthManager.getActiveOfficer().badgeNo : 'IND-LM-0942')}<br>Govt. Seal &amp; Digital Signature</small>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generates formal Statutory Legal Notice of Violation (Section 36)
   */
  generateLegalNoticeHtml(inspectionData) {
    const p = inspectionData.product || {};
    const evalData = inspectionData.evaluation || {};
    const penalty = evalData.penaltyDetails || {};
    const failedRules = (evalData.rulesResults || []).filter(r => r.status === 'FAIL');

    const violationsList = failedRules.map((r, i) => `
      <li>
        <strong>${r.ruleCode} - ${r.title}</strong>: ${r.message}
        <br><span style="color:#475569; font-size:13px;">Statutory Requirement: ${r.remediation}</span>
      </li>
    `).join('');

    const activeOff = (window.AuthManager && window.AuthManager.getActiveOfficer()) ? window.AuthManager.getActiveOfficer() : {};
    const offName = inspectionData.officerName || activeOff.name || 'Insp. Rajesh Verma';
    const offDesig = inspectionData.officerDesignation || activeOff.designation || 'Inspector of Legal Metrology';
    const offBadge = inspectionData.officerBadge || activeOff.badgeNo || 'IND-LM-0942';
    const offStation = inspectionData.station || activeOff.station || 'Central Legal Metrology Directorate';

    return `
      <div class="official-notice-document" id="printableNotice">
        <div class="notice-head" style="text-align:center;">
          <h3>OFFICE OF THE CONTROLLER OF LEGAL METROLOGY</h3>
          <h4>GOVERNMENT OF INDIA</h4>
          <p style="font-weight:700; color:#dc2626; margin-top:10px; font-size:16px;">
            FORMAL NOTICE OF VIOLATION UNDER SECTION 36 OF THE LEGAL METROLOGY ACT, 2009
          </p>
          <p style="font-size:13px;">Notice Ref No: <strong>LM-NOT/${Date.now().toString().slice(-6)}/2026</strong> | Date: <strong>${new Date().toLocaleDateString('en-IN')}</strong></p>
        </div>

        <hr style="margin:16px 0; border:0; border-top:2px solid #0f172a;">

        <div class="notice-body" style="font-size:14px; line-height:1.7; color:#1e293b;">
          <p><strong>To:</strong><br>
          The Managing Director / Authorized Signatory<br>
          <strong>${evalData.extractedData ? evalData.extractedData.manufacturer : p.brand || 'Manufacturer / Packer / Importer'}</strong>
          </p>

          <p style="margin-top:12px;"><strong>Subject:</strong> Notice for non-compliance with the Legal Metrology (Packaged Commodities) Rules, 2011 in respect of packaged product <em>"${p.productName || 'Pre-packaged Commodity'}"</em> (Batch No: ${p.batchNo || 'N/A'}).</p>

          <p>WHEREAS, during statutory inspection conducted on ${new Date(inspectionData.date || Date.now()).toLocaleDateString('en-IN')}, samples of the packaged commodity titled <strong>"${p.productName || 'Pre-packaged Commodity'}"</strong> bearing Barcode <strong>${p.barcode || 'N/A'}</strong> were inspected for compliance with the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011.</p>

          <p>AND WHEREAS, the following statutory contraventions have been recorded on the Principal Display Panel / Packaging:</p>

          <ol style="margin-left:20px; color:#991b1b; padding-left:10px;">
            ${violationsList || '<li>Non-conformity to mandatory declarations under Rule 6 of LMR 2011.</li>'}
          </ol>

          <p>NOW THEREFORE, take notice that under Section 36(1) of the Legal Metrology Act, 2009, you are liable to be prosecuted and subjected to penalties up to <strong>₹ 25,000/- (Rupees Twenty-Five Thousand only)</strong> for the first offence, and up to ₹ 1,00,000/- or imprisonment for subsequent offences.</p>

          <p>You are hereby given an opportunity to show cause within <strong>15 (fifteen) days</strong> from the receipt of this notice as to why penal proceedings should not be initiated against you, or to apply for compounding of the offence under Section 48 of the Act.</p>

          <div style="margin-top:40px; display:flex; justify-content:space-between;">
            <div>
              <p>Place: New Delhi<br>Date: ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div style="text-align:right;">
              <div style="height:35px;"></div>
              <p><strong>(${offName})</strong><br>${offDesig}<br>Badge: ${offBadge}<br>${offStation}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Export Inspection Dataset to CSV format
   */
  exportToCsv(inspections) {
    const headers = ['Inspection ID', 'Date', 'Product Name', 'Brand', 'Category', 'Barcode', 'Batch No', 'Score (%)', 'Compliance Status', 'Violations Count', 'Statutory Action'];
    
    const rows = inspections.map(i => [
      `"${i.inspectionId}"`,
      `"${new Date(i.date).toLocaleDateString('en-IN')}"`,
      `"${(i.product ? i.product.productName : '').replace(/"/g, '""')}"`,
      `"${(i.product ? i.product.brand : '').replace(/"/g, '""')}"`,
      `"${(i.product ? i.product.category : '').replace(/"/g, '""')}"`,
      `"${i.product ? i.product.barcode : ''}"`,
      `"${i.product ? i.product.batchNo : ''}"`,
      i.score,
      `"${i.complianceStatus}"`,
      i.violations,
      `"${(i.actionTaken || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `legal_metrology_inspections_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export current inspection to JSON file
   */
  exportToJson(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lmr_inspection_${data.inspectionId || Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Print Report or Notice using native browser print pipeline
   */
  printDocument(elementId) {
    const elem = document.getElementById(elementId);
    if (!elem) return;

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Legal Metrology Official Document</title>
          <link rel="stylesheet" href="styles/main.css">
          <link rel="stylesheet" href="styles/components.css">
          <style>
            body { background: #fff !important; color: #0f172a !important; padding: 20px; }
            .official-report-document, .official-notice-document { box-shadow: none !important; border: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          ${elem.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }
}

window.ReportGenerator = ReportGenerator;
