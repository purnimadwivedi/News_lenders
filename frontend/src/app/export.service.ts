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
   * Export Digest/Alert data as a downloaded PDF file with clickable article titles.
   * Containing: Count, Title, Impact, Category, Name, Publisher, Published date
   */
  async exportDigestToPdf(articles: NewsArticle[], title = 'Digest / Alert Summary', filename?: string) {
    if (!articles || !articles.length) return;

    // Loaded on demand so the PDF libraries stay out of the main bundle.
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const generatedAt = new Date();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 32;

    const rows = articles.map((a, i) => {
      const eff = this.effectiveClassification(a);
      return {
        url: /^https?:\/\//i.test(a.url || '') ? a.url : '',
        cells: [
          String(i + 1),
          pdfText(a.title || '(untitled)'),
          eff.impactLevel,
          capitalize(eff.riskType),
          pdfText(a.companyName || (typeof a.company === 'object' ? (a.company as any)?.name : '') || 'IMGC'),
          pdfText(a.source || 'General Press'),
          a.publishedAt ? formatDate(new Date(a.publishedAt)) : ''
        ]
      };
    });

    // Split rows at page breaks get their own row index, so look the URL up by the row's data.
    const urlByRow = new Map<unknown, string>(rows.map((r) => [r.cells, r.url]));

    // Header: title, generation time and per-impact counts.
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated ${formatDate(generatedAt)}, ${formatTime(generatedAt)}  |  ${articles.length} articles`, margin, 52);

    let x = pageWidth - margin;
    for (const level of [...IMPACT_LEVELS].reverse()) {
      const count = rows.filter((r) => r.cells[2] === level).length;
      const label = `${level}: ${count}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const w = doc.getTextWidth(label) + 16;
      x -= w;
      const [bg, fg] = IMPACT_COLORS[level];
      doc.setFillColor(...bg);
      doc.roundedRect(x, 30, w, 18, 9, 9, 'F');
      doc.setTextColor(...fg);
      doc.text(label, x + 8, 42);
      x -= 6;
    }

    autoTable(doc, {
      startY: 86,
      margin: { left: margin, right: margin, bottom: 36 },
      head: [['#', 'Title', 'Impact', 'Category', 'Lender', 'Publisher', 'Published']],
      body: rows.map((r) => r.cells),
      theme: 'grid',
      rowPageBreak: 'avoid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.5, textColor: [30, 41, 59], valign: 'middle' },
      headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center', textColor: [148, 163, 184] },
        1: { cellWidth: 'auto', textColor: [29, 78, 216], fontStyle: 'bold' },
        2: { cellWidth: 60, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 72 },
        4: { cellWidth: 110, fontStyle: 'bold' },
        5: { cellWidth: 100, textColor: [100, 116, 139] },
        6: { cellWidth: 68 }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 2) {
          const [bg, fg] = IMPACT_COLORS[String(data.cell.raw)] || IMPACT_COLORS['Low'];
          data.cell.styles.fillColor = bg;
          data.cell.styles.textColor = fg;
        }
        if (data.section === 'body' && data.column.index === 1 && !urlByRow.get(data.row.raw)) {
          data.cell.styles.textColor = [30, 41, 59];
        }
      },
      // Make the whole title cell a clickable link to the article.
      didDrawCell: (data: any) => {
        if (data.section !== 'body' || data.column.index !== 1) return;
        const url = urlByRow.get(data.row.raw);
        if (url) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`${title}  |  Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 16, { align: 'right' });
      }
    });

    doc.save(filename || `Digest_Summary_${generatedAt.toISOString().slice(0, 10)}.pdf`);
  }
}

const IMPACT_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

const IMPACT_COLORS: Record<string, [[number, number, number], [number, number, number]]> = {
  Critical: [[254, 226, 226], [185, 28, 28]],
  High: [[255, 237, 213], [194, 65, 12]],
  Medium: [[254, 249, 195], [133, 77, 14]],
  Low: [[220, 252, 231], [21, 128, 61]]
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// The built-in PDF fonts only cover Windows-1252, so map common symbols and drop anything else
// (otherwise characters like the rupee sign render as garbage).
const CP1252_EXTRAS = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfText(s: string): string {
  return s
    .replace(/₹\s?/g, 'Rs ')
    .replace(/[‐‑‒]/g, '-')
    .replace(/ /g, ' ')
    .split('')
    .filter((ch) => ch.charCodeAt(0) <= 0xff || CP1252_EXTRAS.includes(ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}
