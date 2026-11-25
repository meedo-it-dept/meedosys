export const LGU_LOGO_PATH = '/favicon_LGUMalungon/LGU_LOGO1.png';

export function getLguLogoUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${LGU_LOGO_PATH}`;
  }
  return LGU_LOGO_PATH;
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LetterheadOptions {
  title: string;
  subtitle?: string;
  dept?: string;
  metaRight?: string;
  compact?: boolean;
}

export function lguLetterheadHtml({
  title,
  subtitle,
  dept = 'Municipal Economic Enterprise Development Office (MEEDO)',
  metaRight,
  compact = false,
}: LetterheadOptions): string {
  const logoUrl = escapeHtml(getLguLogoUrl());
  const printedAt = new Date().toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <header class="lgu-letterhead ${compact ? 'lgu-letterhead--compact' : ''}">
      <div class="lgu-letterhead-left">
        <img src="${logoUrl}" alt="Municipality of Malungon Official Seal" class="lgu-seal-img" />
        <div class="lgu-org-block">
          <div class="lgu-republic">Republic of the Philippines</div>
          <div class="lgu-province">Province of Sarangani • Municipality of Malungon</div>
          <div class="lgu-dept">${escapeHtml(dept)}</div>
          <h1 class="lgu-doc-title">${escapeHtml(title)}</h1>
          ${subtitle ? `<div class="lgu-doc-subtitle">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
      <div class="lgu-letterhead-right">
        ${metaRight ? `<div class="lgu-meta-custom">${metaRight}</div>` : ''}
        <div class="lgu-meta-printed">Printed: ${escapeHtml(printedAt)}</div>
      </div>
    </header>
  `;
}

export const BASE_PRINT_STYLES = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
    font-family: Arial, 'Segoe UI', system-ui, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
  }
  .lgu-print-container {
    width: 100%;
    margin: 0 auto;
    padding: 0;
  }
  .lgu-letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    margin-bottom: 14px;
    border-bottom: 2px solid #0f172a;
  }
  .lgu-letterhead--compact {
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .lgu-letterhead-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .lgu-seal-img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .lgu-letterhead--compact .lgu-seal-img {
    width: 52px;
    height: 52px;
  }
  .lgu-org-block {
    min-width: 0;
  }
  .lgu-republic {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #475569;
  }
  .lgu-province {
    font-size: 10.5pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.01em;
  }
  .lgu-dept {
    font-size: 9pt;
    font-weight: 700;
    color: #1e40af;
    margin-top: 1px;
  }
  .lgu-doc-title {
    margin: 4px 0 0 0;
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.01em;
  }
  .lgu-doc-subtitle {
    margin-top: 2px;
    font-size: 9pt;
    font-weight: 500;
    color: #334155;
  }
  .lgu-letterhead-right {
    text-align: right;
    flex-shrink: 0;
    font-size: 8.5pt;
    color: #475569;
  }
  .lgu-meta-custom {
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }
  .lgu-meta-printed {
    font-variant-numeric: tabular-nums;
    color: #64748b;
  }
  .lgu-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }
  .lgu-kpi-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 10px;
    background: #f8fafc;
  }
  .lgu-kpi-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #475569;
  }
  .lgu-kpi-value {
    margin-top: 2px;
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }
  table.lgu-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    font-variant-numeric: tabular-nums;
  }
  table.lgu-table thead {
    display: table-header-group;
  }
  table.lgu-table th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.03em;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  table.lgu-table td {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    color: #0f172a;
    vertical-align: top;
    word-break: break-word;
  }
  table.lgu-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }
  table.lgu-table tbody tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .lgu-notes {
    margin-top: 12px;
    font-size: 8.5pt;
    color: #334155;
  }
  .lgu-signatures {
    margin-top: 28px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 28px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .lgu-sig-box {
    text-align: center;
    font-size: 8.5pt;
  }
  .lgu-sig-caption {
    text-align: left;
    font-size: 8pt;
    color: #475569;
    margin-bottom: 28px;
  }
  .lgu-sig-line {
    border-top: 1px solid #0f172a;
    padding-top: 4px;
    font-weight: 700;
    color: #0f172a;
  }
  .lgu-sig-role {
    font-size: 7.5pt;
    color: #475569;
    margin-top: 1px;
  }
  .lgu-footer-note {
    margin-top: 18px;
    padding-top: 6px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #64748b;
  }
`;

export interface OpenPrintDocumentOptions {
  title: string;
  bodyHtml?: string;
  styles?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'letter' | 'legal' | '13in 8.5in';
  margin?: string;
  /** Copy page <link rel="stylesheet"> and <style> tags so Tailwind components render identically */
  copyDocumentStyles?: boolean;
  /** Pass a full pre-rendered <!DOCTYPE html>... document if caller supplies its own shell */
  rawHtml?: string;
}

function triggerWindowPrintWhenReady(win: Window, onComplete?: () => void): void {
  let printed = false;

  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      // ignore if window already closed
    }
    if (onComplete) {
      const cleanup = () => {
        win.removeEventListener('afterprint', cleanup);
        onComplete();
      };
      win.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 60000);
    }
  };

  const doc = win.document;
  const images = Array.from(doc.images || []);
  const pendingImages = images.filter((img) => !img.complete);
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  const pendingLinks = links.filter((link) => {
    try {
      return !link.sheet;
    } catch {
      return false;
    }
  });

  const waitFonts =
    doc.fonts && typeof doc.fonts.ready?.then === 'function'
      ? doc.fonts.ready.catch(() => undefined)
      : Promise.resolve();

  const waitLinks =
    pendingLinks.length === 0
      ? Promise.resolve()
      : Promise.all(
          pendingLinks.map(
            (link) =>
              new Promise<void>((resolve) => {
                const done = () => resolve();
                link.addEventListener('load', done, { once: true });
                link.addEventListener('error', done, { once: true });
              })
          )
        );

  const waitImages =
    pendingImages.length === 0
      ? Promise.resolve()
      : Promise.all(
          pendingImages.map(
            (img) =>
              new Promise<void>((resolve) => {
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              })
          )
        );

  const safetyTimeout = new Promise<void>((resolve) => setTimeout(resolve, 2200));

  Promise.race([Promise.all([waitFonts, waitLinks, waitImages]), safetyTimeout]).then(() => {
    // Allow layout pass after images/stylesheets decode
    setTimeout(doPrint, 100);
  });
}

function getCopiedHeadStyles(): string {
  if (typeof document === 'undefined') return '';
  const nodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  return nodes
    .map((el) => {
      if (el.tagName === 'LINK') {
        const link = el as HTMLLinkElement;
        return link.href ? `<link rel="stylesheet" href="${escapeHtml(link.href)}" />` : '';
      }
      return `<style>${el.textContent || ''}</style>`;
    })
    .join('\n');
}

export function openPrintDocument(options: OpenPrintDocumentOptions): void {
  if (typeof window === 'undefined') return;

  const {
    title,
    bodyHtml = '',
    styles = '',
    orientation = 'portrait',
    pageSize = 'A4',
    margin = '0.4in',
    copyDocumentStyles = false,
    rawHtml,
  } = options;

  const sizeDeclaration =
    pageSize === '13in 8.5in' ? 'size: 13in 8.5in;' : `size: ${pageSize} ${orientation};`;

  const headStyles = copyDocumentStyles ? getCopiedHeadStyles() : '';

  const html =
    rawHtml ||
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  ${headStyles}
  <style>
    @page {
      ${sizeDeclaration}
      margin: ${margin};
    }
    ${copyDocumentStyles ? 'html, body { margin: 0; padding: 0; background: #ffffff !important; color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' : BASE_PRINT_STYLES}
    ${styles}
  </style>
</head>
<body>
  <div class="lgu-print-container">
    ${bodyHtml}
  </div>
</body>
</html>`;

  const popup = window.open('', '_blank', 'width=1120,height=840');
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    triggerWindowPrintWhenReady(popup);
    return;
  }

  // Fallback for popup blockers: hidden iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframe.contentDocument || iframeWin?.document;
  if (!iframeWin || !iframeDoc) {
    iframe.remove();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  triggerWindowPrintWhenReady(iframeWin, () => {
    setTimeout(() => iframe.remove(), 500);
  });
}

export interface TableColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PrintTableReportOptions {
  title: string;
  subtitle?: string;
  dept?: string;
  metaRight?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'letter' | 'legal';
  columns: TableColumn[];
  rows: (string | number | boolean | null | undefined)[][];
  summaryCards?: { label: string; value: string | number }[];
  notesHtml?: string;
  signatures?: { caption?: string; name: string; role: string }[];
  footerNote?: string;
}

export function printTableReport(opts: PrintTableReportOptions): void {
  const {
    title,
    subtitle,
    dept,
    metaRight,
    orientation = 'landscape',
    pageSize = 'A4',
    columns,
    rows,
    summaryCards,
    notesHtml,
    signatures,
    footerNote = 'System Generated Official Report • Municipality of Malungon (MEEDOSys)',
  } = opts;

  const header = lguLetterheadHtml({ title, subtitle, dept, metaRight });

  const kpiHtml =
    summaryCards && summaryCards.length > 0
      ? `<div class="lgu-kpi-grid">${summaryCards
          .map(
            (card) => `
          <div class="lgu-kpi-card">
            <div class="lgu-kpi-label">${escapeHtml(card.label)}</div>
            <div class="lgu-kpi-value">${escapeHtml(card.value)}</div>
          </div>`
          )
          .join('')}</div>`
      : '';

  const theadHtml = `<thead><tr>${columns
    .map(
      (col) =>
        `<th style="text-align:${col.align || 'left'};${col.width ? `width:${col.width};` : ''}">${escapeHtml(col.label)}</th>`
    )
    .join('')}</tr></thead>`;

  const tbodyHtml =
    rows.length === 0
      ? `<tbody><tr><td colspan="${columns.length}" style="text-align:center;padding:18px;color:#64748b;">No matching records to print.</td></tr></tbody>`
      : `<tbody>${rows
          .map(
            (row) =>
              `<tr>${columns
                .map((col, idx) => {
                  const val = row[idx];
                  return `<td style="text-align:${col.align || 'left'};">${escapeHtml(val ?? '—')}</td>`;
                })
                .join('')}</tr>`
          )
          .join('')}</tbody>`;

  const sigHtml =
    signatures && signatures.length > 0
      ? `<div class="lgu-signatures">${signatures
          .map(
            (sig) => `
          <div class="lgu-sig-box">
            <div class="lgu-sig-caption">${escapeHtml(sig.caption || 'Prepared / Verified By:')}</div>
            <div class="lgu-sig-line">${escapeHtml(sig.name)}</div>
            <div class="lgu-sig-role">${escapeHtml(sig.role)}</div>
          </div>`
          )
          .join('')}</div>`
      : '';

  const bodyHtml = `
    ${header}
    ${kpiHtml}
    <table class="lgu-table">
      ${theadHtml}
      ${tbodyHtml}
    </table>
    ${notesHtml ? `<div class="lgu-notes">${notesHtml}</div>` : ''}
    ${sigHtml}
    <div class="lgu-footer-note">
      <span>${escapeHtml(footerNote)}</span>
      <span>Total Records: ${rows.length}</span>
    </div>
  `;

  openPrintDocument({
    title,
    bodyHtml,
    orientation,
    pageSize,
    margin: '0.4in',
  });
}
