import type { OutlineSection, OutlineTemplate, OutlineValidationResult } from './types';
import type { Template } from '../TemplatePreview';

export function convertTemplateToOutline(template: Template): OutlineTemplate {
  const now = Date.now();
  return {
    ...template,
    sections: template.sections.map((section, index) => ({
      ...section,
      level: 1,
      order: index,
      isExpanded: true,
      isEditing: false,
    })),
    createdAt: now,
    updatedAt: now,
    isCustom: false,
  };
}

export function flattenSections(sections: OutlineSection[]): OutlineSection[] {
  const result: OutlineSection[] = [];
  
  function traverse(section: OutlineSection) {
    result.push(section);
    if (section.children && section.isExpanded !== false) {
      section.children.forEach(traverse);
    }
  }
  
  sections.forEach(traverse);
  return result;
}

export function findSectionById(sections: OutlineSection[], id: string): OutlineSection | null {
  for (const section of sections) {
    if (section.id === id) return section;
    if (section.children) {
      const found = findSectionById(section.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentSection(sections: OutlineSection[], childId: string): OutlineSection | null {
  for (const section of sections) {
    if (section.children?.some(child => child.id === childId)) {
      return section;
    }
    if (section.children) {
      const found = findParentSection(section.children, childId);
      if (found) return found;
    }
  }
  return null;
}

export function removeSectionById(sections: OutlineSection[], id: string): OutlineSection[] {
  return sections.filter(section => {
    if (section.id === id) return false;
    if (section.children) {
      section.children = removeSectionById(section.children, id);
    }
    return true;
  });
}

export function addSectionAtIndex(
  sections: OutlineSection[],
  newSection: OutlineSection,
  parentId?: string,
  index?: number
): OutlineSection[] {
  if (!parentId) {
    const newIndex = index !== undefined ? index : sections.length;
    const newSections = [...sections];
    newSections.splice(newIndex, 0, newSection);
    return newSections.map((s, i) => ({ ...s, order: i }));
  }

  return sections.map(section => {
    if (section.id === parentId) {
      const children = section.children || [];
      const newIndex = index !== undefined ? index : children.length;
      const newChildren = [...children];
      newChildren.splice(newIndex, 0, { ...newSection, level: section.level + 1 });
      return {
        ...section,
        children: newChildren.map((c, i) => ({ ...c, order: i })),
        isExpanded: true,
      };
    }
    if (section.children) {
      return {
        ...section,
        children: addSectionAtIndex(section.children, newSection, parentId, index),
      };
    }
    return section;
  });
}

export function updateSectionById(
  sections: OutlineSection[],
  id: string,
  updates: Partial<OutlineSection>
): OutlineSection[] {
  return sections.map(section => {
    if (section.id === id) {
      return { ...section, ...updates };
    }
    if (section.children) {
      return {
        ...section,
        children: updateSectionById(section.children, id, updates),
      };
    }
    return section;
  });
}

export function moveSection(
  sections: OutlineSection[],
  sectionId: string,
  direction: 'up' | 'down' | 'left' | 'right'
): OutlineSection[] {
  const flatList = flattenSections(sections);
  const currentIndex = flatList.findIndex(s => s.id === sectionId);
  
  if (currentIndex === -1) return sections;
  
  const section = flatList[currentIndex];
  
  switch (direction) {
    case 'up':
      if (currentIndex > 0) {
        return reorderSections(sections, currentIndex, currentIndex - 1);
      }
      break;
    case 'down':
      if (currentIndex < flatList.length - 1) {
        return reorderSections(sections, currentIndex, currentIndex + 1);
      }
      break;
    case 'left':
      if (section.level > 1) {
        return changeSectionLevel(sections, sectionId, -1);
      }
      break;
    case 'right':
      return changeSectionLevel(sections, sectionId, 1);
  }
  
  return sections;
}

export function reorderSections(
  sections: OutlineSection[],
  sourceIndex: number,
  targetIndex: number
): OutlineSection[] {
  const flatList = flattenSections(sections);
  
  if (sourceIndex < 0 || sourceIndex >= flatList.length) return sections;
  if (targetIndex < 0 || targetIndex >= flatList.length) return sections;
  
  const [moved] = flatList.splice(sourceIndex, 1);
  flatList.splice(targetIndex, 0, moved);
  
  return rebuildHierarchy(flatList);
}

export function changeSectionLevel(
  sections: OutlineSection[],
  sectionId: string,
  delta: number
): OutlineSection[] {
  const flatList = flattenSections(sections);
  const sectionIndex = flatList.findIndex(s => s.id === sectionId);
  
  if (sectionIndex === -1) return sections;
  
  const newLevel = Math.max(1, flatList[sectionIndex].level + delta);
  flatList[sectionIndex] = { ...flatList[sectionIndex], level: newLevel };
  
  return rebuildHierarchy(flatList);
}

function rebuildHierarchy(flatList: OutlineSection[]): OutlineSection[] {
  const result: OutlineSection[] = [];
  const stack: OutlineSection[] = [];
  
  for (const section of flatList) {
    const newSection = { ...section, children: [] };
    
    while (stack.length > 0 && stack[stack.length - 1].level >= newSection.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      result.push(newSection);
    } else {
      const parent = stack[stack.length - 1];
      parent.children = parent.children || [];
      parent.children.push(newSection);
    }
    
    stack.push(newSection);
  }
  
  return result;
}

export function validateOutline(outline: OutlineTemplate): OutlineValidationResult {
  const errors: { sectionId: string; field: 'name' | 'level' | 'order'; message: string }[] = [];
  const warnings: string[] = [];

  const flatList = flattenSections(outline.sections);

  // 检查大纲名称
  if (!outline.name || outline.name.trim() === '') {
    errors.push({
      sectionId: 'outline',
      field: 'name',
      message: '大纲名称不能为空',
    });
  }

  if (outline.name && outline.name.length > 50) {
    warnings.push('大纲名称较长，建议使用简洁的名称');
  }

  // 检查章节
  flatList.forEach((section, index) => {
    // 1. 章节名称不能为空
    if (!section.name || section.name.trim() === '') {
      errors.push({
        sectionId: section.id,
        field: 'name',
        message: `第 ${index + 1} 个章节的名称不能为空`,
      });
    }

    // 2. 章节名称长度检查
    if (section.name && section.name.length > 100) {
      errors.push({
        sectionId: section.id,
        field: 'name',
        message: `章节"${section.name.substring(0, 20)}..."的名称超过100个字符`,
      });
    }

    // 3. 章节名称不能仅为空白字符
    if (section.name && section.name.trim().length === 0) {
      errors.push({
        sectionId: section.id,
        field: 'name',
        message: `第 ${index + 1} 个章节的名称不能仅为空白字符`,
      });
    }

    // 4. 层级范围检查
    if (section.level < 1 || section.level > 6) {
      errors.push({
        sectionId: section.id,
        field: 'level',
        message: `章节"${section.name}"的层级(${section.level})必须在1-6之间`,
      });
    }

    // 5. 检查重复章节名称
    const duplicateNames = flatList.filter(
      (s, i) => i !== index && s.name?.toLowerCase().trim() === section.name?.toLowerCase().trim()
    );
    if (duplicateNames.length > 0) {
      warnings.push(`发现重复章节名称"${section.name}"，建议保持名称唯一性`);
    }

    // 6. 层级跳跃检查
    if (index > 0) {
      const prevSection = flatList[index - 1];
      if (section.level > prevSection.level + 1) {
        errors.push({
          sectionId: section.id,
          field: 'level',
          message: `章节"${section.name}"的层级(${section.level})与上一章节(${prevSection.level})跳跃过大，中间缺少${section.level - prevSection.level - 1}个层级`,
        });
      }
    }

    // 7. 检查一级章节数量
    if (section.level === 1 && index > 0 && flatList[index - 1].level > 1) {
      // 这是正常的，一级章节可以在任何位置
    }

    // 8. 检查子章节数量
    if (section.children && section.children.length > 10) {
      warnings.push(`章节"${section.name}"的子章节数量(${section.children.length})较多，建议适当精简`);
    }

    // 9. 检查章节名称质量
    if (section.name) {
      const trimmedName = section.name.trim();
      // 检查是否以数字开头（可能导致编号混乱）
      if (/^\d+[\.、\s]/.test(trimmedName)) {
        warnings.push(`章节"${trimmedName}"以数字开头，可能与自动编号冲突`);
      }
      // 检查是否包含特殊字符
      if (/[<>\"'&]/.test(trimmedName)) {
        warnings.push(`章节"${trimmedName}"包含特殊字符，可能影响显示`);
      }
    }
  });

  // 10. 检查大纲整体结构
  if (flatList.length === 0) {
    errors.push({
      sectionId: 'outline',
      field: 'name',
      message: '大纲为空，请至少添加一个章节',
    });
  }

  if (flatList.length < 3) {
    warnings.push('章节数量较少，建议至少包含3个主要章节以形成完整结构');
  }

  if (flatList.length > 50) {
    warnings.push(`章节数量(${flatList.length})过多，建议精简大纲结构以提高可读性`);
  }

  // 11. 检查一级章节数量
  const topLevelSections = flatList.filter(s => s.level === 1);
  if (topLevelSections.length === 0 && flatList.length > 0) {
    errors.push({
      sectionId: 'outline',
      field: 'level',
      message: '至少需要有一个一级章节作为文档的主结构',
    });
  }

  if (topLevelSections.length > 15) {
    warnings.push(`一级章节数量(${topLevelSections.length})较多，建议控制在10个以内`);
  }

  // 12. 检查层级深度
  const maxLevel = Math.max(...flatList.map(s => s.level), 1);
  if (maxLevel > 4) {
    warnings.push(`大纲层级较深(共${maxLevel}级)，建议控制在4级以内以保持清晰`);
  }

  // 13. 检查是否有执行摘要/概述类章节（针对商业计划书）
  const hasSummary = flatList.some(s =>
    /摘要|概述|简介|背景|introduction|summary|overview/i.test(s.name)
  );
  if (!hasSummary && flatList.length > 3) {
    warnings.push('建议添加"执行摘要"或"概述"章节作为文档开头');
  }

  // 14. 检查是否有结论/总结类章节
  const hasConclusion = flatList.some(s =>
    /结论|总结|展望|conclusion|summary|outlook/i.test(s.name)
  );
  if (!hasConclusion && flatList.length > 5) {
    warnings.push('建议添加"结论"或"总结"章节作为文档结尾');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptySection(level: number = 1, order: number = 0): OutlineSection {
  return {
    id: generateSectionId(),
    name: '新章节',
    description: '',
    level,
    order,
    isExpanded: true,
    isEditing: true,
  };
}

export function exportOutlineToMarkdown(outline: OutlineTemplate): string {
  let markdown = `# ${outline.name}\n\n`;
  markdown += `${outline.description}\n\n`;
  
  function exportSection(section: OutlineSection, depth: number = 0): string {
    const indent = '  '.repeat(depth);
    let result = `${indent}- **${section.name}**`;
    if (section.description) {
      result += `: ${section.description}`;
    }
    result += '\n';
    
    if (section.children) {
      section.children.forEach(child => {
        result += exportSection(child, depth + 1);
      });
    }
    
    return result;
  }
  
  outline.sections.forEach(section => {
    markdown += exportSection(section);
  });
  
  return markdown;
}

export function exportOutlineToJSON(outline: OutlineTemplate): string {
  return JSON.stringify(outline, null, 2);
}
