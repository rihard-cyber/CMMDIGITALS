const REPORT_BRAND = 'SMPJDC - Jakarta Design Center';

const MONTHS_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const formatDateOnlyId = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatDateTimeId = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${time} WIB, ${formatDateOnlyId(date)}`;
};

export const formatDateForFile = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const getFirstPhoto = (photos) => {
  if (Array.isArray(photos)) return photos.find(Boolean) || '';
  return photos || '';
};

const toInlineStyle = (style) => {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}:${value}`)
    .join(';');
};

const isPhotoCell = (cell) => cell && typeof cell === 'object' && !Array.isArray(cell) && ('image' in cell || 'images' in cell);

const renderCell = (cell) => {
  if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
    const className = cell.className ? ` class="${escapeHtml(cell.className)}"` : '';
    const style = cell.style ? ` style="${escapeHtml(toInlineStyle(cell.style))}"` : '';
    const text = cell.text ?? '';
    const isPhoto = isPhotoCell(cell);
    if (isPhoto) {
      const rawImages = Array.isArray(cell.images) ? cell.images.filter(Boolean) : [];
      const singleImage = cell.image || getFirstPhoto(cell.images);
      const images = rawImages.length > 1 ? rawImages : (singleImage ? [singleImage] : []);
      const isMulti = images.length > 1;
      const imageHtml = images.length
        ? `<div class="photo-stack${isMulti ? ' photo-stack-multi' : ''}">${images.map(src => `<div class="photo-box photo-box-has${isMulti ? ' photo-box-sm' : ''}"><img src="${escapeHtml(src)}" alt="Foto" /></div>`).join('')}</div>`
        : '<div class="photo-box photo-box-empty"><span class="photo-na">-</span></div>';
      const textHtml = text !== '' && text !== null && text !== undefined
        ? `<div class="photo-caption">${escapeHtml(text)}</div>`
        : '';
      return `<td class="cell cell-photo${className}"${style}>${imageHtml}${textHtml}</td>`;
    }
    const textHtml = text !== '' && text !== null && text !== undefined
      ? `<div>${escapeHtml(text)}</div>`
      : '';
    return `<td class="cell${className}"${style}>${textHtml || '-'}</td>`;
  }
  return `<td class="cell">${escapeHtml(cell === '' || cell === null || cell === undefined ? '-' : cell)}</td>`;
};

const renderMeta = (items = []) => {
  const validItems = items.filter(item => item && item.label);
  if (!validItems.length) return '';
  return `
    <div class="meta-grid">
      ${validItems.map(item => `
        <div class="meta-item">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value ?? '-')}</strong>
        </div>
      `).join('')}
    </div>
  `;
};

export function exportTableToPdf({
  title,
  subtitle = REPORT_BRAND,
  columns,
  rows,
  fileName = 'laporan-smpjdc',
  orientation = 'landscape',
  meta = [],
  emptyText = 'Tidak ada data untuk dicetak.',
  footer = 'Dicetak dari Sistem Management Keamanan JDC'
}) {
  if (typeof window === 'undefined') return false;

  const printWin = window.open('', '_blank', 'width=1400,height=900');
  if (!printWin || printWin.closed || typeof printWin.closed === 'undefined') {
    return false;
  }

  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const colgroup = safeColumns.map(col => col.width ? `<col style="width:${escapeHtml(col.width)}" />` : '<col />').join('');
  const bodyHtml = safeRows.length
    ? safeRows.map((row, idx) => {
        const cells = Array.isArray(row) ? row : row.cells;
        const className = row?.className ? ` class="${escapeHtml(row.className)}"` : '';
        return `<tr${className}>${(cells || []).map(renderCell).join('')}</tr>`;
      }).join('')
    : `<tr><td class="empty" colspan="${safeColumns.length || 1}">${escapeHtml(emptyText)}</td></tr>`;

  const generatedAt = formatDateTimeId(new Date());
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
        <title>${escapeHtml(fileName)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
        <style>
          :root { color-scheme: only light; supported-color-schemes: light; }
          html { background: #ffffff !important; color-scheme: only light; }
          @page { size: A4 ${orientation}; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #000 !important;
            background: #ffffff !important;
            font-family: Arial, Helvetica, sans-serif;
            color-scheme: only light;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            forced-color-adjust: none;
          }
          .report-page { width: 100%; background: #fff !important; position: relative; z-index: 1; }
          .paper-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
            pointer-events: none;
          }
          .report-title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 3px;
            line-height: 1.2;
            color: #000 !important;
          }
          .report-subtitle {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            color: #555 !important;
            margin-bottom: 8px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 4px;
            margin: 0 0 7px;
          }
          .meta-item {
            border: 1px solid #777;
            padding: 4px 6px;
            min-height: 28px;
          }
          .meta-item span {
            display: block;
            font-size: 7px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
          }
          .meta-item strong {
            display: block;
            font-size: 9px;
            margin-top: 1px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #000;
          }
          th {
            background: #0070c0;
            color: #fff;
            border: 1px solid #000;
            padding: 6px 4px;
            font-size: 8px;
            line-height: 1.15;
            text-align: center;
            font-weight: 700;
            text-transform: uppercase;
          }
          td {
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #000;
            padding: 5px 4px;
            font-size: 8px;
            line-height: 1.35;
            text-align: center;
            vertical-align: middle;
            word-break: break-word;
            white-space: pre-wrap;
          }
          tbody tr:nth-child(even) td { background: #f7f7f7 !important; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .mono { font-family: Consolas, 'Courier New', monospace; }
          .status-done { font-weight: 700; }
          .cell-photo { vertical-align: middle; }
          .photo-box {
            width: 100%;
            height: 72px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .photo-box-has img {
            max-width: 100%;
            max-height: 68px;
            width: auto;
            height: auto;
            object-fit: contain;
            border: 1px solid #555;
            display: block;
          }
          .photo-stack {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }
          .photo-stack-multi { gap: 3px; }
          .photo-box-sm {
            height: 46px;
          }
          .photo-box-sm.photo-box-has img {
            max-height: 44px;
            max-width: 100%;
          }
          .photo-box-empty {
            color: #999;
            font-size: 8px;
          }
          .photo-na { font-style: italic; }
          .photo-caption { font-size: 7px; color: #666; margin-top: 1px; }
          .empty {
            padding: 22px;
            font-size: 11px;
            color: #555;
          }
          .print-footer {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 7px;
            font-size: 8px;
            color: #555;
          }
          .developer-watermark {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 15px;
            margin-bottom: 5px;
            opacity: 0.85;
          }
          .developer-watermark .ornament {
            color: #0070c0;
            font-size: 10px;
            font-weight: bold;
            user-select: none;
          }
          .developer-watermark .watermark-text {
            font-family: 'Great Vibes', 'Brush Script MT', cursive;
            font-size: 16px;
            color: #000;
            font-weight: 500;
            white-space: nowrap;
          }
          @media print {
            html, body {
              margin: 0;
              background: #ffffff !important;
              color: #000 !important;
            }
            .report-page { background: #ffffff !important; }
            td, .empty, .meta-item { background-color: #ffffff !important; }
            tbody tr:nth-child(even) td { background-color: #f7f7f7 !important; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <img class="paper-bg" alt="" src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1'%20height='1'%3E%3Crect%20width='1'%20height='1'%20fill='white'/%3E%3C/svg%3E" />
        <main class="report-page">
          <h1 class="report-title">${escapeHtml(title)}</h1>
          <div class="report-subtitle">${escapeHtml(subtitle)}</div>
          ${renderMeta(meta)}
          <table>
            <colgroup>${colgroup}</colgroup>
            <thead>
              <tr>${safeColumns.map(col => `<th>${escapeHtml(col.header || col)}</th>`).join('')}</tr>
            </thead>
            <tbody>${bodyHtml}</tbody>
          </table>
          <div class="developer-watermark">
            <span class="ornament">✧══════════•❁❀❁•══════════✧</span>
            <span class="watermark-text">Developer Richard Meha</span>
            <span class="ornament">✧══════════•❁❀❁•══════════✧</span>
          </div>
          <div class="print-footer">
            <span>${escapeHtml(footer)}</span>
            <span>Generated: ${escapeHtml(generatedAt)}</span>
          </div>
        </main>
        <script>
          window.onload = function () {
            setTimeout(function () { window.print(); }, 450);
          };
        <\/script>
      </body>
    </html>
  `;

  printWin.document.write(html);
  printWin.document.close();
  return true;
}
