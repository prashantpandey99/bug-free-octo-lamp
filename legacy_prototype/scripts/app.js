/**
 * Main Application Controller for Legal Metrology Packaged Commodities Compliance System
 */

document.addEventListener('DOMContentLoaded', () => {
  const app = new LegalMetrologyApp();
  window.appInstance = app;
});

class LegalMetrologyApp {
  constructor() {
    this.ruleEngine = new window.LegalMetrologyRuleEngine();
    this.ocrEngine = new window.LabelOCREngine();
    this.reportGen = new window.ReportGenerator();
    this.charts = new window.DashboardCharts();

    this.activeOfficer = window.AuthManager ? window.AuthManager.getActiveOfficer() : null;
    this.currentRole = this.activeOfficer ? this.activeOfficer.role : 'INSPECTOR'; // INSPECTOR | ANALYST | MERCHANT
    this.currentView = 'scanner'; // dashboard | scanner | repository | rules | audit
    this.inspections = JSON.parse(localStorage.getItem('lmr_inspections')) || window.INITIAL_INSPECTIONS || [];
    this.currentInspection = null;
    this.currentImageElement = null;
    this.cameraStream = null;

    this.initUI();
    this.bindEvents();
    this.loadSampleProduct(0); // Load default compliant sample
  }

  initUI() {
    this.updateOfficerUI();
    this.updateStats();
    this.renderRepositoryTable();
    this.renderSampleButtons();
    this.switchView('dashboard');
  }

  updateOfficerUI() {
    this.activeOfficer = window.AuthManager ? window.AuthManager.getActiveOfficer() : null;
    if (!this.activeOfficer) return;

    const elName = document.getElementById('headerOfficerName');
    const elBadge = document.getElementById('headerOfficerBadge');
    const elAvatar = document.getElementById('headerOfficerAvatar');
    const elSideName = document.getElementById('sidebarOfficerName');
    const elSideStation = document.getElementById('sidebarOfficerStation');
    const elSideTag = document.getElementById('sidebarOfficerRoleTag');
    const roleSelect = document.getElementById('userRoleSelect');

    if (elName) elName.textContent = this.activeOfficer.name;
    if (elBadge) elBadge.textContent = `Badge: ${this.activeOfficer.badgeNo} • ${this.activeOfficer.zone.split('-')[0].trim()}`;
    if (elAvatar) elAvatar.textContent = this.activeOfficer.avatar || '👮‍♂️';
    if (elSideName) elSideName.textContent = this.activeOfficer.name;
    if (elSideStation) elSideStation.textContent = this.activeOfficer.station;
    if (elSideTag) elSideTag.textContent = `${this.activeOfficer.role} ACTIVE`;
    if (roleSelect && this.activeOfficer.role) {
      roleSelect.value = this.activeOfficer.role;
      this.currentRole = this.activeOfficer.role;
    }

    const roleBadge = document.getElementById('currentRoleBadge');
    if (roleBadge) {
      roleBadge.textContent = this.currentRole;
      roleBadge.className = `role-pill role-${this.currentRole.toLowerCase()}`;
    }
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) this.switchView(view);
      });
    });

    // Officer Logout Button
    const btnLogout = document.getElementById('btnHeaderLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (window.AuthManager) window.AuthManager.logout();
        this.showToast('Officer session signed out.', 'info');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      });
    }

    // Role switcher
    const roleSelect = document.getElementById('userRoleSelect');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        this.currentRole = e.target.value;
        this.updateRoleUI();
      });
    }

    // File Upload Handler
    const fileInput = document.getElementById('labelFileInput');
    const dropZone = document.getElementById('dropZoneArea');
    if (fileInput && dropZone) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleCustomImageUpload(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleCustomImageUpload(e.target.files[0]);
        }
      });
    }

    // Camera Toggle
    const btnCamera = document.getElementById('btnStartCamera');
    if (btnCamera) {
      btnCamera.addEventListener('click', () => this.toggleCamera());
    }

    const btnSnap = document.getElementById('btnCaptureSnapshot');
    if (btnSnap) {
      btnSnap.addEventListener('click', () => this.captureCameraSnapshot());
    }

    // Run Scan & Analysis Button
    const btnRunScan = document.getElementById('btnRunAnalysis');
    if (btnRunScan) {
      btnRunScan.addEventListener('click', () => this.analyzeCurrentLabel());
    }

    // Quick Test Commodity Dropdown
    const sampleSelect = document.getElementById('sampleProductSelect');
    if (sampleSelect) {
      sampleSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx)) this.loadSampleProduct(idx);
      });
    }

    // Search and Filter Repository
    const searchInput = document.getElementById('searchRepoInput');
    const statusFilter = document.getElementById('filterStatusSelect');
    if (searchInput) searchInput.addEventListener('input', () => this.filterRepository());
    if (statusFilter) statusFilter.addEventListener('change', () => this.filterRepository());

    // Export buttons
    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => this.reportGen.exportToCsv(this.inspections));
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Report Generator Buttons
    const btnViewReport = document.getElementById('btnViewOfficialReport');
    if (btnViewReport) {
      btnViewReport.addEventListener('click', () => this.openReportModal());
    }

    const btnViewNotice = document.getElementById('btnViewLegalNotice');
    if (btnViewNotice) {
      btnViewNotice.addEventListener('click', () => this.openNoticeModal());
    }

    // Print Buttons inside Modals
    const btnPrintRep = document.getElementById('btnPrintReportModal');
    if (btnPrintRep) {
      btnPrintRep.addEventListener('click', () => this.reportGen.printDocument('reportModalBody'));
    }

    const btnPrintNot = document.getElementById('btnPrintNoticeModal');
    if (btnPrintNot) {
      btnPrintNot.addEventListener('click', () => this.reportGen.printDocument('noticeModalBody'));
    }

    // PDP Slider inputs for manual dimension testing
    const pdpSlider = document.getElementById('pdpAreaInput');
    const fontSlider = document.getElementById('fontHeightInput');
    if (pdpSlider) {
      pdpSlider.addEventListener('input', (e) => {
        document.getElementById('pdpAreaDisplay').textContent = e.target.value + ' cm²';
      });
    }
    if (fontSlider) {
      fontSlider.addEventListener('input', (e) => {
        document.getElementById('fontHeightDisplay').textContent = e.target.value + ' mm';
      });
    }
  }

  updateRoleUI() {
    const roleBadge = document.getElementById('currentRoleBadge');
    if (roleBadge) {
      roleBadge.textContent = this.currentRole;
      roleBadge.className = `role-pill role-${this.currentRole.toLowerCase()}`;
    }

    const noticeBtn = document.getElementById('btnViewLegalNotice');
    if (noticeBtn) {
      noticeBtn.style.display = this.currentRole === 'MERCHANT' ? 'none' : 'inline-flex';
    }

    this.showToast(`Switched workspace mode to: ${this.currentRole}`);
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    if (viewName === 'dashboard') {
      setTimeout(() => this.charts.renderAllCharts(this.inspections), 100);
      this.updateStats();
    } else if (viewName === 'repository') {
      this.renderRepositoryTable();
    }
  }

  renderSampleButtons() {
    const select = document.getElementById('sampleProductSelect');
    if (!select) return;
    select.innerHTML = window.SAMPLE_PRODUCTS.map((p, i) => `
      <option value="${i}">${p.productName} (${p.category})</option>
    `).join('');
  }

  loadSampleProduct(index) {
    const product = window.SAMPLE_PRODUCTS[index];
    if (!product) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = product.imagePath;
    img.onload = () => {
      this.currentImageElement = img;
      this.currentProduct = product;
      this.renderInitialCanvas(img);
      this.populateProductMeta(product);
      this.showToast(`Loaded sample: ${product.productName}`);
      this.analyzeCurrentLabel(); // auto analyze
    };
  }

  renderInitialCanvas(img) {
    const canvas = document.getElementById('labelPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth || 700;
    canvas.height = img.naturalHeight || 900;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  populateProductMeta(product) {
    document.getElementById('metaProductName').value = product.productName || '';
    document.getElementById('metaBrand').value = product.brand || '';
    document.getElementById('metaCategory').value = product.category || 'General FMCG';
    document.getElementById('metaBatchNo').value = product.batchNo || 'BATCH-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('metaBarcode').value = product.barcode || '8901234567890';
    
    if (document.getElementById('pdpAreaInput')) {
      document.getElementById('pdpAreaInput').value = product.pdpAreaSqCm || 200;
      document.getElementById('pdpAreaDisplay').textContent = (product.pdpAreaSqCm || 200) + ' cm²';
    }
    if (document.getElementById('fontHeightInput')) {
      document.getElementById('fontHeightInput').value = product.actualFontHeightMm || 3.0;
      document.getElementById('fontHeightDisplay').textContent = (product.actualFontHeightMm || 3.0) + ' mm';
    }
  }

  handleCustomImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.currentImageElement = img;
        this.currentProduct = {
          id: 'PROD-CUSTOM-' + Date.now(),
          productName: file.name.replace(/\.[^/.]+$/, ""),
          brand: 'Custom Upload',
          category: 'Packaged Commodity',
          imagePath: e.target.result,
          barcode: 'CUSTOM-SCAN',
          batchNo: 'LOT-' + Math.floor(1000 + Math.random() * 9000),
          pdpAreaSqCm: 250,
          actualFontHeightMm: 3.5,
          rawText: ''
        };
        this.renderInitialCanvas(img);
        this.populateProductMeta(this.currentProduct);
        this.showToast('Custom image loaded. Click "Run Compliance Scan"');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async toggleCamera() {
    const video = document.getElementById('cameraVideoFeed');
    const container = document.getElementById('cameraContainer');
    const canvas = document.getElementById('labelPreviewCanvas');

    if (this.cameraStream) {
      // Stop camera
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
      video.style.display = 'none';
      container.style.display = 'none';
      canvas.style.display = 'block';
      document.getElementById('btnStartCamera').textContent = '📷 Open Live Camera';
      return;
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = this.cameraStream;
      video.play();
      video.style.display = 'block';
      container.style.display = 'block';
      canvas.style.display = 'none';
      document.getElementById('btnStartCamera').textContent = '❌ Stop Camera';
    } catch (err) {
      console.error(err);
      this.showToast('Camera access not available in current environment. Please upload an image file or use pre-loaded samples.', 'error');
    }
  }

  captureCameraSnapshot() {
    const video = document.getElementById('cameraVideoFeed');
    if (!video || !this.cameraStream) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 700;
    canvas.height = video.videoHeight || 900;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      this.currentImageElement = img;
      this.currentProduct = {
        id: 'PROD-CAM-' + Date.now(),
        productName: 'Live Camera Capture',
        brand: 'Scanned Commodity',
        category: 'Camera Inspection',
        imagePath: canvas.toDataURL(),
        barcode: 'CAM-LIVE',
        batchNo: 'CAM-BATCH',
        pdpAreaSqCm: 250,
        actualFontHeightMm: 3.5,
        rawText: ''
      };
      this.toggleCamera(); // turn off camera
      this.renderInitialCanvas(img);
      this.populateProductMeta(this.currentProduct);
      this.analyzeCurrentLabel();
    };
    img.src = canvas.toDataURL();
  }

  async analyzeCurrentLabel() {
    if (!this.currentImageElement) {
      this.showToast('Please select or upload a label image first.', 'warning');
      return;
    }

    const scanBtn = document.getElementById('btnRunAnalysis');
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<span class="spinner"></span> Scanning Label Declarations...';

    const progressBar = document.getElementById('scanProgressBar');
    const statusText = document.getElementById('scanStatusText');

    try {
      // 1. OCR Extraction
      const ocrResult = await this.ocrEngine.processLabel(this.currentImageElement, (prog) => {
        if (progressBar) progressBar.style.width = `${prog.progress * 100}%`;
        if (statusText) statusText.textContent = `${prog.status} (${Math.round(prog.progress * 100)}%)`;
      });

      // Merge raw text from product sample if text was pre-seeded for perfection
      const combinedText = (this.currentProduct && this.currentProduct.rawText) ? this.currentProduct.rawText : ocrResult.rawText;

      const evalInput = {
        productName: document.getElementById('metaProductName').value,
        brand: document.getElementById('metaBrand').value,
        rawText: combinedText,
        pdpAreaSqCm: parseFloat(document.getElementById('pdpAreaInput') ? document.getElementById('pdpAreaInput').value : 200),
        actualFontHeightMm: parseFloat(document.getElementById('fontHeightInput') ? document.getElementById('fontHeightInput').value : 3.5)
      };

      // 2. Rule Engine Evaluation
      const evalReport = this.ruleEngine.evaluateCompliance(evalInput);

      // 3. Render Visual Bounding Boxes on Canvas
      const canvas = document.getElementById('labelPreviewCanvas');
      this.ocrEngine.renderAnnotatedCanvas(canvas, this.currentImageElement, ocrResult.boundingBoxes, evalReport.rulesResults);

      // 4. Update UI with Results
      this.renderAnalysisResults(evalReport);

      // 5. Store Inspection Record
      const activeOff = this.activeOfficer || (window.AuthManager ? window.AuthManager.getActiveOfficer() : null);
      const newInspection = {
        inspectionId: 'INSP-' + Date.now().toString().slice(-6),
        date: new Date().toISOString(),
        officerName: activeOff ? activeOff.name : (this.currentRole === 'INSPECTOR' ? 'Insp. Rajesh Verma' : 'Analyst / Quality Auditor'),
        officerBadge: activeOff ? activeOff.badgeNo : 'IND-LM-0942',
        officerDesignation: activeOff ? activeOff.designation : 'Senior Enforcement Officer',
        station: activeOff ? activeOff.station : 'Central Legal Metrology Enforcement Wing',
        product: {
          productName: evalInput.productName,
          brand: evalInput.brand,
          category: document.getElementById('metaCategory').value,
          barcode: document.getElementById('metaBarcode').value,
          batchNo: document.getElementById('metaBatchNo').value
        },
        complianceStatus: evalReport.overallStatus,
        score: evalReport.complianceScore,
        violations: evalReport.violationsCount,
        actionTaken: evalReport.penaltyDetails.actionTitle,
        fineAmount: evalReport.penaltyDetails.firstOffenseFine || 0,
        evaluation: evalReport
      };

      this.currentInspection = newInspection;
      this.inspections.unshift(newInspection);
      localStorage.setItem('lmr_inspections', JSON.stringify(this.inspections));
      this.updateStats();

      this.showToast('Compliance analysis completed successfully!');
    } catch (err) {
      console.error(err);
      this.showToast('Analysis error: ' + err.message, 'error');
    } finally {
      scanBtn.disabled = false;
      scanBtn.innerHTML = '⚡ Run Compliance Scan &amp; Rule Engine';
      if (progressBar) progressBar.style.width = '100%';
      if (statusText) statusText.textContent = 'Inspection Ready';
    }
  }

  renderAnalysisResults(report) {
    const card = document.getElementById('complianceScoreCard');
    const badge = document.getElementById('overallStatusBadge');
    const scoreVal = document.getElementById('complianceScoreValue');
    const penaltyBox = document.getElementById('penaltyEstimateBox');
    const rulesList = document.getElementById('rulesAccordionList');

    if (!card) return;

    scoreVal.textContent = `${report.complianceScore}%`;
    badge.textContent = report.overallStatus.replace('_', ' ');
    badge.className = `status-pill status-${report.statusClass}`;

    // Violations summary counts
    document.getElementById('statCriticalCount').textContent = report.criticalViolations;
    document.getElementById('statHighCount').textContent = report.highViolations;
    document.getElementById('statPassedCount').textContent = report.passedCount;

    // Penalty box
    const p = report.penaltyDetails;
    penaltyBox.className = `penalty-card ${report.overallStatus === 'COMPLIANT' ? 'clean' : 'alert'}`;
    penaltyBox.innerHTML = `
      <div class="penalty-header">
        <h4>⚖ Statutory Enforcement Action: ${p.actionTitle}</h4>
        <span class="penalty-tag">${p.statutorySection}</span>
      </div>
      <p class="penalty-desc">${p.legalNoticeClause || 'Product conforms to Legal Metrology Rules.'}</p>
      ${p.noticeRequired ? `
        <div class="fine-grid">
          <div><small>1st Offence Fine</small><strong>₹ ${p.firstOffenseFine.toLocaleString('en-IN')}</strong></div>
          <div><small>2nd Offence Fine</small><strong>₹ ${p.secondOffenseFine.toLocaleString('en-IN')}</strong></div>
          <div><small>Subsequent Liability</small><strong>Up to ₹ ${p.maxSubsequentFine.toLocaleString('en-IN')} + Jail</strong></div>
        </div>
      ` : '<div class="fine-grid"><strong style="color:#10b981;">Statutory Green Clearance Granted</strong></div>'}
    `;

    // Rule Results Accordion
    rulesList.innerHTML = report.rulesResults.map(r => `
      <div class="rule-card ${r.status.toLowerCase()}">
        <div class="rule-card-header">
          <div class="rule-title-group">
            <span class="rule-code-badge">${r.ruleCode}</span>
            <strong>${r.title}</strong>
          </div>
          <span class="status-pill status-${r.status.toLowerCase()}">${r.status}</span>
        </div>
        <div class="rule-card-body">
          <p class="rule-msg">${r.message}</p>
          <div class="extracted-box">
            <small>Extracted Declaration:</small>
            <code>${r.extractedValue || 'None Detected'}</code>
          </div>
          <div class="remediation-box">
            <small>Legal Metrology Mandate:</small>
            <span>${r.remediation}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const total = this.inspections.length;
    let compliant = 0;
    let nonCompliant = 0;
    let totalFines = 0;

    this.inspections.forEach(i => {
      if (i.complianceStatus === 'COMPLIANT') compliant++;
      else nonCompliant++;
      totalFines += (i.fineAmount || 0);
    });

    const rate = total > 0 ? Math.round((compliant / total) * 100) : 0;

    const elTotal = document.getElementById('statTotalInspections');
    const elRate = document.getElementById('statComplianceRate');
    const elBreaches = document.getElementById('statTotalBreaches');
    const elFines = document.getElementById('statTotalFines');

    if (elTotal) elTotal.textContent = total;
    if (elRate) elRate.textContent = `${rate}%`;
    if (elBreaches) elBreaches.textContent = nonCompliant;
    if (elFines) elFines.textContent = `₹ ${totalFines.toLocaleString('en-IN')}`;
  }

  renderRepositoryTable(filteredList = null) {
    const tableBody = document.getElementById('repoTableBody');
    if (!tableBody) return;

    const items = filteredList || this.inspections;

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No inspection records found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = items.map(i => {
      const p = i.product || {};
      const statusClass = i.complianceStatus === 'COMPLIANT' ? 'success' : (i.complianceStatus === 'PARTIAL_COMPLIANT' ? 'warning' : 'danger');
      return `
        <tr>
          <td><code>${i.inspectionId}</code></td>
          <td>${new Date(i.date).toLocaleDateString('en-IN')}</td>
          <td><strong>${p.productName || 'N/A'}</strong><br><small style="color:#64748b;">${p.brand || ''} | ${p.category || ''}</small></td>
          <td><span class="status-pill status-${statusClass}">${i.complianceStatus.replace('_', ' ')}</span></td>
          <td><strong>${i.score}%</strong> (${i.violations} violations)</td>
          <td><small>${i.actionTaken || 'N/A'}</small></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="window.appInstance.viewInspectionDetails('${i.inspectionId}')">View Report</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterRepository() {
    const query = (document.getElementById('searchRepoInput').value || '').toLowerCase();
    const status = document.getElementById('filterStatusSelect').value;

    const filtered = this.inspections.filter(i => {
      const p = i.product || {};
      const matchText = (p.productName || '').toLowerCase().includes(query) ||
                        (p.brand || '').toLowerCase().includes(query) ||
                        (i.inspectionId || '').toLowerCase().includes(query);
      const matchStatus = status === 'ALL' || i.complianceStatus === status;
      return matchText && matchStatus;
    });

    this.renderRepositoryTable(filtered);
  }

  viewInspectionDetails(inspectionId) {
    const found = this.inspections.find(i => i.inspectionId === inspectionId);
    if (!found) return;
    this.currentInspection = found;
    this.openReportModal();
  }

  openReportModal() {
    if (!this.currentInspection) {
      this.showToast('Please run an inspection first.', 'warning');
      return;
    }
    const modalBody = document.getElementById('reportModalBody');
    modalBody.innerHTML = this.reportGen.generateReportHtml(this.currentInspection);
    document.getElementById('reportModal').classList.add('active');
  }

  openNoticeModal() {
    if (!this.currentInspection) {
      this.showToast('Please run an inspection first.', 'warning');
      return;
    }
    const modalBody = document.getElementById('noticeModalBody');
    modalBody.innerHTML = this.reportGen.generateLegalNoticeHtml(this.currentInspection);
    document.getElementById('noticeModal').classList.add('active');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-popup toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}
