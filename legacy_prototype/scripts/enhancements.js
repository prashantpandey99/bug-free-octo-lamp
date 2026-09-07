/**
 * METROLOGY-AI — Enhancement Features Module
 * All 23 feature additions — fully self-contained, non-breaking
 * Legal Metrology (Packaged Commodities) Compliance System
 */

(function (window) {
  'use strict';

  /* ================================================================
     1. LIVE IST CLOCK & SESSION UPTIME TICKER
     ================================================================ */
  class LiveClock {
    constructor(timeEl, dateEl, uptimeEl, sessionStart) {
      this.timeEl    = timeEl;
      this.dateEl    = dateEl;
      this.uptimeEl  = uptimeEl;
      this.sessionStart = sessionStart || Date.now();
      this._tick();
      this._interval = setInterval(() => this._tick(), 1000);
    }

    _tick() {
      const now = new Date();

      // IST is UTC+5:30
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs - (now.getTimezoneOffset() * 60000));

      const hh = String(istNow.getUTCHours()).padStart(2, '0');
      const mm = String(istNow.getUTCMinutes()).padStart(2, '0');
      const ss = String(istNow.getUTCSeconds()).padStart(2, '0');

      if (this.timeEl) this.timeEl.textContent = `${hh}:${mm}:${ss} IST`;

      if (this.dateEl) {
        const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const dd     = String(istNow.getUTCDate()).padStart(2, '0');
        const mo     = months[istNow.getUTCMonth()];
        const yr     = istNow.getUTCFullYear();
        const dy     = days[istNow.getUTCDay()];
        this.dateEl.textContent = `${dy}, ${dd}-${mo}-${yr}`;
      }

      if (this.uptimeEl) {
        const elapsedSec = Math.floor((Date.now() - this.sessionStart) / 1000);
        const h = Math.floor(elapsedSec / 3600);
        const m = Math.floor((elapsedSec % 3600) / 60);
        const s = elapsedSec % 60;
        const ph = String(h).padStart(2, '0');
        const pm = String(m).padStart(2, '0');
        const ps = String(s).padStart(2, '0');
        this.uptimeEl.textContent = `SESSION: ${ph}:${pm}:${ps}`;
      }
    }

    destroy() { clearInterval(this._interval); }
  }

  /* ================================================================
     2. DARK MODE MANAGER
     ================================================================ */
  class DarkModeManager {
    constructor(toggleBtn) {
      this.STORAGE_KEY = 'lmr_dark_mode';
      this.toggleBtn   = toggleBtn;
      this._apply(this._stored());
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }
    }

    _stored() {
      return localStorage.getItem(this.STORAGE_KEY) === 'dark';
    }

    _apply(isDark) {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (this.toggleBtn) {
        this.toggleBtn.textContent = isDark ? '☀️' : '🌙';
        this.toggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      }
    }

    toggle() {
      const isDark = this._stored();
      localStorage.setItem(this.STORAGE_KEY, isDark ? 'light' : 'dark');
      this._apply(!isDark);
    }
  }

  /* ================================================================
     3. SCANLINE ANIMATOR
     ================================================================ */
  class ScanlineAnimator {
    constructor(canvasWrapper) {
      this.wrapper = canvasWrapper;
      if (!canvasWrapper) return;
      this.overlay = document.createElement('div');
      this.overlay.className = 'scan-line-overlay';
      canvasWrapper.appendChild(this.overlay);
    }

    start() {
      if (this.overlay) this.overlay.classList.add('scanning');
    }

    stop() {
      if (this.overlay) this.overlay.classList.remove('scanning');
    }
  }

  /* ================================================================
     4. KPI COUNT-UP ANIMATOR
     ================================================================ */
  class CountUpAnimator {
    /**
     * @param {HTMLElement} el - Element whose textContent to animate
     * @param {number} target  - The final numeric value
     * @param {string} prefix  - e.g. "₹ "
     * @param {string} suffix  - e.g. "%"
     * @param {number} duration- milliseconds
     */
    static animate(el, target, prefix = '', suffix = '', duration = 1200) {
      if (!el) return;
      const start   = performance.now();
      const initial = 0;

      function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value    = Math.round(initial + (target - initial) * easeOut(progress));
        el.textContent = prefix + value.toLocaleString('en-IN') + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    /**
     * Auto-discovers all [data-countup] elements and animates them.
     */
    static initAll() {
      document.querySelectorAll('[data-countup]').forEach(el => {
        const raw    = el.dataset.countup;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const num    = parseFloat(raw.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) {
          CountUpAnimator.animate(el, num, prefix, suffix);
        }
      });
    }
  }

  /* ================================================================
     5. COMPLIANCE SCORE DONUT RING
     ================================================================ */
  class DonutScoreRing {
    /**
     * Replaces the score hero card's plain % text with an SVG donut ring.
     * @param {HTMLElement} container - .score-hero-card or any container
     * @param {number} score - 0–100
     */
    static render(container, score) {
      const existing = container.querySelector('.score-donut-wrap');
      if (existing) existing.remove();

      const RADIUS       = 36;
      const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 226

      let colorClass = 'score-high';
      if (score < 50) colorClass = 'score-low';
      else if (score < 80) colorClass = 'score-mid';

      const wrap = document.createElement('div');
      wrap.className = 'score-donut-wrap';
      wrap.innerHTML = `
        <svg class="score-donut-svg" viewBox="0 0 90 90">
          <circle class="score-donut-track" cx="45" cy="45" r="${RADIUS}"/>
          <circle class="score-donut-fill ${colorClass}" cx="45" cy="45" r="${RADIUS}"
                  stroke-dasharray="${CIRCUMFERENCE}"
                  stroke-dashoffset="${CIRCUMFERENCE}"/>
        </svg>
        <div class="score-donut-label">
          <span class="score-donut-pct">${score}%</span>
          <span class="score-donut-sub">Score</span>
        </div>
      `;

      // Insert at beginning of container (score-number-group)
      const group = container.querySelector('.score-number-group');
      if (group) {
        // Hide the old plain text score
        const oldBig = group.querySelector('.score-big');
        if (oldBig) oldBig.style.display = 'none';
        group.insertBefore(wrap, group.firstChild);
      } else {
        container.insertBefore(wrap, container.firstChild);
      }

      // Trigger animation after a brief delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const fill = wrap.querySelector('.score-donut-fill');
          if (fill) {
            const offset = CIRCUMFERENCE * (1 - score / 100);
            fill.style.strokeDashoffset = offset;
          }
        });
      });
    }

    static update(score) {
      const scoreCard = document.getElementById('complianceScoreCard');
      if (scoreCard) DonutScoreRing.render(scoreCard, score);
    }
  }

  /* ================================================================
     6. RISK HEAT MAP RENDERER
     ================================================================ */
  class RiskHeatMap {
    static get DATA() {
      return {
        categories: ['Food & Bev.', 'Cosmetics', 'Pharma', 'Electronics', 'Textiles', 'Agriculture'],
        violations: ['MRP', 'Net Qty', 'Mfr. Addr.', 'Date', 'Unit Price', 'Font Size'],
        // matrix[category][violation] = 0-4 (none/low/mid/high/critical)
        matrix: [
          [3, 4, 2, 3, 2, 3],
          [2, 1, 3, 2, 0, 2],
          [4, 3, 3, 4, 2, 2],
          [1, 2, 1, 0, 3, 1],
          [2, 3, 2, 1, 1, 3],
          [3, 2, 2, 3, 2, 1],
        ]
      };
    }

    static render(container) {
      if (!container) return;
      const { categories, violations, matrix } = RiskHeatMap.DATA;
      const heatClasses = ['heat-none', 'heat-low', 'heat-mid', 'heat-high', 'heat-crit'];
      const heatLabels  = ['0', '1', '2', '3', '4'];
      const heatTitle   = ['None', 'Low', 'Medium', 'High', 'Critical'];

      let headersHtml = violations.map(v => `<th>${v}</th>`).join('');
      let rowsHtml = categories.map((cat, ci) => {
        const cells = matrix[ci].map((val, vi) =>
          `<td class="${heatClasses[val]}" title="${cat} × ${violations[vi]}: ${heatTitle[val]} Risk (${heatLabels[val]})">${val}</td>`
        ).join('');
        return `<tr><td>${cat}</td>${cells}</tr>`;
      }).join('');

      container.innerHTML = `
        <div class="risk-heatmap-title">
          🌡️ Category × Violation Risk Intensity Matrix
          <span style="font-size:11px; font-weight:500; color:var(--text-muted); margin-left:4px;">(Hover cells for details)</span>
        </div>
        <div class="heatmap-table-wrap">
          <table class="heatmap-table">
            <thead>
              <tr>
                <th>Category ↓ / Rule →</th>
                ${headersHtml}
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap; align-items:center; font-size:11px; color:var(--text-muted);">
          <strong>Legend:</strong>
          ${heatClasses.map((cls, i) =>
            `<span style="display:inline-flex; align-items:center; gap:4px;">
              <span style="width:14px; height:14px; border-radius:3px;" class="${cls}">&nbsp;</span>
              ${heatTitle[i]}
            </span>`
          ).join('')}
        </div>
      `;
    }
  }

  /* ================================================================
     7. TREND ALERTS BANNER
     ================================================================ */
  class TrendAlertsBanner {
    static render(container, alerts) {
      if (!container) return;
      const defaultAlerts = alerts || [
        { icon: '⚠️', text: '<strong>North Zone</strong> compliance rate dropped <strong>12%</strong> this week — MRP & Net Qty violations surge.', type: 'warning' },
        { icon: '📈', text: '<strong>Food & Beverage</strong> category shows <strong>35% non-compliance</strong> in font-size declarations (Schedule II).', type: 'warning' }
      ];

      container.innerHTML = defaultAlerts.map((alert, i) => `
        <div class="trend-alert-banner" id="trendAlert${i}">
          <div class="trend-alert-left">
            <span class="trend-alert-icon">${alert.icon}</span>
            <span class="trend-alert-text">${alert.text}</span>
          </div>
          <button class="trend-alert-dismiss" onclick="document.getElementById('trendAlert${i}').classList.add('dismissed')">
            Dismiss ✕
          </button>
        </div>
      `).join('');
    }
  }

  /* ================================================================
     8. TYPEAHEAD SEARCH
     ================================================================ */
  class TypeaheadSearch {
    constructor(inputEl, getItems, onSelect) {
      this.input    = inputEl;
      this.getItems = getItems;
      this.onSelect = onSelect;
      this.dropdown = null;
      this._build();
    }

    _build() {
      if (!this.input) return;

      // Wrap in relative container
      const wrap = this.input.closest('.search-input-wrap');

      this.dropdown = document.createElement('div');
      this.dropdown.className = 'typeahead-dropdown';
      if (wrap) wrap.appendChild(this.dropdown);

      this.input.addEventListener('input', () => this._show());
      this.input.addEventListener('focus', () => {
        if (this.input.value.trim()) this._show();
      });

      document.addEventListener('click', (e) => {
        if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
          this.dropdown.classList.remove('open');
        }
      });
    }

    _show() {
      const query = this.input.value.trim().toLowerCase();
      const items = this.getItems(query);

      if (!query || items.length === 0) {
        this.dropdown.innerHTML = query
          ? `<div class="typeahead-empty">No results found for "${query}"</div>`
          : '';
        this.dropdown.classList.toggle('open', !!query);
        return;
      }

      const statusColors = {
        'COMPLIANT':         '#059669',
        'PARTIAL_COMPLIANT': '#D97706',
        'NON_COMPLIANT':     '#DC2626'
      };

      this.dropdown.innerHTML = items.slice(0, 8).map(item => `
        <div class="typeahead-item" data-id="${item.id || ''}">
          <span style="font-size:15px;">${item.icon || '📋'}</span>
          <div>
            <div style="font-weight:600; font-size:13px;">${item.label}</div>
            <div style="font-size:11px; color:var(--text-muted);">${item.sub || ''}</div>
          </div>
          <span class="typeahead-item-status"
            style="background:${(statusColors[item.status] || '#64748B') + '20'};
                   color:${statusColors[item.status] || '#64748B'};
                   border:1px solid ${(statusColors[item.status] || '#64748B') + '40'};">
            ${item.status ? item.status.replace('_', ' ') : ''}
          </span>
        </div>
      `).join('');

      this.dropdown.querySelectorAll('.typeahead-item').forEach((el, idx) => {
        el.addEventListener('click', () => {
          this.onSelect && this.onSelect(items[idx]);
          this.input.value = items[idx].label;
          this.dropdown.classList.remove('open');
        });
      });

      this.dropdown.classList.add('open');
    }
  }

  /* ================================================================
     9. CONFETTI BLAST (100% score celebration)
     ================================================================ */
  class ConfettiBlast {
    constructor(canvasEl) {
      this.canvas  = canvasEl;
      this.ctx     = canvasEl ? canvasEl.getContext('2d') : null;
      this.pieces  = [];
      this.running = false;
      this._rafId  = null;
    }

    fire() {
      if (!this.canvas || this.running) return;
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.canvas.classList.add('active');
      this.running = true;
      this._createPieces(160);
      this._loop();
      setTimeout(() => this.stop(), 3800);
    }

    stop() {
      this.running = false;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this.canvas.classList.remove('active');
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.pieces = [];
    }

    _createPieces(n) {
      const colors = ['#FF9933', '#138808', '#0284C7', '#F59E0B', '#10B981', '#A78BFA', '#F87171', '#38BDF8'];
      for (let i = 0; i < n; i++) {
        this.pieces.push({
          x:    Math.random() * this.canvas.width,
          y:    Math.random() * this.canvas.height * -0.5,
          w:    6 + Math.random() * 8,
          h:    3 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot:  Math.random() * 360,
          rotV: (Math.random() - 0.5) * 6,
          vx:   (Math.random() - 0.5) * 3,
          vy:   2 + Math.random() * 4,
          alpha: 1
        });
      }
    }

    _loop() {
      if (!this.running) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.pieces.forEach(p => {
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rotV;
        p.vy  += 0.08; // gravity
        if (p.y > this.canvas.height * 0.8) p.alpha -= 0.02;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rot * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });

      this.pieces = this.pieces.filter(p => p.alpha > 0);
      this._rafId = requestAnimationFrame(() => this._loop());
    }
  }

  /* ================================================================
     10. SKELETON LOADER
     ================================================================ */
  class SkeletonLoader {
    static show(container) {
      if (!container) return;
      const sk = container.querySelector('.skeleton-container');
      if (sk) {
        sk.classList.add('active');
        container.style.minHeight = '200px';
      }
    }

    static hide(container) {
      if (!container) return;
      const sk = container.querySelector('.skeleton-container');
      if (sk) {
        sk.classList.remove('active');
        container.style.minHeight = '';
      }
    }

    static inject(container) {
      if (!container || container.querySelector('.skeleton-container')) return;
      const sk = document.createElement('div');
      sk.className = 'skeleton-container';
      sk.innerHTML = `
        <div class="skeleton-block"></div>
        <div class="skeleton-line w-100"></div>
        <div class="skeleton-line w-80"></div>
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-line w-100"></div>
        <div class="skeleton-line w-40"></div>
      `;
      container.insertBefore(sk, container.firstChild);
    }
  }

  /* ================================================================
     11. HAMBURGER SIDEBAR TOGGLE (MOBILE)
     ================================================================ */
  class HamburgerSidebar {
    constructor(hamburgerBtn, sidebar, overlay) {
      this.btn     = hamburgerBtn;
      this.sidebar = sidebar;
      this.overlay = overlay;
      this.isOpen  = false;

      if (!hamburgerBtn || !sidebar) return;

      hamburgerBtn.addEventListener('click', () => this.toggle());
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }

      // Close sidebar on nav item click (mobile)
      sidebar.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => this.close());
      });
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.sidebar.classList.add('mobile-open');
      this.btn.classList.add('open');
      if (this.overlay) this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.isOpen = false;
      this.sidebar.classList.remove('mobile-open');
      this.btn.classList.remove('open');
      if (this.overlay) this.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ================================================================
     12. SWIPE GESTURE NAVIGATION
     ================================================================ */
  class SwipeGestureNav {
    constructor(viewSwitchCallback, views) {
      this.callback  = viewSwitchCallback;
      this.views     = views || ['dashboard', 'scanner', 'repository', 'rules', 'audit'];
      this.startX    = 0;
      this.startY    = 0;
      this._bind();
    }

    _bind() {
      document.addEventListener('touchstart', (e) => {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - this.startX;
        const dy = e.changedTouches[0].clientY - this.startY;

        // Only horizontal swipes with minimal vertical drift
        if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
          const activeBtn = document.querySelector('.nav-item.active');
          const currentView = activeBtn ? activeBtn.dataset.view : this.views[0];
          const idx = this.views.indexOf(currentView);

          if (dx < 0 && idx < this.views.length - 1) {
            // Swipe left → next view
            this.callback(this.views[idx + 1]);
          } else if (dx > 0 && idx > 0) {
            // Swipe right → previous view
            this.callback(this.views[idx - 1]);
          }
        }
      }, { passive: true });
    }
  }

  /* ================================================================
     13. LIVE INSPECTION COUNTER
     ================================================================ */
  class LiveInspectionCounter {
    constructor(el) {
      this.el = el;
      this._count = this._getCount();
      this._update();
    }

    _getCount() {
      const today = new Date().toLocaleDateString('en-IN');
      const stored = JSON.parse(localStorage.getItem('lmr_today_count') || '{}');
      if (stored.date !== today) {
        const fresh = { date: today, count: Math.floor(Math.random() * 4) + 1 };
        localStorage.setItem('lmr_today_count', JSON.stringify(fresh));
        return fresh.count;
      }
      return stored.count || 1;
    }

    increment() {
      const today   = new Date().toLocaleDateString('en-IN');
      this._count   = this._count + 1;
      localStorage.setItem('lmr_today_count', JSON.stringify({ date: today, count: this._count }));
      this._update();
    }

    _update() {
      if (this.el) this.el.textContent = this._count;
    }
  }

  /* ================================================================
     14. MATRIX CARD FLIP SETUP
     ================================================================ */
  class MatrixCardFlipper {
    static PENALTY_BACK = {
      'Rule 6(1)(a)':        { fine: '₹ 25,000',  detail: 'Incomplete address — missing pincode or city is a direct violation. First offence compoundable under Rule 20.' },
      'Rule 6(1)(b)':        { fine: '₹ 25,000',  detail: 'Generic name must be prominently displayed on the PDP in a legible font without decorative obscuring.' },
      'Rule 6(1)(c) & Rule 12': { fine: '₹ 50,000', detail: 'Use of "gms", "kgs", "ltrs" in place of SI units (g, kg, l) attracts enhanced penalty under Rule 12 amendments.' },
      'Rule 6(1)(d)':        { fine: '₹ 25,000',  detail: 'Month & year of packing is mandatory. Missing expiry declaration may additionally attract FDA/FSSAI co-penalties.' },
      'Rule 6(1)(e)':        { fine: '₹ 50,000',  detail: 'MRP must include phrase "inclusive of all taxes". Price alteration on packaging is a criminal offence u/s 36(1).' },
      'Rule 6(1)(f) Amendment': { fine: '₹ 25,000', detail: 'USP must be declared on packages exceeding 1 kg or 1 litre. Non-declaration leads to seizure under Rule 18.' },
      'Rule 6(1)(n)':        { fine: '₹ 25,000',  detail: 'Consumer redressal details must include an active helpline and postal address of grievance officer.' },
      'Schedule II':         { fine: '₹ 25,000',  detail: 'Font height below the prescribed minimum (1mm–6mm per Schedule II) invalidates the entire net quantity declaration.' },
      'Section 36(1)':       { fine: '₹ 1,00,000', detail: 'Repeat offenders face up to ₹ 1 lakh fine and/or imprisonment up to 1 year under Sec. 36(1) of the Act.' }
    };

    static init() {
      document.querySelectorAll('.matrix-card').forEach(card => {
        const titleEl  = card.querySelector('h4');
        const clauseEl = card.querySelector('.matrix-clause-tag');
        const paraEl   = card.querySelector('p');

        if (!titleEl || !clauseEl) return;

        const clauseText = clauseEl.textContent.trim();
        const backData   = MatrixCardFlipper.PENALTY_BACK[clauseText] || { fine: '₹ 25,000', detail: 'See Legal Metrology Act, 2009 Section 36 for penalty schedule.' };

        const frontContent  = card.innerHTML;

        // Re-structure with flip wrapper
        card.innerHTML = `
          <div class="matrix-card-inner">
            <div class="matrix-card-front">
              ${frontContent}
              <div class="matrix-flip-hint">🔄 Click to see penalty details</div>
            </div>
            <div class="matrix-card-back">
              <div class="matrix-back-rule">${clauseText}</div>
              <div class="matrix-back-title">${titleEl.textContent}</div>
              <div class="matrix-back-penalty">📌 Statutory Penalty: ${backData.fine}</div>
              <div class="matrix-back-detail">${backData.detail}</div>
              <div class="matrix-flip-hint" style="color:#94A3B8;">🔄 Click to go back</div>
            </div>
          </div>
        `;

        card.addEventListener('click', () => card.classList.toggle('flipped'));
      });
    }
  }

  /* ================================================================
     15. GEO-IP LOCK BANNER (DISMISSIBLE)
     ================================================================ */
  class GeoIPBanner {
    static render(container) {
      if (!container) return;
      const dismissed = sessionStorage.getItem('lmr_geoip_dismissed');
      if (dismissed) return;

      container.innerHTML = `
        <div class="geoip-banner" id="geoipBanner">
          <div class="geoip-banner-left">
            <span class="geoip-banner-icon">🌐</span>
            <span>Access restricted to authorized NIC jurisdictions. Session monitored under IT Act, 2000 §43A.
              &nbsp;|&nbsp; IP Jurisdiction: <strong>INDIA (IN)</strong> &nbsp;|&nbsp;
              Gateway: <strong>NIC-SECURE-GW-DEL01</strong></span>
          </div>
          <button class="geoip-dismiss-btn" id="geoipDismissBtn">Acknowledged ✕</button>
        </div>
      `;

      const btn = document.getElementById('geoipDismissBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          const banner = document.getElementById('geoipBanner');
          if (banner) banner.classList.add('dismissed');
          sessionStorage.setItem('lmr_geoip_dismissed', '1');
        });
      }
    }
  }

  /* ================================================================
     16. QR CODE INJECTOR FOR REPORTS
     ================================================================ */
  class ReportQRInjector {
    /**
     * Injects a QR code canvas + DSC stamp into a report container.
     * Uses the qrcode.js tiny inline generator (no CDN dependency).
     * Falls back to a stylized placeholder if QR library isn't available.
     */
    static inject(reportEl, inspectionData) {
      if (!reportEl) return;

      // Remove previous if any
      reportEl.querySelector('.report-enhancements-row')?.remove();

      const officer = (window.AuthManager && window.AuthManager.getActiveOfficer()) || {};
      const now = new Date();
      const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const token = officer.sessionToken || 'LM-DSC-DEMO-2026';

      const inspId = inspectionData?.inspectionId || ('INSP-' + Date.now().toString().slice(-6));
      const qrText = `LMR2011|${inspId}|${officer.badgeNo || 'IND-LM-0942'}|${now.toISOString().slice(0, 10)}`;

      const row = document.createElement('div');
      row.className = 'report-enhancements-row';
      row.innerHTML = `
        <div class="qr-code-block">
          <div id="reportQrCanvas_${inspId}"
               style="width:80px; height:80px; background:#F8FAFC;
                      border:1px solid #E2E8F0; border-radius:6px;
                      display:flex; align-items:center; justify-content:center;
                      font-size:10px; color:#64748B; text-align:center; padding:4px;">
            <div>
              <div style="font-size:24px;">📱</div>
              <div>QR Code<br>${inspId}</div>
            </div>
          </div>
          <small>Scan to verify inspection record online</small>
        </div>

        <div class="dsc-stamp-block">
          <div class="dsc-title">
            <span>✅</span> DIGITALLY SIGNED
          </div>
          <div class="dsc-name">${officer.name || 'Insp. Rajesh Verma'}</div>
          <div class="dsc-meta">${officer.designation || 'Senior Enforcement Officer'}</div>
          <div class="dsc-meta">Badge: ${officer.badgeNo || 'IND-LM-0942'}</div>
          <div class="dsc-timestamp">🔐 Signed via DSC at ${timestamp} IST</div>
          <div class="dsc-meta" style="font-size:9px; margin-top:4px; word-break:break-all;">
            Token: ${token.slice(0, 28)}...
          </div>
        </div>
      `;

      reportEl.appendChild(row);

      // Attempt to generate a real QR code using qrcode.js if available
      ReportQRInjector._tryQRCode(inspId, qrText);
    }

    static _tryQRCode(inspId, text) {
      // Check if the lightweight qrcode-generator library is loaded
      if (typeof window.qrcode === 'function') {
        try {
          const qr = window.qrcode(0, 'M');
          qr.addData(text);
          qr.make();
          const el = document.getElementById(`reportQrCanvas_${inspId}`);
          if (el) el.innerHTML = qr.createImgTag(2, 4);
        } catch (e) {
          // Silently ignore — placeholder already shown
        }
      }
    }
  }

  /* ================================================================
     17. LOGIN ACTIVITY LOG
     ================================================================ */
  class LoginActivityLog {
    static render(container) {
      if (!container) return;

      const officer    = window.AuthManager ? window.AuthManager.getActiveOfficer() : null;
      const lastLogin  = officer ? officer.lastLogin : null;

      // Generate a plausible simulated IP
      const ip = `10.${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 50) + 1}.${Math.floor(Math.random() * 200) + 50}`;

      container.innerHTML = `
        <div class="login-activity-log">
          <span class="activity-icon">🕑</span>
          <div class="activity-text">
            <strong>Last Login:</strong>
            ${lastLogin || '01-Sep-2026, 09:15 AM IST'} &nbsp;•&nbsp;
            NIC Gateway IP: <strong>${ip} (INDIA)</strong>
            &nbsp;•&nbsp; Session secured via TLS 1.3
          </div>
        </div>
      `;
    }
  }

  /* ================================================================
     18. BIOMETRIC LOGIN UI (DEMO)
     ================================================================ */
  class BiometricLoginUI {
    static render(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="biometric-divider"><span>or authenticate with</span></div>
        <button type="button" class="biometric-btn" id="biometricLoginBtn">
          <span class="biometric-icon">👆</span>
          <span>Biometric / Fingerprint Login</span>
          <span class="biometric-status">NIC e-Pramaan Ready</span>
        </button>
      `;

      const btn = document.getElementById('biometricLoginBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          btn.innerHTML = `<span class="biometric-icon" style="animation: fingerScan 1.2s ease-in-out;">👆</span> <span>Scanning fingerprint…</span>`;
          setTimeout(() => {
            btn.innerHTML = `<span class="biometric-icon">✅</span> <span>Match confirmed! Redirecting…</span>`;
            // Use the first demo officer
            if (window.AuthManager) {
              const officers = window.AuthManager.getRegisteredOfficers();
              if (officers.length > 0) {
                window.AuthManager.setActiveOfficer(officers[0]);
                setTimeout(() => { window.location.href = 'index.html'; }, 900);
              }
            }
          }, 2000);
        });
      }
    }
  }

  /* ================================================================
     INITIALIZATION — wires everything to the DOM
     ================================================================ */
  function initEnhancements() {
    const isLoginPage = document.body.classList.contains('auth-body');

    /* --- DARK MODE (both pages) --- */
    const darkToggle = document.getElementById('darkModeToggle');
    window._darkModeManager = new DarkModeManager(darkToggle);

    /* ------- MAIN APP PAGE ONLY ------- */
    if (!isLoginPage) {
      /* Live Clock */
      const clockEl   = document.getElementById('headerClockTime');
      const dateEl    = document.getElementById('headerClockDate');
      const uptimeEl  = document.getElementById('headerSessionUptime');
      const officer   = window.AuthManager ? window.AuthManager.getActiveOfficer() : null;
      const sessionStart = officer ? new Date(officer.loginTimestamp).getTime() : Date.now();
      window._liveClock = new LiveClock(clockEl, dateEl, uptimeEl, sessionStart);

      /* GeoIP Banner */
      const geoipContainer = document.getElementById('geoipBannerContainer');
      GeoIPBanner.render(geoipContainer);

      /* Trend Alerts */
      const alertsContainer = document.getElementById('trendAlertsContainer');
      TrendAlertsBanner.render(alertsContainer);

      /* Risk Heat Map */
      const heatmapContainer = document.getElementById('riskHeatmapContainer');
      RiskHeatMap.render(heatmapContainer);

      /* Scanline Animator */
      const canvasWrapper = document.querySelector('.canvas-wrapper');
      window._scanlineAnimator = new ScanlineAnimator(canvasWrapper);

      /* Skeleton Loader injection */
      const rulesAccordion = document.getElementById('rulesAccordionList');
      if (rulesAccordion) SkeletonLoader.inject(rulesAccordion);

      /* Hamburger Sidebar Toggle */
      const hamburger = document.getElementById('hamburgerBtn');
      const sidebar   = document.getElementById('mainSidebar');
      const overlay   = document.getElementById('sidebarOverlay');
      window._hamburger = new HamburgerSidebar(hamburger, sidebar, overlay);

      /* Swipe Navigation */
      const appInstance = window.appInstance;
      if (appInstance) {
        window._swipeNav = new SwipeGestureNav(
          (view) => appInstance.switchView(view),
          ['dashboard', 'scanner', 'repository', 'rules', 'audit']
        );
      }

      /* Live Inspection Counter */
      const counterEl = document.getElementById('inspectionsTodayValue');
      window._inspCounter = new LiveInspectionCounter(counterEl);

      /* Typeahead Search */
      const searchInput = document.getElementById('searchRepoInput');
      if (searchInput) {
        window._typeahead = new TypeaheadSearch(
          searchInput,
          (query) => {
            const inspections = JSON.parse(localStorage.getItem('lmr_inspections') || '[]');
            if (!query) return inspections.slice(0, 6).map(i => ({
              id:     i.inspectionId,
              label:  i.product?.productName || 'Unknown Product',
              sub:    `${i.inspectionId} • ${i.product?.brand || ''} • ${new Date(i.date).toLocaleDateString('en-IN')}`,
              status: i.complianceStatus,
              icon:   '📋'
            }));
            return inspections
              .filter(i =>
                (i.product?.productName || '').toLowerCase().includes(query) ||
                (i.product?.brand || '').toLowerCase().includes(query) ||
                (i.inspectionId || '').toLowerCase().includes(query) ||
                (i.product?.barcode || '').toLowerCase().includes(query)
              )
              .slice(0, 8)
              .map(i => ({
                id:     i.inspectionId,
                label:  i.product?.productName || 'Unknown Product',
                sub:    `${i.inspectionId} • ${i.product?.brand || ''} • ${new Date(i.date).toLocaleDateString('en-IN')}`,
                status: i.complianceStatus,
                icon:   '📋'
              }));
          },
          (item) => {
            if (searchInput) searchInput.value = item.label;
            // Trigger the search filter
            searchInput.dispatchEvent(new Event('input'));
          }
        );
      }

      /* Confetti Canvas */
      const confettiCanvas = document.getElementById('confettiCanvas');
      window._confetti = confettiCanvas ? new ConfettiBlast(confettiCanvas) : null;

      /* KPI Count-up — defer until after charts render */
      setTimeout(() => CountUpAnimator.initAll(), 600);

      /* Matrix card flip setup — defer until view-rules is shown */
      setTimeout(() => MatrixCardFlipper.init(), 800);

      /* Initial Donut Ring */
      setTimeout(() => DonutScoreRing.update(100), 400);

      /* Intercept app scan completion to trigger enhancements */
      _hookScanCompletion();
    }

    /* ------- LOGIN PAGE ONLY ------- */
    if (isLoginPage) {
      /* Biometric Button */
      const bioContainer = document.getElementById('biometricContainer');
      BiometricLoginUI.render(bioContainer);

      /* Activity Log */
      const actContainer = document.getElementById('loginActivityContainer');
      LoginActivityLog.render(actContainer);
    }
  }

  /* ================================================================
     HOOK INTO APP SCAN COMPLETION
     ================================================================ */
  function _hookScanCompletion() {
    // Poll for window.appInstance (loaded after enhancements.js)
    const checkInterval = setInterval(() => {
      const app = window.appInstance;
      if (!app) return;
      clearInterval(checkInterval);

      // Patch the renderComplianceResults method to add enhancements
      const _original = app.renderComplianceResults?.bind(app);
      if (!_original) return;

      app.renderComplianceResults = function (evaluation, productData) {
        // Stop scanline
        if (window._scanlineAnimator) window._scanlineAnimator.stop();
        // Hide skeleton
        const accordion = document.getElementById('rulesAccordionList');
        if (accordion) SkeletonLoader.hide(accordion);

        // Call original
        _original(evaluation, productData);

        const score = evaluation?.complianceScore || 0;

        // Update donut ring with real score
        DonutScoreRing.update(score);

        // Confetti if 100%
        if (score === 100 && window._confetti) {
          setTimeout(() => window._confetti.fire(), 400);
        }

        // Increment live counter
        if (window._inspCounter) window._inspCounter.increment();
      };

      // Patch runAnalysis to start scanline + skeleton
      const _origRun = app.runAnalysis?.bind(app);
      if (_origRun) {
        app.runAnalysis = function () {
          if (window._scanlineAnimator) window._scanlineAnimator.start();
          const accordion = document.getElementById('rulesAccordionList');
          if (accordion) SkeletonLoader.show(accordion);
          return _origRun();
        };
      }

      // Patch report generator to add QR + DSC
      const rg = app.reportGen;
      if (rg) {
        const _origReport = rg.generateReportHtml.bind(rg);
        rg.generateReportHtml = function (data) {
          const html = _origReport(data);
          // We inject QR after modal renders
          setTimeout(() => {
            const reportEl = document.getElementById('printableReport');
            if (reportEl) ReportQRInjector.inject(reportEl, data);
          }, 200);
          return html;
        };

        const _origNotice = rg.generateLegalNoticeHtml.bind(rg);
        rg.generateLegalNoticeHtml = function (data) {
          const html = _origNotice(data);
          setTimeout(() => {
            const noticeEl = document.getElementById('printableNotice');
            if (noticeEl) ReportQRInjector.inject(noticeEl, data);
          }, 200);
          return html;
        };
      }
    }, 200);
  }

  /* ================================================================
     EXPOSE GLOBALS + AUTO-INIT
     ================================================================ */
  window.EnhancementModules = {
    LiveClock,
    DarkModeManager,
    ScanlineAnimator,
    CountUpAnimator,
    DonutScoreRing,
    RiskHeatMap,
    TrendAlertsBanner,
    TypeaheadSearch,
    ConfettiBlast,
    SkeletonLoader,
    HamburgerSidebar,
    SwipeGestureNav,
    LiveInspectionCounter,
    MatrixCardFlipper,
    GeoIPBanner,
    ReportQRInjector,
    LoginActivityLog,
    BiometricLoginUI
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
  } else {
    initEnhancements();
  }

})(window);
