import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableCell, TableRow, WidthType, BorderStyle, AlignmentType } from 'docx';

// Import file-saver dynamically to avoid type issues
const saveAs = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * 将HTML内容转换为Word文档并下载
 * @param htmlContent HTML格式的内容
 * @param filename 文件名（不含扩展名）
 */
export async function exportToWord(htmlContent: string, filename: string = 'document'): Promise<void> {
  try {
    // 解析HTML内容
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 转换HTML元素为Word段落
    const children = convertHtmlToDocxElements(doc.body);
    
    // 创建Word文档
    const document = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      }],
    });
    
    // 生成并下载文档
    const blob = await Packer.toBlob(document);
    saveAs(blob, `${filename}.docx`);
  } catch (error) {
    console.error('Word导出失败:', error);
    throw new Error('Word文档生成失败');
  }
}

/**
 * 将HTML元素转换为docx元素
 */
function convertHtmlToDocxElements(element: HTMLElement): any[] {
  const children: any[] = [];
  
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        children.push(new Paragraph({
          children: [new TextRun({ text })],
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          children.push(createHeading(el.textContent || '', HeadingLevel.HEADING_1));
          break;
        case 'h2':
          children.push(createHeading(el.textContent || '', HeadingLevel.HEADING_2));
          break;
        case 'h3':
          children.push(createHeading(el.textContent || '', HeadingLevel.HEADING_3));
          break;
        case 'h4':
          children.push(createHeading(el.textContent || '', HeadingLevel.HEADING_4));
          break;
        case 'p':
          children.push(createParagraph(el));
          break;
        case 'ul':
        case 'ol':
          children.push(...createList(el, tagName === 'ol'));
          break;
        case 'table':
          children.push(createTable(el));
          break;
        case 'div':
          // 递归处理div内容
          children.push(...convertHtmlToDocxElements(el));
          break;
        case 'blockquote':
          children.push(createBlockquote(el));
          break;
        case 'br':
          // 换行符，在段落中处理
          break;
        case 'hr':
          children.push(new Paragraph({
            border: {
              bottom: {
                color: "999999",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }));
          break;
        default:
          // 对于其他标签，递归处理其子元素
          children.push(...convertHtmlToDocxElements(el));
      }
    }
  });
  
  return children;
}

/**
 * 创建标题
 */
function createHeading(text: string, level: HeadingLevel): Paragraph {
  return new Paragraph({
    text: text.trim(),
    heading: level,
    spacing: {
      before: 240,
      after: 120,
    },
  });
}

/**
 * 创建段落
 */
function createParagraph(el: HTMLElement): Paragraph {
  const runs: TextRun[] = [];
  
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        runs.push(new TextRun({ text }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const childEl = node as HTMLElement;
      const tagName = childEl.tagName.toLowerCase();
      const text = childEl.textContent || '';
      
      switch (tagName) {
        case 'strong':
        case 'b':
          runs.push(new TextRun({ text, bold: true }));
          break;
        case 'em':
        case 'i':
          runs.push(new TextRun({ text, italics: true }));
          break;
        case 'u':
          runs.push(new TextRun({ text, underline: { type: 'single' } }));
          break;
        case 's':
        case 'del':
          runs.push(new TextRun({ text, strike: true }));
          break;
        case 'br':
          runs.push(new TextRun({ text: '\n' }));
          break;
        case 'a':
          runs.push(new TextRun({ text, color: '0563C1', underline: { type: 'single' } }));
          break;
        case 'span':
        default:
          runs.push(new TextRun({ text }));
      }
    }
  });
  
  return new Paragraph({
    children: runs,
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * 创建列表
 */
function createList(el: HTMLElement, isOrdered: boolean): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const items = el.querySelectorAll(':scope > li');
  
  items.forEach((item, index) => {
    const text = item.textContent || '';
    const bullet = isOrdered ? `${index + 1}. ` : '• ';
    
    paragraphs.push(new Paragraph({
      text: bullet + text.trim(),
      spacing: {
        before: 60,
        after: 60,
      },
      indent: {
        left: 720,
      },
    }));
  });
  
  return paragraphs;
}

/**
 * 创建表格
 */
function createTable(el: HTMLElement): Table {
  const rows: TableRow[] = [];
  const trElements = el.querySelectorAll('tr');
  
  trElements.forEach((tr, rowIndex) => {
    const cells: TableCell[] = [];
    const cellElements = tr.querySelectorAll('th, td');
    
    cellElements.forEach((cell) => {
      const isHeader = cell.tagName.toLowerCase() === 'th';
      const text = cell.textContent || '';
      
      const cellParagraph = new Paragraph({
        text: text.trim(),
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      });
      
      // Add bold to header cells using TextRun
      const cellContent = isHeader 
        ? new Paragraph({
            children: [new TextRun({ text: text.trim(), bold: true })],
            alignment: AlignmentType.CENTER,
          })
        : cellParagraph;
      
      cells.push(new TableCell({
        children: [cellContent],
        shading: isHeader ? {
          fill: 'F2F2F2',
        } : undefined,
        verticalAlign: 'center',
      }));
    });
    
    rows.push(new TableRow({
      children: cells,
      tableHeader: rowIndex === 0,
    }));
  });
  
  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
  });
}

/**
 * 创建引用块
 */
function createBlockquote(el: HTMLElement): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: el.textContent?.trim() || '', italics: true })],
    spacing: {
      before: 120,
      after: 120,
    },
    indent: {
      left: 720,
      right: 720,
    },
    border: {
      left: {
        color: 'CCCCCC',
        space: 10,
        style: BorderStyle.SINGLE,
        size: 24,
      },
    },
  });
}

/**
 * 简化版导出函数 - 将纯文本导出为Word
 */
export async function exportTextToWord(text: string, filename: string = 'document'): Promise<void> {
  const document = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        new Paragraph({
          text: text,
          spacing: {
            before: 120,
            after: 120,
          },
        }),
      ],
    }],
  });
  
  const blob = await Packer.toBlob(document);
  saveAs(blob, `${filename}.docx`);
}
