import { Injectable } from '@angular/core';
import { NewsArticle } from './models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private effectiveClassification(article: NewsArticle) {
    const c = article.classification || {};
    const u = article.userOverride;
    if (!u || !u.overriddenAt) {
      return {
        riskType: c.riskType || 'none',
        impactLevel: c.impactLevel || 'Low'
      };
    }
    return {
      riskType: u.riskType || c.riskType || 'none',
      impactLevel: u.impactLevel || c.impactLevel || 'Low'
    };
  }

  /**
   * Export Digest/Alert data to Excel (.xls XML / CSV spreadsheet)
   * Containing: Count, Title, Impact, Category, Name, Publisher
   */
  exportDigestToExcel(articles: NewsArticle[], title = 'DIGEST / ALERT SUMMARY', filename?: string) {
    if (!articles || !articles.length) return;

    const totalCount = articles.length;
    const name = filename || `digest_export_${Date.now()}.csv`;

    const headers = ['#', 'Title', 'Impact', 'Category', 'Name', 'Publisher'];
    const rows = articles.map((a, i) => {
      const eff = this.effectiveClassification(a);
      const entityName = a.companyName || (typeof a.company === 'object' ? (a.company as any)?.name : '') || 'IMGC';
      const publisher = a.source || 'General Press';

      return [
        (i + 1).toString(),
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${eff.impactLevel}"`,
        `"${eff.riskType}"`,
        `"${entityName.replace(/"/g, '""')}"`,
        `"${publisher.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [
      `"${title}"`,
      `"Count: ${totalCount}"`,
      '',
      headers.join(','),
      ...rows
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export Digest/Alert data to PDF (via styled print document)
   * Containing: Count, Title, Impact, Category, Name, Publisher
   */
  exportDigestToPdf(articles: NewsArticle[], title = 'DIGEST / ALERT SUMMARY') {
    if (!articles || !articles.length) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate PDF.');
      return;
    }

    const rowsHtml = articles.map((a, i) => {
      const eff = this.effectiveClassification(a);
      const entityName = a.companyName || (typeof a.company === 'object' ? (a.company as any)?.name : '') || 'IMGC';
      const publisher = a.source || 'General Press';
      const impact = eff.impactLevel || 'Low';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${i + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500;">
            <a href="${a.url}" target="_blank" style="color: #1d4ed8; text-decoration: none;">${a.title}</a>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <span class="badge ${impact}">${impact}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-transform: capitalize;">${eff.riskType}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600;">${entityName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">${publisher}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 30px;
            color: #1e293b;
            margin: 0;
          }
          .header-box {
            background: #1e293b;
            color: #ffffff;
            padding: 20px 24px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .count-text { font-size: 16px; font-weight: 700; color: #f97316; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th {
            text-align: left;
            padding: 12px 10px;
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
          }
          .badge.Critical { background: #fee2e2; color: #b91c1c; }
          .badge.High { background: #ffedd5; color: #c2410c; }
          .badge.Medium { background: #fef9c3; color: #854d0e; }
          .badge.Low { background: #dcfce7; color: #15803d; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>${title}</h1>
          <div class="count-text">Count: ${articles.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Title</th>
              <th style="width: 80px;">Impact</th>
              <th style="width: 110px;">Category</th>
              <th style="width: 140px;">Name</th>
              <th style="width: 120px;">Publisher</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}
