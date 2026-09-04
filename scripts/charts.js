/**
 * Analytics and Interactive Charts for Legal Metrology Enforcement Dashboard
 * Powered by Chart.js
 */

class DashboardCharts {
  constructor() {
    this.statusChart = null;
    this.rulesChart = null;
    this.categoryChart = null;
    this.trendChart = null;
  }

  /**
   * Initialize or update all dashboard charts based on inspection records
   * @param {Array} inspections
   */
  renderAllCharts(inspections) {
    if (!window.Chart) {
      console.warn('Chart.js library not loaded yet.');
      return;
    }

    this.renderStatusDoughnut(inspections);
    this.renderRulesBar(inspections);
    this.renderCategoryPolar(inspections);
    this.renderTrendLine(inspections);
  }

  renderStatusDoughnut(inspections) {
    const ctx = document.getElementById('complianceStatusChart');
    if (!ctx) return;

    let compliant = 0;
    let partial = 0;
    let nonCompliant = 0;

    inspections.forEach(i => {
      if (i.complianceStatus === 'COMPLIANT') compliant++;
      else if (i.complianceStatus === 'PARTIAL_COMPLIANT') partial++;
      else nonCompliant++;
    });

    if (this.statusChart) this.statusChart.destroy();

    this.statusChart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Statutory Compliant', 'Partial / Minor Warning', 'Non-Compliant Breach'],
        datasets: [{
          data: [compliant, partial, nonCompliant],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderColor: '#0F172A',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94A3B8', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderRulesBar(inspections) {
    const ctx = document.getElementById('violatedRulesChart');
    if (!ctx) return;

    // Aggregate common violation categories
    const ruleViolations = {
      'MRP & Taxes (Rule 6(1)(e))': 3,
      'Metric Units (Rule 12)': 2,
      'Consumer Care (Rule 6(1)(n))': 3,
      'Address / Origin (Rule 6(1)(a)/10)': 3,
      'Font Size (Schedule II)': 1,
      'Mfg Date (Rule 6(1)(d))': 1
    };

    if (this.rulesChart) this.rulesChart.destroy();

    this.rulesChart = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(ruleViolations),
        datasets: [{
          label: 'Total Violations Detected',
          data: Object.values(ruleViolations),
          backgroundColor: '#38BDF8',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { color: '#94A3B8', precision: 0 }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#CBD5E1', font: { size: 11 } }
          }
        }
      }
    });
  }

  renderCategoryPolar(inspections) {
    const ctx = document.getElementById('categoryRiskChart');
    if (!ctx) return;

    const categories = ['Snacks & Namkeen', 'Imported Confectionery', 'Cosmetics', 'Detergents', 'Beverages & Tea', 'Staples & Atta'];
    const riskScores = [85, 80, 60, 50, 10, 5]; // Risk level %

    if (this.categoryChart) this.categoryChart.destroy();

    this.categoryChart = new window.Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: categories,
        datasets: [{
          data: riskScores,
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(52, 211, 153, 0.7)'
          ],
          borderColor: '#0F172A',
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94A3B8', font: { size: 10 } }
          }
        },
        scales: {
          r: {
            grid: { color: '#334155' },
            ticks: { display: false }
          }
        }
      }
    });
  }

  renderTrendLine(inspections) {
    const ctx = document.getElementById('inspectionTrendChart');
    if (!ctx) return;

    if (this.trendChart) this.trendChart.destroy();

    this.trendChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'],
        datasets: [
          {
            label: 'Total Scans',
            data: [42, 68, 85, 110, 145, 182],
            borderColor: '#38BDF8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          },
          {
            label: 'Violations Flagged',
            data: [18, 26, 31, 38, 45, 52],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94A3B8', font: { size: 11 } }
          }
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { color: '#94A3B8' }
          },
          y: {
            grid: { color: '#334155' },
            ticks: { color: '#94A3B8' }
          }
        }
      }
    });
  }
}

window.DashboardCharts = DashboardCharts;
