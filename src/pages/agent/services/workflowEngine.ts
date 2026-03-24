// 智能工作流引擎 - 自动化任务分解与执行

import { AgentType } from '../types/agent';
import { getPredictionService, BehaviorType } from './predictionService';
import { getRAGService } from './ragService';

// 工作流节点类型
export enum WorkflowNodeType {
  START = 'start',
  ANALYSIS = 'analysis',
  DESIGN = 'design',
  REVIEW = 'review',
  REVISE = 'revise',
  APPROVE = 'approve',
  END = 'end'
}

// 工作流节点
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  agent: AgentType;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  estimatedTime: number; // 预估时间（毫秒）
  dependencies: string[]; // 依赖的节点ID
  autoExecute: boolean; // 是否自动执行
}

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  startNodeId: string;
  endNodeId: string;
}

// 工作流实例
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentNodeId: string;
  completedNodes: string[];
  data: Record<string, any>;
  startTime: number;
  endTime?: number;
  progress: number; // 0-100
}

// 质量检查结果
export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0-100
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }[];
  improvements: string[];
}

// 预定义工作流模板
const WORKFLOW_TEMPLATES: Record<string, Workflow> = {
  // ==================== 功能工作流 ====================
  'ip-design': {
    id: 'ip-design',
    name: 'IP形象设计工作流',
    description: '完整的IP形象设计流程',
    nodes: [
      {
        id: 'start',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集IP设计需求',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'analysis',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'researcher',
        name: '市场分析',
        description: '分析目标市场和竞品',
        inputs: ['requirements'],
        outputs: ['analysisReport'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['start'],
        autoExecute: true
      },
      {
        id: 'concept',
        type: WorkflowNodeType.DESIGN,
        agent: 'illustrator',
        name: '概念设计',
        description: '设计IP形象概念',
        inputs: ['requirements', 'analysisReport'],
        outputs: ['conceptDesigns'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['analysis'],
        autoExecute: true
      },
      {
        id: 'review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '设计评审',
        description: '评审设计方案',
        inputs: ['conceptDesigns'],
        outputs: ['reviewFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['concept'],
        autoExecute: false
      },
      {
        id: 'refine',
        type: WorkflowNodeType.REVISE,
        agent: 'illustrator',
        name: '优化调整',
        description: '根据反馈优化设计',
        inputs: ['conceptDesigns', 'reviewFeedback'],
        outputs: ['finalDesign'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['review'],
        autoExecute: true
      },
      {
        id: 'approve',
        type: WorkflowNodeType.APPROVE,
        agent: 'director',
        name: '最终确认',
        description: '确认最终设计',
        inputs: ['finalDesign'],
        outputs: ['approvedDesign'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['refine'],
        autoExecute: false
      },
      {
        id: 'end',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '完成',
        description: '工作流完成',
        inputs: ['approvedDesign'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['approve'],
        autoExecute: true
      }
    ],
    startNodeId: 'start',
    endNodeId: 'end'
  },

  'brand-design': {
    id: 'brand-design',
    name: '品牌设计工作流',
    description: '完整的品牌设计流程',
    nodes: [
      {
        id: 'start',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集品牌设计需求',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'strategy',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'copywriter',
        name: '品牌策略',
        description: '制定品牌策略和定位',
        inputs: ['requirements'],
        outputs: ['brandStrategy'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['start'],
        autoExecute: true
      },
      {
        id: 'logo',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'Logo设计',
        description: '设计品牌Logo',
        inputs: ['brandStrategy'],
        outputs: ['logoDesigns'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['strategy'],
        autoExecute: true
      },
      {
        id: 'vi',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'VI设计',
        description: '设计视觉识别系统',
        inputs: ['logoDesigns'],
        outputs: ['viSystem'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['logo'],
        autoExecute: true
      },
      {
        id: 'review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '整体评审',
        description: '评审品牌设计方案',
        inputs: ['viSystem'],
        outputs: ['reviewFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['vi'],
        autoExecute: false
      },
      {
        id: 'end',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '完成',
        description: '工作流完成',
        inputs: ['reviewFeedback'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['review'],
        autoExecute: true
      }
    ],
    startNodeId: 'start',
    endNodeId: 'end'
  },

  // ==================== 复合业务工作流 ====================

  // 品牌设计 + 包装 + 宣传物料完整工作流
  'brand-packaging-promotion': {
    id: 'brand-packaging-promotion',
    name: '品牌设计+包装+宣传物料工作流',
    description: '完整的品牌视觉系统设计流程，包含品牌策略、Logo设计、VI系统、包装设计和宣传物料',
    nodes: [
      {
        id: 'requirement_analysis',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求分析',
        description: '深入分析品牌设计需求，明确目标和受众',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'brand_strategy',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'copywriter',
        name: '品牌策略制定',
        description: '制定品牌定位、品牌故事和核心价值',
        inputs: ['requirements'],
        outputs: ['brandStrategy'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['requirement_analysis'],
        autoExecute: true
      },
      {
        id: 'logo_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '品牌Logo设计',
        description: '设计品牌标志和Logo系统',
        inputs: ['brandStrategy'],
        outputs: ['logoDesigns'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['brand_strategy'],
        autoExecute: false
      },
      {
        id: 'logo_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: 'Logo方案评审',
        description: '评审Logo设计方案，确认方向',
        inputs: ['logoDesigns'],
        outputs: ['logoFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['logo_design'],
        autoExecute: false
      },
      {
        id: 'logo_refinement',
        type: WorkflowNodeType.REVISE,
        agent: 'designer',
        name: 'Logo优化定稿',
        description: '根据反馈优化Logo设计',
        inputs: ['logoDesigns', 'logoFeedback'],
        outputs: ['finalLogo'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['logo_review'],
        autoExecute: false
      },
      {
        id: 'vi_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'VI系统设计',
        description: '设计品牌视觉识别系统（色彩、字体、图形系统）',
        inputs: ['finalLogo', 'brandStrategy'],
        outputs: ['viSystem'],
        estimatedTime: 20 * 60 * 1000,
        dependencies: ['logo_refinement'],
        autoExecute: false
      },
      {
        id: 'vi_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: 'VI系统评审',
        description: '评审VI系统设计方案',
        inputs: ['viSystem'],
        outputs: ['viFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['vi_design'],
        autoExecute: false
      },
      {
        id: 'packaging_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '包装设计',
        description: '设计产品包装（基于已确定的品牌视觉）',
        inputs: ['viSystem', 'finalLogo'],
        outputs: ['packagingDesigns'],
        estimatedTime: 25 * 60 * 1000,
        dependencies: ['vi_review'],
        autoExecute: false
      },
      {
        id: 'packaging_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '包装方案评审',
        description: '评审包装设计方案',
        inputs: ['packagingDesigns'],
        outputs: ['packagingFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['packaging_design'],
        autoExecute: false
      },
      {
        id: 'promotion_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '宣传物料设计',
        description: '设计海报、宣传册等营销物料',
        inputs: ['viSystem', 'finalLogo', 'packagingFeedback'],
        outputs: ['promotionMaterials'],
        estimatedTime: 20 * 60 * 1000,
        dependencies: ['packaging_review'],
        autoExecute: false
      },
      {
        id: 'final_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '整体方案评审',
        description: '评审所有设计成果',
        inputs: ['finalLogo', 'viSystem', 'packagingDesigns', 'promotionMaterials'],
        outputs: ['finalFeedback'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['promotion_design'],
        autoExecute: false
      },
      {
        id: 'final_delivery',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '项目交付',
        description: '整理并交付所有设计文件',
        inputs: ['finalFeedback'],
        outputs: ['deliveryPackage'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['final_review'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_analysis',
    endNodeId: 'final_delivery'
  },

  // 品牌设计 + 包装工作流（简化版）
  'brand-packaging': {
    id: 'brand-packaging',
    name: '品牌设计+包装工作流',
    description: '品牌视觉系统设计加包装设计',
    nodes: [
      {
        id: 'start',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集品牌和包装设计需求',
        inputs: [],
        outputs: ['requirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'brand_strategy',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'copywriter',
        name: '品牌策略',
        description: '制定品牌定位和策略',
        inputs: ['requirements'],
        outputs: ['brandStrategy'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['start'],
        autoExecute: true
      },
      {
        id: 'logo_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'Logo设计',
        description: '设计品牌Logo',
        inputs: ['brandStrategy'],
        outputs: ['logoDesigns'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['brand_strategy'],
        autoExecute: false
      },
      {
        id: 'logo_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: 'Logo评审',
        description: '评审并确认Logo方案',
        inputs: ['logoDesigns'],
        outputs: ['logoFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['logo_design'],
        autoExecute: false
      },
      {
        id: 'vi_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: 'VI设计',
        description: '设计品牌视觉识别系统',
        inputs: ['logoDesigns'],
        outputs: ['viSystem'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['logo_review'],
        autoExecute: false
      },
      {
        id: 'packaging_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '包装设计',
        description: '基于品牌视觉设计包装',
        inputs: ['viSystem'],
        outputs: ['packagingDesigns'],
        estimatedTime: 20 * 60 * 1000,
        dependencies: ['vi_design'],
        autoExecute: false
      },
      {
        id: 'final_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '最终评审',
        description: '整体方案评审',
        inputs: ['packagingDesigns'],
        outputs: ['reviewFeedback'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['packaging_design'],
        autoExecute: false
      },
      {
        id: 'end',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '完成',
        description: '项目完成',
        inputs: ['reviewFeedback'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['final_review'],
        autoExecute: true
      }
    ],
    startNodeId: 'start',
    endNodeId: 'end'
  },

  // ==================== 角色专属工作流 ====================

  // 1. 设计总监专属工作流
  'director-workflow': {
    id: 'director-workflow',
    name: '设计总监工作流',
    description: '统筹全局、需求分析、任务分配、质量把控',
    nodes: [
      {
        id: 'requirement_collection',
        type: WorkflowNodeType.START,
        agent: 'director',
        name: '需求收集',
        description: '收集用户需求',
        inputs: [],
        outputs: ['rawRequirements'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'intent_analysis',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'director',
        name: '意图分析',
        description: '分析用户意图',
        inputs: ['rawRequirements'],
        outputs: ['intentAnalysis'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['requirement_collection'],
        autoExecute: true
      },
      {
        id: 'task_planning',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'director',
        name: '任务规划',
        description: '制定项目计划',
        inputs: ['intentAnalysis'],
        outputs: ['projectPlan'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['intent_analysis'],
        autoExecute: true
      },
      {
        id: 'agent_assignment',
        type: WorkflowNodeType.DESIGN,
        agent: 'director',
        name: 'Agent分配',
        description: '分配任务给专业Agent',
        inputs: ['projectPlan'],
        outputs: ['taskAssignments'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['task_planning'],
        autoExecute: true
      },
      {
        id: 'progress_monitoring',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '进度监控',
        description: '监控项目进度',
        inputs: ['taskAssignments'],
        outputs: ['progressReport'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['agent_assignment'],
        autoExecute: false
      },
      {
        id: 'quality_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'director',
        name: '质量评审',
        description: '质量评审',
        inputs: ['progressReport'],
        outputs: ['qualityReport'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['progress_monitoring'],
        autoExecute: false
      },
      {
        id: 'final_delivery',
        type: WorkflowNodeType.END,
        agent: 'director',
        name: '最终交付',
        description: '最终交付',
        inputs: ['qualityReport'],
        outputs: [],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['quality_review'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_collection',
    endNodeId: 'final_delivery'
  },

  // 2. 品牌设计师专属工作流
  'designer-workflow': {
    id: 'designer-workflow',
    name: '品牌设计师工作流',
    description: '视觉设计、图像生成、品牌/海报/包装设计',
    nodes: [
      {
        id: 'requirement_analysis',
        type: WorkflowNodeType.START,
        agent: 'designer',
        name: '需求分析',
        description: '分析设计需求',
        inputs: [],
        outputs: ['designRequirements'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'style_exploration',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '风格探索',
        description: '探索设计风格',
        inputs: ['designRequirements'],
        outputs: ['styleOptions'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['requirement_analysis'],
        autoExecute: true
      },
      {
        id: 'draft_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'designer',
        name: '初稿设计',
        description: '制作设计初稿',
        inputs: ['styleOptions'],
        outputs: ['designDrafts'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['style_exploration'],
        autoExecute: true
      },
      {
        id: 'design_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'designer',
        name: '方案评审',
        description: '设计方案评审',
        inputs: ['designDrafts'],
        outputs: ['reviewFeedback'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['draft_design'],
        autoExecute: false
      },
      {
        id: 'design_refinement',
        type: WorkflowNodeType.REVISE,
        agent: 'designer',
        name: '优化调整',
        description: '优化调整设计',
        inputs: ['designDrafts', 'reviewFeedback'],
        outputs: ['refinedDesign'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['design_review'],
        autoExecute: true
      },
      {
        id: 'final_design',
        type: WorkflowNodeType.APPROVE,
        agent: 'designer',
        name: '最终定稿',
        description: '最终定稿',
        inputs: ['refinedDesign'],
        outputs: ['finalDesign'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['design_refinement'],
        autoExecute: false
      },
      {
        id: 'design_end',
        type: WorkflowNodeType.END,
        agent: 'designer',
        name: '完成',
        description: '工作流完成',
        inputs: ['finalDesign'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['final_design'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_analysis',
    endNodeId: 'design_end'
  },

  // 3. 插画师专属工作流
  'illustrator-workflow': {
    id: 'illustrator-workflow',
    name: '插画师工作流',
    description: '手绘风格、角色设计、概念插画',
    nodes: [
      {
        id: 'requirement_understanding',
        type: WorkflowNodeType.START,
        agent: 'illustrator',
        name: '需求理解',
        description: '理解创作需求',
        inputs: [],
        outputs: ['creativeRequirements'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'sketch_drawing',
        type: WorkflowNodeType.DESIGN,
        agent: 'illustrator',
        name: '草图绘制',
        description: '绘制概念草图',
        inputs: ['creativeRequirements'],
        outputs: ['sketches'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['requirement_understanding'],
        autoExecute: true
      },
      {
        id: 'lineart_drawing',
        type: WorkflowNodeType.DESIGN,
        agent: 'illustrator',
        name: '线稿绘制',
        description: '绘制精细线稿',
        inputs: ['sketches'],
        outputs: ['lineart'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['sketch_drawing'],
        autoExecute: true
      },
      {
        id: 'coloring_rendering',
        type: WorkflowNodeType.DESIGN,
        agent: 'illustrator',
        name: '上色渲染',
        description: '上色和渲染',
        inputs: ['lineart'],
        outputs: ['coloredArtwork'],
        estimatedTime: 12 * 60 * 1000,
        dependencies: ['lineart_drawing'],
        autoExecute: true
      },
      {
        id: 'detail_refinement',
        type: WorkflowNodeType.REVISE,
        agent: 'illustrator',
        name: '细节完善',
        description: '细节完善',
        inputs: ['coloredArtwork'],
        outputs: ['refinedArtwork'],
        estimatedTime: 6 * 60 * 1000,
        dependencies: ['coloring_rendering'],
        autoExecute: true
      },
      {
        id: 'final_artwork',
        type: WorkflowNodeType.APPROVE,
        agent: 'illustrator',
        name: '完稿交付',
        description: '完稿交付',
        inputs: ['refinedArtwork'],
        outputs: ['finalArtwork'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['detail_refinement'],
        autoExecute: false
      },
      {
        id: 'illustrator_end',
        type: WorkflowNodeType.END,
        agent: 'illustrator',
        name: '完成',
        description: '工作流完成',
        inputs: ['finalArtwork'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['final_artwork'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_understanding',
    endNodeId: 'illustrator_end'
  },

  // 4. 文案策划专属工作流
  'copywriter-workflow': {
    id: 'copywriter-workflow',
    name: '文案策划工作流',
    description: '品牌文案、标语创作、故事编写',
    nodes: [
      {
        id: 'requirement_research',
        type: WorkflowNodeType.START,
        agent: 'copywriter',
        name: '需求调研',
        description: '调研文案需求',
        inputs: [],
        outputs: ['copyRequirements'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'creative_conception',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'copywriter',
        name: '创意构思',
        description: '创意构思',
        inputs: ['copyRequirements'],
        outputs: ['creativeConcepts'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['requirement_research'],
        autoExecute: true
      },
      {
        id: 'copywriting',
        type: WorkflowNodeType.DESIGN,
        agent: 'copywriter',
        name: '文案撰写',
        description: '撰写文案',
        inputs: ['creativeConcepts'],
        outputs: ['copyDrafts'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['creative_conception'],
        autoExecute: true
      },
      {
        id: 'internal_review',
        type: WorkflowNodeType.REVIEW,
        agent: 'copywriter',
        name: '内部审核',
        description: '内部审核',
        inputs: ['copyDrafts'],
        outputs: ['reviewNotes'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['copywriting'],
        autoExecute: false
      },
      {
        id: 'copy_optimization',
        type: WorkflowNodeType.REVISE,
        agent: 'copywriter',
        name: '修改优化',
        description: '修改优化',
        inputs: ['copyDrafts', 'reviewNotes'],
        outputs: ['optimizedCopy'],
        estimatedTime: 5 * 60 * 1000,
        dependencies: ['internal_review'],
        autoExecute: true
      },
      {
        id: 'final_copy',
        type: WorkflowNodeType.APPROVE,
        agent: 'copywriter',
        name: '最终文案',
        description: '最终文案',
        inputs: ['optimizedCopy'],
        outputs: ['finalCopy'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: ['copy_optimization'],
        autoExecute: false
      },
      {
        id: 'copywriter_end',
        type: WorkflowNodeType.END,
        agent: 'copywriter',
        name: '完成',
        description: '工作流完成',
        inputs: ['finalCopy'],
        outputs: [],
        estimatedTime: 0,
        dependencies: ['final_copy'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_research',
    endNodeId: 'copywriter_end'
  },

  // 5. 动画师专属工作流
  'animator-workflow': {
    id: 'animator-workflow',
    name: '动画师工作流',
    description: '动画制作、视频编辑、动效设计、表情包制作',
    nodes: [
      {
        id: 'requirement_confirmation',
        type: WorkflowNodeType.START,
        agent: 'animator',
        name: '需求确认',
        description: '确认动画需求',
        inputs: [],
        outputs: ['animationRequirements'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'storyboard_design',
        type: WorkflowNodeType.DESIGN,
        agent: 'animator',
        name: '分镜设计',
        description: '分镜设计',
        inputs: ['animationRequirements'],
        outputs: ['storyboard'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['requirement_confirmation'],
        autoExecute: true
      },
      {
        id: 'keyframe_drawing',
        type: WorkflowNodeType.DESIGN,
        agent: 'animator',
        name: '关键帧绘制',
        description: '关键帧绘制',
        inputs: ['storyboard'],
        outputs: ['keyframes'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['storyboard_design'],
        autoExecute: true
      },
      {
        id: 'animation_production',
        type: WorkflowNodeType.DESIGN,
        agent: 'animator',
        name: '动画制作',
        description: '动画制作',
        inputs: ['keyframes'],
        outputs: ['animation'],
        estimatedTime: 15 * 60 * 1000,
        dependencies: ['keyframe_drawing'],
        autoExecute: true
      },
      {
        id: 'post_editing',
        type: WorkflowNodeType.REVISE,
        agent: 'animator',
        name: '后期编辑',
        description: '后期编辑',
        inputs: ['animation'],
        outputs: ['editedAnimation'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['animation_production'],
        autoExecute: true
      },
      {
        id: 'final_export',
        type: WorkflowNodeType.END,
        agent: 'animator',
        name: '导出交付',
        description: '导出交付',
        inputs: ['editedAnimation'],
        outputs: ['finalAnimation'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['post_editing'],
        autoExecute: true
      }
    ],
    startNodeId: 'requirement_confirmation',
    endNodeId: 'final_export'
  },

  // 6. 研究员专属工作流
  'researcher-workflow': {
    id: 'researcher-workflow',
    name: '研究员工作流',
    description: '市场调研、竞品分析、趋势研究',
    nodes: [
      {
        id: 'research_objective',
        type: WorkflowNodeType.START,
        agent: 'researcher',
        name: '研究目标',
        description: '明确研究目标',
        inputs: [],
        outputs: ['researchGoals'],
        estimatedTime: 2 * 60 * 1000,
        dependencies: [],
        autoExecute: false
      },
      {
        id: 'data_collection',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'researcher',
        name: '数据收集',
        description: '收集市场数据',
        inputs: ['researchGoals'],
        outputs: ['marketData'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['research_objective'],
        autoExecute: true
      },
      {
        id: 'competitor_analysis',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'researcher',
        name: '竞品分析',
        description: '竞品分析',
        inputs: ['marketData'],
        outputs: ['competitorReport'],
        estimatedTime: 8 * 60 * 1000,
        dependencies: ['data_collection'],
        autoExecute: true
      },
      {
        id: 'trend_research',
        type: WorkflowNodeType.ANALYSIS,
        agent: 'researcher',
        name: '趋势研究',
        description: '趋势研究',
        inputs: ['competitorReport'],
        outputs: ['trendAnalysis'],
        estimatedTime: 6 * 60 * 1000,
        dependencies: ['competitor_analysis'],
        autoExecute: true
      },
      {
        id: 'report_writing',
        type: WorkflowNodeType.DESIGN,
        agent: 'researcher',
        name: '报告撰写',
        description: '撰写研究报告',
        inputs: ['trendAnalysis'],
        outputs: ['researchReport'],
        estimatedTime: 10 * 60 * 1000,
        dependencies: ['trend_research'],
        autoExecute: true
      },
      {
        id: 'result_presentation',
        type: WorkflowNodeType.END,
        agent: 'researcher',
        name: '成果汇报',
        description: '成果汇报',
        inputs: ['researchReport'],
        outputs: ['finalReport'],
        estimatedTime: 3 * 60 * 1000,
        dependencies: ['report_writing'],
        autoExecute: true
      }
    ],
    startNodeId: 'research_objective',
    endNodeId: 'result_presentation'
  }
};

/**
 * 智能工作流引擎
 */
export class WorkflowEngine {
  private predictionService = getPredictionService();
  private ragService = getRAGService();
  private activeWorkflows: Map<string, WorkflowInstance> = new Map();

  /**
   * 创建工作流
   */
  createWorkflow(
    templateId: string,
    initialData: Record<string, any> = {}
  ): WorkflowInstance | null {
    const template = WORKFLOW_TEMPLATES[templateId];
    if (!template) {
      console.error(`[WorkflowEngine] Template not found: ${templateId}`);
      return null;
    }

    const instance: WorkflowInstance = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: templateId,
      status: 'pending',
      currentNodeId: template.startNodeId,
      completedNodes: [],
      data: initialData,
      startTime: Date.now(),
      progress: 0
    };

    this.activeWorkflows.set(instance.id, instance);
    console.log(`[WorkflowEngine] Created workflow: ${instance.id}`);

    return instance;
  }

  /**
   * 启动工作流
   */
  async startWorkflow(instanceId: string): Promise<boolean> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return false;

    instance.status = 'running';
    console.log(`[WorkflowEngine] Started workflow: ${instanceId}`);

    // 开始执行第一个节点
    await this.executeCurrentNode(instanceId);

    return true;
  }

  /**
   * 执行当前节点
   */
  async executeCurrentNode(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'running') return;

    const workflow = WORKFLOW_TEMPLATES[instance.workflowId];
    const currentNode = workflow.nodes.find(n => n.id === instance.currentNodeId);

    if (!currentNode) {
      console.error(`[WorkflowEngine] Node not found: ${instance.currentNodeId}`);
      return;
    }

    console.log(`[WorkflowEngine] Executing node: ${currentNode.name}`);

    // 记录行为
    this.predictionService.recordBehavior(BehaviorType.TASK_CREATE, {
      taskType: currentNode.type,
      agent: currentNode.agent
    });

    // 如果是自动执行节点，继续执行
    if (currentNode.autoExecute) {
      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, Math.min(currentNode.estimatedTime, 2000)));

      // 完成当前节点
      await this.completeNode(instanceId, currentNode.id, {
        result: `Auto-completed ${currentNode.name}`
      });
    }
  }

  /**
   * 完成节点
   */
  async completeNode(
    instanceId: string,
    nodeId: string,
    outputData: Record<string, any>
  ): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return;

    // 更新数据
    instance.data = { ...instance.data, ...outputData };
    instance.completedNodes.push(nodeId);

    // 更新进度
    const workflow = WORKFLOW_TEMPLATES[instance.workflowId];
    instance.progress = Math.floor(
      (instance.completedNodes.length / workflow.nodes.length) * 100
    );

    console.log(`[WorkflowEngine] Completed node: ${nodeId}, Progress: ${instance.progress}%`);

    // 找到下一个节点
    const nextNode = workflow.nodes.find(n =>
      n.dependencies.includes(nodeId) &&
      !instance.completedNodes.includes(n.id)
    );

    if (nextNode) {
      instance.currentNodeId = nextNode.id;

      // 检查是否是结束节点
      if (nextNode.type === WorkflowNodeType.END) {
        await this.completeWorkflow(instanceId);
      } else {
        // 继续执行下一个节点
        await this.executeCurrentNode(instanceId);
      }
    } else {
      // 没有下一个节点，完成工作流
      await this.completeWorkflow(instanceId);
    }
  }

  /**
   * 完成工作流
   */
  async completeWorkflow(instanceId: string): Promise<void> {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return;

    instance.status = 'completed';
    instance.endTime = Date.now();
    instance.progress = 100;

    console.log(`[WorkflowEngine] Completed workflow: ${instanceId}`);
  }

  /**
   * 暂停工作流
   */
  pauseWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'running') return false;

    instance.status = 'paused';
    console.log(`[WorkflowEngine] Paused workflow: ${instanceId}`);
    return true;
  }

  /**
   * 恢复工作流
   */
  resumeWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance || instance.status !== 'paused') return false;

    instance.status = 'running';
    console.log(`[WorkflowEngine] Resumed workflow: ${instanceId}`);
    this.executeCurrentNode(instanceId);
    return true;
  }

  /**
   * 取消工作流
   */
  cancelWorkflow(instanceId: string): boolean {
    const instance = this.activeWorkflows.get(instanceId);
    if (!instance) return false;

    instance.status = 'failed';
    instance.endTime = Date.now();
    console.log(`[WorkflowEngine] Cancelled workflow: ${instanceId}`);
    return true;
  }

  /**
   * 质量检查
   */
  async qualityCheck(content: string, type: 'design' | 'text' | 'video'): Promise<QualityCheckResult> {
    const issues: QualityCheckResult['issues'] = [];
    const improvements: string[] = [];
    let score = 100;

    // 基础检查
    if (content.length < 10) {
      issues.push({
        type: 'error',
        message: '内容过于简短',
        suggestion: '增加更多细节描述'
      });
      score -= 20;
    }

    // 设计相关检查
    if (type === 'design') {
      if (!content.includes('色彩') && !content.includes('颜色')) {
        issues.push({
          type: 'warning',
          message: '缺少色彩描述',
          suggestion: '添加色彩方案说明'
        });
        score -= 10;
      }

      if (!content.includes('风格')) {
        improvements.push('可以补充风格说明');
        score -= 5;
      }
    }

    // 文本相关检查
    if (type === 'text') {
      if (content.length > 500) {
        issues.push({
          type: 'info',
          message: '内容较长',
          suggestion: '考虑分段或精简'
        });
        score -= 5;
      }
    }

    return {
      passed: score >= 70,
      score: Math.max(0, score),
      issues,
      improvements
    };
  }

  /**
   * 自动优化
   */
  async autoOptimize(content: string, feedback: string): Promise<string> {
    // 基于反馈自动优化内容
    let optimized = content;

    if (feedback.includes('颜色') || feedback.includes('色彩')) {
      optimized += '\n\n【优化】增加了色彩方案说明';
    }

    if (feedback.includes('细节') || feedback.includes('详细')) {
      optimized += '\n\n【优化】补充了更多细节描述';
    }

    if (feedback.includes('风格')) {
      optimized += '\n\n【优化】强化了风格特征';
    }

    return optimized;
  }

  /**
   * 获取工作流实例
   */
  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.activeWorkflows.get(instanceId);
  }

  /**
   * 获取所有活跃工作流
   */
  getActiveWorkflows(): WorkflowInstance[] {
    return Array.from(this.activeWorkflows.values()).filter(
      w => w.status === 'running' || w.status === 'paused'
    );
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplates(): Workflow[] {
    return Object.values(WORKFLOW_TEMPLATES);
  }

  /**
   * 获取工作流统计
   */
  getStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
  } {
    const workflows = Array.from(this.activeWorkflows.values());
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'running').length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length,
      failedWorkflows: workflows.filter(w => w.status === 'failed').length
    };
  }
}

// 导出单例
let workflowEngineInstance: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngineInstance) {
    workflowEngineInstance = new WorkflowEngine();
  }
  return workflowEngineInstance;
}

export function resetWorkflowEngine(): void {
  workflowEngineInstance = null;
}
