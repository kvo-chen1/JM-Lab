// 地图工具常量

// 分类图标
export const CATEGORY_ICONS = {
  cultural: '🏛️',
  historical: '📜',
  scenic: '🌄',
  food: '🍜',
  shopping: '🛍️',
  entertainment: '🎭',
  accommodation: '🏨',
  transportation: '🚗'
};

// 分类颜色
export const CATEGORY_COLORS = {
  cultural: '#3B82F6', // 蓝色
  historical: '#8B5CF6', // 紫色
  scenic: '#10B981', // 绿色
  food: '#EF4444', // 红色
  shopping: '#F59E0B', // 橙色
  entertainment: '#EC4899', // 粉色
  accommodation: '#6366F1', // 靛蓝色
  transportation: '#14B8A6' // 青色
};

// 分类名称
export const CATEGORY_NAMES = {
  cultural: '文化场所',
  historical: '历史古迹',
  scenic: '风景名胜',
  food: '美食小吃',
  shopping: '购物场所',
  entertainment: '娱乐休闲',
  accommodation: '住宿酒店',
  transportation: '交通设施'
};

// 模拟坐标数据
export const MOCK_COORDINATES = {
  // 天津主要景点坐标
  tianjinEye: {
    lat: 39.0905,
    lng: 117.1999,
    name: '天津之眼',
    category: 'scenic'
  },
  ancientCultureStreet: {
    lat: 39.1338,
    lng: 117.1989,
    name: '古文化街',
    category: 'cultural'
  },
  forbiddenCity: {
    lat: 39.1381,
    lng: 117.2033,
    name: '天津文庙',
    category: 'historical'
  },
  waterPark: {
    lat: 39.0797,
    lng: 117.1987,
    name: '水上公园',
    category: 'scenic'
  },
  italianTown: {
    lat: 39.0879,
    lng: 117.2126,
    name: '意式风情区',
    category: 'cultural'
  },
  fiveAvenue: {
    lat: 39.0847,
    lng: 117.2188,
    name: '五大道',
    category: 'historical'
  },
  porcelainHouse: {
    lat: 39.0923,
    lng: 117.2108,
    name: '瓷房子',
    category: 'cultural'
  },
  drumTower: {
    lat: 39.1352,
    lng: 117.1967,
    name: '鼓楼',
    category: 'historical'
  },
  yangliuqing: {
    lat: 39.0464,
    lng: 117.0947,
    name: '杨柳青古镇',
    category: 'historical'
  },
  binhaiNewArea: {
    lat: 39.0189,
    lng: 117.7241,
    name: '滨海新区',
    category: 'scenic'
  }
};

// 生成随机坐标（在天津范围内）
export function generateRandomCoordinates(count: number) {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  const baseLat = 39.1;
  const baseLng = 117.2;
  const range = 0.1;

  for (let i = 0; i < count; i++) {
    const lat = baseLat + (Math.random() - 0.5) * range;
    const lng = baseLng + (Math.random() - 0.5) * range;
    coordinates.push({ lat, lng });
  }

  return coordinates;
}

// 计算两点之间的距离（使用Haversine公式）
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// 获取分类信息
export function getCategoryInfo(category: string) {
  return {
    icon: CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📍',
    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280',
    name: CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || '其他'
  };
}

// 过滤POI按分类
export function filterPOIsByCategory(pois: any[], category: string | null) {
  if (!category) return pois;
  return pois.filter(poi => poi.category === category);
}

// 排序POI按距离
export function sortPOIsByDistance(pois: any[], userLat: number, userLng: number) {
  return [...pois].sort((a, b) => {
    const distanceA = calculateDistance(userLat, userLng, a.lat, a.lng);
    const distanceB = calculateDistance(userLat, userLng, b.lat, b.lng);
    return distanceA - distanceB;
  });
}
