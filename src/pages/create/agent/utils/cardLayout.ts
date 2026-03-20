// 卡片布局工具函数

import { CardPosition, GeneratedOutput } from '../types/agent';

// 默认卡片尺寸
export const DEFAULT_CARD_WIDTH = 380;
export const DEFAULT_CARD_HEIGHT = 520;
export const CARD_GAP = 32;

/**
 * 计算网格布局的默认位置
 * @param index 卡片索引
 * @param containerWidth 容器宽度
 * @param cols 列数（可选，默认自动计算）
 * @returns 卡片位置
 */
export function calculateGridPosition(
  index: number,
  containerWidth: number = 1200,
  cols?: number
): CardPosition {
  // 自动计算列数
  const calculatedCols = cols || Math.max(1, Math.floor((containerWidth + CARD_GAP) / (DEFAULT_CARD_WIDTH + CARD_GAP)));

  const col = index % calculatedCols;
  const row = Math.floor(index / calculatedCols);

  // 计算起始X位置，使卡片居中
  const totalWidth = calculatedCols * DEFAULT_CARD_WIDTH + (calculatedCols - 1) * CARD_GAP;
  const startX = Math.max(0, (containerWidth - totalWidth) / 2);

  return {
    x: startX + col * (DEFAULT_CARD_WIDTH + CARD_GAP),
    y: row * (DEFAULT_CARD_HEIGHT + CARD_GAP) + 40 // 顶部留一些边距
  };
}

/**
 * 计算瀑布流布局的默认位置
 * @param index 卡片索引
 * @param containerWidth 容器宽度
 * @param existingCards 已存在的卡片（用于计算列高度）
 * @returns 卡片位置
 */
export function calculateMasonryPosition(
  index: number,
  containerWidth: number = 1200,
  existingCards: GeneratedOutput[] = []
): CardPosition {
  const cols = Math.max(1, Math.floor((containerWidth + CARD_GAP) / (DEFAULT_CARD_WIDTH + CARD_GAP)));

  // 计算每列的当前高度
  const columnHeights: number[] = new Array(cols).fill(40); // 初始顶部边距

  existingCards.forEach((card, i) => {
    if (i >= index) return;
    const col = i % cols;
    const cardHeight = card.metadata?.height || DEFAULT_CARD_HEIGHT;
    columnHeights[col] += cardHeight + CARD_GAP;
  });

  // 找到最短的列
  const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));

  // 计算起始X位置
  const totalWidth = cols * DEFAULT_CARD_WIDTH + (cols - 1) * CARD_GAP;
  const startX = Math.max(0, (containerWidth - totalWidth) / 2);

  return {
    x: startX + shortestCol * (DEFAULT_CARD_WIDTH + CARD_GAP),
    y: columnHeights[shortestCol]
  };
}

/**
 * 为所有没有位置的卡片计算默认位置
 * @param outputs 所有作品输出
 * @param containerWidth 容器宽度
 * @returns 更新后的outputs
 */
export function assignDefaultPositions(
  outputs: GeneratedOutput[],
  containerWidth: number = 1200
): GeneratedOutput[] {
  let positionIndex = 0;

  return outputs.map((output) => {
    if (output.position) {
      return output;
    }

    const position = calculateGridPosition(positionIndex, containerWidth);
    positionIndex++;

    return {
      ...output,
      position
    };
  });
}

/**
 * 检测两个矩形是否碰撞
 * @param rect1 矩形1
 * @param rect2 矩形2
 * @returns 是否碰撞
 */
export function detectCollision(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * 为卡片找到不重叠的位置
 * @param position 期望位置
 * @param cardId 当前卡片ID
 * @param existingCards 已存在的卡片
 * @returns 调整后的位置
 */
export function findNonOverlappingPosition(
  position: CardPosition,
  cardId: string,
  existingCards: GeneratedOutput[]
): CardPosition {
  const cardRect = {
    x: position.x,
    y: position.y,
    width: DEFAULT_CARD_WIDTH,
    height: DEFAULT_CARD_HEIGHT
  };

  // 检查是否与现有卡片碰撞
  const hasCollision = existingCards.some(
    card => card.id !== cardId &&
    card.position &&
    detectCollision(cardRect, {
      x: card.position.x,
      y: card.position.y,
      width: DEFAULT_CARD_WIDTH,
      height: DEFAULT_CARD_HEIGHT
    })
  );

  if (!hasCollision) {
    return position;
  }

  // 简单策略：向右下方偏移直到不碰撞
  let newPosition = { ...position };
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    newPosition.x += 20;
    newPosition.y += 20;

    const newRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: DEFAULT_CARD_WIDTH,
      height: DEFAULT_CARD_HEIGHT
    };

    const stillColliding = existingCards.some(
      card => card.id !== cardId &&
      card.position &&
      detectCollision(newRect, {
        x: card.position.x,
        y: card.position.y,
        width: DEFAULT_CARD_WIDTH,
        height: DEFAULT_CARD_HEIGHT
      })
    );

    if (!stillColliding) {
      return newPosition;
    }

    attempts++;
  }

  // 如果找不到不碰撞的位置，返回原位置
  return position;
}

/**
 * 计算所有卡片的边界框
 * @param outputs 所有作品输出
 * @returns 边界框
 */
export function calculateBoundingBox(
  outputs: GeneratedOutput[]
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const cardsWithPosition = outputs.filter(o => o.position);

  if (cardsWithPosition.length === 0) {
    return null;
  }

  const positions = cardsWithPosition.map(o => o.position!);

  return {
    minX: Math.min(...positions.map(p => p.x)),
    minY: Math.min(...positions.map(p => p.y)),
    maxX: Math.max(...positions.map(p => p.x + DEFAULT_CARD_WIDTH)),
    maxY: Math.max(...positions.map(p => p.y + DEFAULT_CARD_HEIGHT))
  };
}

/**
 * 将所有卡片居中显示
 * @param outputs 所有作品输出
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @returns 调整后的outputs
 */
export function centerAllCards(
  outputs: GeneratedOutput[],
  containerWidth: number,
  containerHeight: number
): GeneratedOutput[] {
  const boundingBox = calculateBoundingBox(outputs);

  if (!boundingBox) {
    return outputs;
  }

  const contentWidth = boundingBox.maxX - boundingBox.minX;
  const contentHeight = boundingBox.maxY - boundingBox.minY;

  const offsetX = (containerWidth - contentWidth) / 2 - boundingBox.minX;
  const offsetY = (containerHeight - contentHeight) / 2 - boundingBox.minY;

  return outputs.map(output => {
    if (!output.position) {
      return output;
    }

    return {
      ...output,
      position: {
        x: output.position.x + offsetX,
        y: output.position.y + offsetY
      }
    };
  });
}
