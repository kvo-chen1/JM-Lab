import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import VirtualMap from '@/components/VirtualMap/VirtualMap';
import { 
  CATEGORY_ICONS, 
  CATEGORY_COLORS, 
  CATEGORY_NAMES,
  MOCK_COORDINATES 
} from '@/utils/mapUtils';

// 导入虚拟地图类型
import { Region, POI as VirtualPOI, Path } from '@/components/VirtualMap/types';

// 导入POI图片生成工具
import { generatePOIImages } from '@/utils/generatePOIImage';

// 定义POI类型
interface POI {
  id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  position: { x: number; y: number; lat?: number; lng?: number };
  year: number;
  images: string[];
  openingHours?: string;
  phone?: string;
  importance?: number;
  tags?: string[];
  relatedPois?: number[];
  featuredProducts?: string[];
  honors?: string[];
  historicalSignificance?: string;
  culturalHeritageLevel?: string;
}

interface Category {
  name: string;
  icon: string;
  color: string;
}

interface POIData {
  version: string;
  lastUpdated: string;
  categories: Record<string, Category>;
  poi: POI[];
}

// 本地定义POI数据，包含真实经纬度
const localPOIData: POIData = {
  "version": "1.0.0",
  "lastUpdated": "2025-12-23",
  "categories": {
    "food": {
      "name": "餐饮美食",
      "icon": "🍜",
      "color": "bg-yellow-500"
    },
    "retail": {
      "name": "零售百货",
      "icon": "🏪",
      "color": "bg-blue-500"
    },
    "craft": {
      "name": "手工艺",
      "icon": "🎨",
      "color": "bg-purple-500"
    },
    "landmark": {
      "name": "地标建筑",
      "icon": "🏰",
      "color": "bg-red-500"
    },
    "culture": {
      "name": "文化艺术",
      "icon": "📚",
      "color": "bg-green-500"
    }
  },
  "poi": [
    {
      "id": 1,
      "name": "狗不理包子",
      "category": "food",
      "description": "天津著名的传统小吃，以皮薄馅大、鲜香可口著称，有着悠久的历史和文化底蕴。狗不理包子的制作技艺被列入国家级非物质文化遗产名录。",
      "address": "天津市和平区山东路77号",
      "position": { 
        "x": 44, 
        "y": 55, 
        "lng": MOCK_COORDINATES[1][0], 
        "lat": MOCK_COORDINATES[1][1] 
      },
      "year": 1858,
      "images": [
        // 重新设计的SVG占位图，具有视觉吸引力和统一风格
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E狗不理包子%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E天津三绝之一%3C/text%3E%3Ccircle cx='200' cy='400' r='40' fill='%23FF6B35'/%3E%3Ccircle cx='400' cy='400' r='40' fill='%23FF6B35'/%3E%3Ccircle cx='600' cy='400' r='40' fill='%23FF6B35'/%3E%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E狗不理包子%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E传统小吃%3C/text%3E%3Cpath d='M200,400 L250,350 L300,400 L350,350 L400,400 L450,350 L500,400 L550,350 L600,400' stroke='%23FF6B35' stroke-width='8' fill='none'/%3E%3Ctext%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E狗不理包子%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E百年老店%3C/text%3E%3Crect x='250' y='380' width='300' height='60' rx='30' fill='%23FF6B35'/%3E%3Ctext x='400' y='420' font-family='Arial' font-size='28' font-weight='bold' fill='white' text-anchor='middle' dy='0.3em'%3E1858年创立%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "08:00-22:00",
      "phone": "022-27306590",
      "importance": 5,
      "tags": ["天津三绝", "传统小吃", "百年老店"],
      "featuredProducts": ["猪肉包子", "三鲜包子", "蟹黄包子", "野菜包子"],
      "honors": ["国家级非物质文化遗产", "中华老字号", "天津名小吃"],
      "historicalSignificance": "狗不理包子始创于1858年，由高贵友创立，是天津传统饮食文化的重要代表，见证了天津近代商业的发展历程。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [2, 3]
    },
    {
      "id": 2,
      "name": "十八街麻花",
      "category": "food",
      "description": "天津传统名点，以酥脆香甜、久放不绵而闻名，是天津三绝之一。",
      "address": "天津市河西区大沽南路566号",
      "position": { 
        "x": 50, 
        "y": 60, 
        "lng": MOCK_COORDINATES[2][0], 
        "lat": MOCK_COORDINATES[2][1] 
      },
      "year": 1912,
      "images": [
        // 重新设计的SVG占位图，具有视觉吸引力和统一风格
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E十八街麻花%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E天津三绝之一%3C/text%3E%3Cpath d='M200,400 Q300,350 400,400 T600,400' stroke='%23FF6B35' stroke-width='12' fill='none'/%3E%3Cpath d='M200,400 Q300,450 400,400 T600,400' stroke='%23FF6B35' stroke-width='12' fill='none'/%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E十八街麻花%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E传统名点%3C/text%3E%3Crect x='200' y='380' width='400' height='60' rx='30' fill='%23FF6B35'/%3E%3Ctext x='400' y='420' font-family='Arial' font-size='28' font-weight='bold' fill='white' text-anchor='middle' dy='0.3em'%3E酥脆香甜，久放不绵%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-21:00",
      "phone": "022-28326900",
      "importance": 4,
      "tags": ["天津三绝", "传统名点", "百年老店"],
      "relatedPois": [1, 3]
    },
    {
      "id": 3,
      "name": "耳朵眼炸糕",
      "category": "food",
      "description": "天津传统风味小吃，以皮酥脆、馅香甜、不腻口而著称，是天津三绝之一。",
      "address": "天津市红桥区北门外大街12号",
      "position": { 
        "x": 48, 
        "y": 52, 
        "lng": MOCK_COORDINATES[3][0], 
        "lat": MOCK_COORDINATES[3][1] 
      },
      "year": 1900,
      "images": [
        // 重新设计的SVG占位图，具有视觉吸引力和统一风格
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E耳朵眼炸糕%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E天津三绝之一%3C/text%3E%3Cellipse cx='300' cy='400' rx='60' ry='40' fill='%23FF6B35'/%3E%3Cellipse cx='500' cy='400' rx='60' ry='40' fill='%23FF6B35'/%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E耳朵眼炸糕%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E传统小吃%3C/text%3E%3Ccircle cx='400' cy='400' r='60' fill='%23FF6B35'/%3E%3Ctext x='400' y='410' font-family='Arial' font-size='32' font-weight='bold' fill='white' text-anchor='middle' dy='0.3em'%3E香%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "08:30-20:30",
      "phone": "022-27275033",
      "importance": 4,
      "tags": ["天津三绝", "传统小吃", "百年老店"],
      "relatedPois": [1, 2]
    },
    {
      "id": 4,
      "name": "劝业场",
      "category": "retail",
      "description": "天津著名的百年老商场，是天津商业的标志性建筑，融合了多种建筑风格。",
      "address": "天津市和平区和平路290号",
      "position": { 
        "x": 47, 
        "y": 55, 
        "lng": MOCK_COORDINATES[4][0], 
        "lat": MOCK_COORDINATES[4][1] 
      },
      "year": 1928,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E劝业场%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E百年老店%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E劝业场%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E商业地标%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "10:00-22:00",
      "phone": "022-27211818",
      "importance": 5,
      "tags": ["百年老店", "商业地标", "历史建筑"],
      "relatedPois": [7]
    },
    {
      "id": 5,
      "name": "杨柳青年画",
      "category": "craft",
      "description": "中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称，具有浓郁的民间艺术特色。",
      "address": "天津市西青区杨柳青镇估衣街23号",
      "position": { 
        "x": 42, 
        "y": 48, 
        "lng": MOCK_COORDINATES[5][0], 
        "lat": MOCK_COORDINATES[5][1] 
      },
      "year": 1600,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E杨柳青年画%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E民间艺术%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E杨柳青年画%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E国家级非遗%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-17:00",
      "phone": "022-27940617",
      "importance": 5,
      "tags": ["民间艺术", "国家级非遗", "传统工艺"],
      "relatedPois": [6]
    },
    {
      "id": 6,
      "name": "泥人张彩塑",
      "category": "craft",
      "description": "天津传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名，是中国泥塑艺术的代表。",
      "address": "天津市南开区古文化街宫北大街通庆里4号",
      "position": { 
        "x": 45, 
        "y": 53, 
        "lng": MOCK_COORDINATES[6][0], 
        "lat": MOCK_COORDINATES[6][1] 
      },
      "year": 1844,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E泥人张彩塑%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E民间艺术%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E泥人张彩塑%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E传统工艺%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-18:00",
      "phone": "022-27353157",
      "importance": 5,
      "tags": ["民间艺术", "国家级非遗", "传统工艺"],
      "relatedPois": [5]
    },
    {
      "id": 7,
      "name": "天津之眼",
      "category": "landmark",
      "description": "世界上唯一建在桥上的摩天轮，是天津的标志性建筑之一，俯瞰天津市区全景。",
      "address": "天津市红桥区李公祠大街与五马路交口",
      "position": { 
        "x": 44, 
        "y": 50, 
        "lng": MOCK_COORDINATES[7][0], 
        "lat": MOCK_COORDINATES[7][1] 
      },
      "year": 2008,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津之眼%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E现代地标%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津之眼%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E旅游景点%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:30-21:30",
      "phone": "022-26288830",
      "importance": 5,
      "tags": ["现代地标", "旅游景点", "城市名片"],
      "relatedPois": [4]
    },
    {
      "id": 8,
      "name": "天津大剧院",
      "category": "culture",
      "description": "现代化的大型综合剧场，是天津文化艺术的重要阵地，举办各类高水平演出。",
      "address": "天津市河西区平江道58号",
      "position": { 
        "x": 49, 
        "y": 58, 
        "lng": MOCK_COORDINATES[8][0], 
        "lat": MOCK_COORDINATES[8][1] 
      },
      "year": 2012,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津大剧院%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E文化设施%3C/text%3E%3C/svg%3E`,
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津大剧院%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E艺术殿堂%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "根据演出时间而定",
      "phone": "022-83882000",
      "importance": 4,
      "tags": ["现代建筑", "文化设施", "艺术殿堂"],
      "featuredProducts": ["歌剧演出", "音乐会", "话剧", "舞蹈表演"],
      "honors": ["国家大剧院联盟成员", "天津市文化地标"],
      "culturalHeritageLevel": "市级",
      "relatedPois": [7]
    },
    {
      "id": 9,
      "name": "老美华",
      "category": "retail",
      "description": "天津著名的鞋店，以制作传统布鞋而闻名，有着百年历史，是天津传统商业的代表。",
      "address": "天津市和平区和平路290号劝业场底商",
      "position": { 
        "x": 46, 
        "y": 55, 
        "lng": MOCK_COORDINATES[1][0] + 0.01, 
        "lat": MOCK_COORDINATES[1][1] + 0.01 
      },
      "year": 1911,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E老美华%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E百年鞋店%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:30-21:00",
      "phone": "022-27211587",
      "importance": 5,
      "tags": ["百年老店", "传统布鞋", "中华老字号"],
      "featuredProducts": ["传统布鞋", "手工皮鞋", "中老年鞋", "礼品鞋"],
      "honors": ["中华老字号", "国家级非物质文化遗产", "天津名牌产品"],
      "historicalSignificance": "老美华始创于1911年，由庞鹤年创立，是天津传统商业的代表，见证了天津近代商业的发展历程。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [4]
    },
    {
      "id": 10,
      "name": "果仁张",
      "category": "food",
      "description": "天津著名的传统小吃，以制作各种风味果仁而闻名，有着悠久的历史和独特的制作工艺。",
      "address": "天津市南开区古文化街宫北大街10号",
      "position": { 
        "x": 45, 
        "y": 52, 
        "lng": MOCK_COORDINATES[3][0] + 0.01, 
        "lat": MOCK_COORDINATES[3][1] + 0.01 
      },
      "year": 1830,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E果仁张%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E传统小吃%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-19:00",
      "phone": "022-27355368",
      "importance": 4,
      "tags": ["天津名小吃", "传统食品", "百年老店"],
      "featuredProducts": ["五香果仁", "琥珀桃仁", "麻辣花生", "怪味豆"],
      "honors": ["中华老字号", "天津名小吃", "国家级非物质文化遗产"],
      "historicalSignificance": "果仁张始创于1830年，由张惠山创立，是天津传统小吃的代表，制作技艺独特，风味各异。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [5, 6]
    },
    {
      "id": 11,
      "name": "天津古文化街",
      "category": "landmark",
      "description": "天津著名的文化旅游景点，集传统商业、文化展示、旅游观光于一体，是天津传统文化的重要载体。",
      "address": "天津市南开区东门外大街宫北大街",
      "position": { 
        "x": 45, 
        "y": 53, 
        "lng": MOCK_COORDINATES[3][0], 
        "lat": MOCK_COORDINATES[3][1] 
      },
      "year": 1985,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津古文化街%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E文化旅游景点%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-21:00",
      "phone": "022-27356433",
      "importance": 5,
      "tags": ["文化旅游", "传统商业", "天津地标"],
      "featuredProducts": ["杨柳青年画", "泥人张彩塑", "风筝魏风筝", "天津特产"],
      "honors": ["国家5A级旅游景区", "中国历史文化名街", "天津市文化地标"],
      "historicalSignificance": "天津古文化街是天津传统文化的重要载体，集中展示了天津的历史文化、传统工艺和民俗风情。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [5, 6]
    },
    {
      "id": 12,
      "name": "风筝魏",
      "category": "craft",
      "description": "天津著名的风筝制作技艺，以制作精美、造型独特的风筝而闻名，是中国传统手工艺的代表。",
      "address": "天津市南开区古文化街宫南大街12号",
      "position": { 
        "x": 45, 
        "y": 54, 
        "lng": MOCK_COORDINATES[3][0] - 0.01, 
        "lat": MOCK_COORDINATES[3][1] - 0.01 
      },
      "year": 1892,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E风筝魏%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E传统手工艺%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-18:00",
      "phone": "022-27356878",
      "importance": 4,
      "tags": ["传统手工艺", "国家级非遗", "天津名产"],
      "featuredProducts": ["沙燕风筝", "巨龙风筝", "蝴蝶风筝", "人物风筝"],
      "honors": ["国家级非物质文化遗产", "中华老字号", "中国传统工艺珍品"],
      "historicalSignificance": "风筝魏始创于1892年，由魏元泰创立，其制作的风筝以造型精美、工艺精湛、放飞稳定而闻名中外。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [5, 6, 11]
    },
    {
      "id": 13,
      "name": "天津博物馆",
      "category": "culture",
      "description": "天津最大的综合性博物馆，收藏了大量天津历史文化遗产，是了解天津历史文化的重要场所。",
      "address": "天津市河西区平江道62号",
      "position": { 
        "x": 48, 
        "y": 59, 
        "lng": MOCK_COORDINATES[8][0] + 0.01, 
        "lat": MOCK_COORDINATES[8][1] + 0.01 
      },
      "year": 1918,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津博物馆%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E综合性博物馆%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-16:30（周一闭馆）",
      "phone": "022-83883000",
      "importance": 5,
      "tags": ["文化设施", "历史文物", "天津地标"],
      "featuredProducts": ["文物展览", "历史陈列", "临时特展", "文创产品"],
      "honors": ["国家一级博物馆", "天津市爱国主义教育基地"],
      "historicalSignificance": "天津博物馆是天津历史文化的重要载体，收藏了大量珍贵文物，展示了天津从古代到现代的历史发展脉络。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [8]
    },
    // 新增品牌点位数据
    {
      "id": 14,
      "name": "天津大悦城",
      "category": "retail",
      "description": "天津现代化的大型购物中心，集购物、餐饮、娱乐于一体，是天津商业的新地标。",
      "address": "天津市南开区南门外大街2号",
      "position": { 
        "x": 46, 
        "y": 54, 
        "lng": MOCK_COORDINATES[6][0] + 0.02, 
        "lat": MOCK_COORDINATES[6][1] + 0.02 
      },
      "year": 2011,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津大悦城%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E现代购物中心%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "10:00-22:00",
      "phone": "022-58100666",
      "importance": 4,
      "tags": ["现代商业", "购物中心", "城市地标"],
      "featuredProducts": ["时尚服饰", "餐饮美食", "影院娱乐", "儿童乐园"],
      "honors": ["天津市商业示范基地", "中国购物中心百强"],
      "historicalSignificance": "天津大悦城开业于2011年，是天津现代化商业的代表，成为年轻人购物娱乐的首选场所。",
      "culturalHeritageLevel": "无",
      "relatedPois": [4, 9, 11]
    },
    {
      "id": 15,
      "name": "海河夜游",
      "category": "culture",
      "description": "天津著名的旅游项目，乘坐游船欣赏海河两岸的夜景，感受天津的城市魅力。",
      "address": "天津市河北区海河东路大悲院码头",
      "position": { 
        "x": 43, 
        "y": 49, 
        "lng": MOCK_COORDINATES[7][0] - 0.01, 
        "lat": MOCK_COORDINATES[7][1] - 0.01 
      },
      "year": 2000,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E海河夜游%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E旅游项目%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "18:00-22:00（夏季）",
      "phone": "022-23246688",
      "importance": 4,
      "tags": ["旅游项目", "城市夜景", "海河文化"],
      "featuredProducts": ["游船门票", "讲解服务", "特色航线", "夜间表演"],
      "honors": ["国家4A级旅游景区", "天津市旅游名片"],
      "historicalSignificance": "海河夜游是天津著名的旅游项目，通过游船欣赏海河两岸的夜景，感受天津的城市魅力和历史文化。",
      "culturalHeritageLevel": "无",
      "relatedPois": [7, 17]
    },
    {
      "id": 16,
      "name": "天津图书馆",
      "category": "culture",
      "description": "天津最大的公共图书馆，收藏了大量图书和文献资料，是天津文化事业的重要组成部分。",
      "address": "天津市河西区平江道58号",
      "position": { 
        "x": 48, 
        "y": 57, 
        "lng": MOCK_COORDINATES[8][0] - 0.01, 
        "lat": MOCK_COORDINATES[8][1] - 0.01 
      },
      "year": 2012,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津图书馆%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E公共图书馆%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-20:30（周一闭馆）",
      "phone": "022-83883600",
      "importance": 4,
      "tags": ["文化设施", "公共服务", "知识殿堂"],
      "featuredProducts": ["图书借阅", "电子资源", "讲座活动", "阅读空间"],
      "honors": ["国家一级图书馆", "天津市文化地标"],
      "historicalSignificance": "天津图书馆是天津文化事业的重要组成部分，为市民提供了丰富的图书资源和文化服务。",
      "culturalHeritageLevel": "市级",
      "relatedPois": [8, 13]
    },
    {
      "id": 17,
      "name": "天津站",
      "category": "landmark",
      "description": "天津最大的铁路客运站，是天津交通的重要枢纽，也是天津的标志性建筑之一。",
      "address": "天津市河北区新纬路1号",
      "position": { 
        "x": 45, 
        "y": 48, 
        "lng": MOCK_COORDINATES[7][0] + 0.03, 
        "lat": MOCK_COORDINATES[7][1] + 0.03 
      },
      "year": 1888,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津站%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E交通枢纽%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "全天开放",
      "phone": "022-60536053",
      "importance": 5,
      "tags": ["交通枢纽", "历史建筑", "天津地标"],
      "featuredProducts": ["铁路客运", "地铁换乘", "商业服务", "旅游咨询"],
      "honors": ["天津市文物保护单位", "中国最美火车站"],
      "historicalSignificance": "天津站始建于1888年，是中国最早的火车站之一，经过多次扩建和改造，成为天津交通的重要枢纽和标志性建筑。",
      "culturalHeritageLevel": "市级",
      "relatedPois": [15, 18]
    },
    {
      "id": 18,
      "name": "意大利风情区",
      "category": "landmark",
      "description": "天津著名的历史文化街区，保存了大量意大利风格的建筑，是天津历史文化的重要组成部分。",
      "address": "天津市河北区自由道24号",
      "position": { 
        "x": 46, 
        "y": 47, 
        "lng": MOCK_COORDINATES[7][0] + 0.04, 
        "lat": MOCK_COORDINATES[7][1] + 0.04 
      },
      "year": 1902,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E意大利风情区%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E历史文化街区%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "全天开放",
      "phone": "022-24455000",
      "importance": 4,
      "tags": ["历史建筑", "文化旅游", "异域风情"],
      "featuredProducts": ["建筑观光", "餐饮娱乐", "文化展览", "婚纱摄影"],
      "honors": ["天津市历史文化街区", "国家4A级旅游景区"],
      "historicalSignificance": "意大利风情区始建于1902年，是天津九国租界之一，保存了大量意大利风格的建筑，是天津历史文化的重要组成部分。",
      "culturalHeritageLevel": "市级",
      "relatedPois": [17, 19]
    },
    {
      "id": 19,
      "name": "瓷房子",
      "category": "landmark",
      "description": "天津独特的瓷文化艺术建筑，用大量瓷器装饰而成，是天津的网红打卡地。",
      "address": "天津市和平区赤峰道72号",
      "position": { 
        "x": 47, 
        "y": 53, 
        "lng": MOCK_COORDINATES[1][0] + 0.03, 
        "lat": MOCK_COORDINATES[1][1] + 0.03 
      },
      "year": 2007,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E瓷房子%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E艺术建筑%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-18:00",
      "phone": "022-27123366",
      "importance": 4,
      "tags": ["艺术建筑", "网红景点", "文化创意"],
      "featuredProducts": ["门票参观", "纪念品销售", "文化讲座", "艺术展览"],
      "honors": ["天津市文化创意产业示范基地", "中国最美建筑"],
      "historicalSignificance": "瓷房子始建于2007年，由张连志先生创建，用大量瓷器装饰而成，成为天津独特的文化艺术建筑和网红打卡地。",
      "culturalHeritageLevel": "无",
      "relatedPois": [18, 1, 4]
    },
    {
      "id": 20,
      "name": "天津奥林匹克中心",
      "category": "landmark",
      "description": "天津现代化的体育场馆，举办过多种国际和国内体育赛事，是天津体育事业的重要组成部分。",
      "address": "天津市南开区宾水西道393号",
      "position": { 
        "x": 49, 
        "y": 55, 
        "lng": MOCK_COORDINATES[8][0] + 0.03, 
        "lat": MOCK_COORDINATES[8][1] + 0.03 
      },
      "year": 2008,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E天津奥林匹克中心%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E体育场馆%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "根据赛事安排",
      "phone": "022-23912111",
      "importance": 4,
      "tags": ["体育场馆", "现代建筑", "赛事举办"],
      "featuredProducts": ["体育赛事", "演唱会", "健身服务", "参观游览"],
      "honors": ["国家AAAA级旅游景区", "天津市体育地标"],
      "historicalSignificance": "天津奥林匹克中心始建于2008年，为北京奥运会足球预选赛而建，成为天津体育事业的重要组成部分和现代化体育场馆。",
      "culturalHeritageLevel": "无",
      "relatedPois": [8, 13]
    },
    {
      "id": 21,
      "name": "海鸥表",
      "category": "retail",
      "description": "天津制造的经典机械表品牌，以机芯工艺著称，是中国第一只国产手表的诞生地。",
      "address": "天津市和平区常德道20号",
      "position": { 
        "x": 46, 
        "y": 56, 
        "lng": MOCK_COORDINATES[1][0] + 0.02, 
        "lat": MOCK_COORDINATES[1][1] - 0.01 
      },
      "year": 1955,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E海鸥表%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E中华老字号%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "10:00-21:00",
      "phone": "022-23125391",
      "importance": 5,
      "tags": ["中华老字号", "机械表", "工业制造"],
      "featuredProducts": ["机械手表", "陀飞轮表", "复刻系列"],
      "honors": ["中华老字号", "中国名牌产品"],
      "historicalSignificance": "1955年，中国第一只手表在天津诞生，海鸥表见证了中国钟表工业从无到有的发展历程。",
      "culturalHeritageLevel": "国家级",
      "relatedPois": [4, 9]
    },
    {
      "id": 22,
      "name": "谦祥益",
      "category": "retail",
      "description": "天津著名的老字号绸布店，现已转型为相声茶馆，是体验天津相声文化的重要场所。",
      "address": "天津市红桥区陆家嘴中心",
      "position": { 
        "x": 44, 
        "y": 51, 
        "lng": MOCK_COORDINATES[3][0] - 0.02, 
        "lat": MOCK_COORDINATES[3][1] + 0.01 
      },
      "year": 1906,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E谦祥益%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E老字号绸布店%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "10:00-22:00",
      "phone": "022-27053206",
      "importance": 4,
      "tags": ["中华老字号", "相声茶馆", "传统绸布"],
      "featuredProducts": ["相声演出", "传统绸缎", "中式服装"],
      "honors": ["中华老字号", "国家级非物质文化遗产"],
      "historicalSignificance": "谦祥益始建于1906年，原为绸布店，后转型为相声茶馆，被誉为“津门相声第一家”。",
      "culturalHeritageLevel": "市级",
      "relatedPois": [11, 12]
    },
    {
      "id": 23,
      "name": "隆顺榆酱园",
      "category": "food",
      "description": "天津著名的酱园老字号，以酱香浓郁、风味地道而闻名，传承了传统的酿造工艺。",
      "address": "天津市南开区古文化街",
      "position": { 
        "x": 45, 
        "y": 52.5, 
        "lng": MOCK_COORDINATES[3][0] + 0.005, 
        "lat": MOCK_COORDINATES[3][1] - 0.005 
      },
      "year": 1833,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E隆顺榆酱园%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E传统酱园%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "09:00-18:00",
      "phone": "暂无",
      "importance": 3,
      "tags": ["传统酱菜", "酿造工艺", "老字号"],
      "featuredProducts": ["甜面酱", "酱菜", "调味品"],
      "honors": ["天津老字号"],
      "historicalSignificance": "隆顺榆酱园保留了天津传统的酱菜制作工艺，是天津饮食文化的重要组成部分。",
      "culturalHeritageLevel": "区级",
      "relatedPois": [10, 11]
    },
    {
      "id": 24,
      "name": "鸿顺德",
      "category": "food",
      "description": "天津著名的清真酱货老字号，以制作精细、口味独特而著称。",
      "address": "天津市红桥区大胡同",
      "position": { 
        "x": 43, 
        "y": 50, 
        "lng": MOCK_COORDINATES[7][0] - 0.02, 
        "lat": MOCK_COORDINATES[7][1] + 0.01 
      },
      "year": 1920,
      "images": [
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f5f5f5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' fill='%23333' text-anchor='middle' dy='0.3em'%3E鸿顺德%3C/text%3E%3Ctext x='400' y='340' font-family='Arial' font-size='16' fill='%23666' text-anchor='middle' dy='0.3em'%3E清真老字号%3C/text%3E%3C/svg%3E`
      ],
      "openingHours": "08:00-19:00",
      "phone": "暂无",
      "importance": 3,
      "tags": ["清真食品", "酱货", "老字号"],
      "featuredProducts": ["酱牛肉", "酱羊肉", "熏鸡"],
      "honors": ["天津老字号"],
      "historicalSignificance": "鸿顺德是天津清真饮食文化的代表之一，其独特的制作技艺深受市民喜爱。",
      "culturalHeritageLevel": "区级",
      "relatedPois": [3, 7]
    }
  ]
};

// 获取分类数据
const categories = localPOIData.categories;

// 处理POI数据，替换图片资源
const processedMapData = localPOIData.poi.map(poi => {
  // 根据POI的名称和分类生成合适的副标题
  let subtitle = '';
  switch (poi.category) {
    case 'food':
      subtitle = '餐饮美食';
      break;
    case 'retail':
      subtitle = '零售百货';
      break;
    case 'craft':
      subtitle = '手工艺';
      break;
    case 'landmark':
      subtitle = '地标建筑';
      break;
    case 'culture':
      subtitle = '文化艺术';
      break;
    default:
      subtitle = '其他';
  }
  
  // 使用generatePOIImages函数生成新的图片资源
  return {
    ...poi,
    images: [
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E${poi.name}%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E${subtitle}%3C/text%3E%3Ccircle cx='200' cy='400' r='40' fill='%23FF6B35'/%3E%3Ccircle cx='400' cy='400' r='40' fill='%23FF6B35'/%3E%3Ccircle cx='600' cy='400' r='40' fill='%23FF6B35'/%3E%3C/svg%3E`,
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E${poi.name}%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E${subtitle}%3C/text%3E%3Cpath d='M200,400 Q300,350 400,400 T600,400' stroke='%23FF6B35' stroke-width='12' fill='none'/%3E%3Cpath d='M200,400 Q300,450 400,400 T600,400' stroke='%23FF6B35' stroke-width='12' fill='none'/%3E%3C/svg%3E`,
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='bgGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23FFA500;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23bgGradient)'/%3E%3Crect x='100' y='100' width='600' height='400' rx='20' fill='rgba(255,255,255,0.9)' stroke='%23FFD700' stroke-width='4'/%3E%3Ctext x='400' y='250' font-family='Arial' font-size='48' font-weight='bold' fill='%23FF6B35' text-anchor='middle' dy='0.3em'%3E${poi.name}%3C/text%3E%3Ctext x='400' y='320' font-family='Arial' font-size='24' fill='%236B7280' text-anchor='middle' dy='0.3em'%3E${subtitle}%3C/text%3E%3Crect x='250' y='380' width='300' height='60' rx='30' fill='%23FF6B35'/%3E%3Ctext x='400' y='420' font-family='Arial' font-size='28' font-weight='bold' fill='white' text-anchor='middle' dy='0.3em'%3E历史悠久%3C/text%3E%3C/svg%3E`
    ]
  };
});

// 获取所有POI数据
const mapData = processedMapData;

export default function TianjinMap() {
  const { isDark, theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<POI | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  // 初始化imageLoaded状态，为每个POI创建对应的加载状态数组
  const [imageLoaded, setImageLoaded] = useState<{[key: number]: boolean[]}>(() => {
    const initialState: {[key: number]: boolean[]} = {};
    mapData.forEach(poi => {
      initialState[poi.id] = poi.images.map(() => false);
    });
    return initialState;
  });
  // 图片轮播状态
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  // 区域筛选状态
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  // 天津主要区域列表
  const regions = [
    '和平区',
    '河西区',
    '南开区',
    '河东区',
    '河北区',
    '红桥区',
    '东丽区',
    '西青区',
    '津南区',
    '北辰区',
    '武清区',
    '宝坻区',
    '滨海新区',
    '宁河区',
    '静海区',
    '蓟州区'
  ];
  
  // 筛选数据 - 使用useMemo缓存筛选结果，避免在每次渲染时重复计算
  const filteredBrands = useMemo(() => {
    // 缓存筛选条件，避免重复计算
    const lowerSearchQuery = searchQuery.toLowerCase();
    const isAllCategories = selectedCategory === 'all';
    const isAllRegions = selectedRegion === 'all';
    
    const filtered = mapData.filter(brand => {
      const matchesCategory = isAllCategories || brand.category === selectedCategory;
      const matchesSearch = lowerSearchQuery === '' || 
                           (brand.name && brand.name.toLowerCase().includes(lowerSearchQuery)) || 
                           (brand.description && brand.description.toLowerCase().includes(lowerSearchQuery));
      // 目前所有POI都在天津市区，所以区域筛选暂时只做占位
      const matchesRegion = isAllRegions || true;
      
      return matchesCategory && matchesSearch && matchesRegion;
    });
    
    console.log('filteredBrands:', filtered.length, 'mapData:', mapData.length);
    return filtered;
  }, [mapData, selectedCategory, searchQuery, selectedRegion]);

  // 虚拟地图数据 - 使用useMemo优化数据生成和转换
  const virtualRegions = useMemo<Region[]>(() => {
    return [];
  }, []);
  
  // 转换本地POI为虚拟地图POI格式 - 使用useMemo缓存转换结果
  const virtualPOIs = useMemo<VirtualPOI[]>(() => {
    // 正确的颜色映射表，将Tailwind颜色类映射到十六进制颜色
    const colorMap: Record<string, string> = {
      'bg-yellow-500': '#eab308',
      'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#8b5cf6',
      'bg-red-500': '#ef4444',
      'bg-green-500': '#10b981'
    };
    
    // 使用筛选后的POI数据，而不是全部POI数据
    const pois = filteredBrands.map(poi => {
      // 确保坐标数据有效，并生成合理的虚拟地图坐标
      // 优化：添加坐标范围限制，确保POI不会超出地图可见范围
      let xValue = poi.position.x;
      let yValue = poi.position.y;
      
      // 验证并修正坐标值，确保它们在合理范围内（0-100）
      if (typeof xValue !== 'number' || isNaN(xValue)) {
        xValue = 50; // 默认值，确保POI在地图中心附近
      } else {
        // 限制x坐标范围在0-100之间
        xValue = Math.max(0, Math.min(100, xValue));
      }
      
      if (typeof yValue !== 'number' || isNaN(yValue)) {
        yValue = 50; // 默认值，确保POI在地图中心附近
      } else {
        // 限制y坐标范围在0-100之间
        yValue = Math.max(0, Math.min(100, yValue));
      }
      
      // 直接使用POI的x和y值作为世界坐标，确保与useMapState中的坐标系统一致
      // 这里我们将0-100范围的坐标转换为500-1500范围，以便在默认缩放级别下能看到所有POI
      const x = 500 + (xValue - 50) * 20;
      const y = 500 + (yValue - 50) * 20;
      
      // 获取正确的十六进制颜色
      const twColor = CATEGORY_COLORS[poi.category] || 'bg-blue-500';
      const hexColor = colorMap[twColor] || '#3b82f6';
      
      return {
        id: poi.id.toString(),
        name: poi.name,
        coordinate: {
          x,
          y
        },
        category: poi.category,
        description: poi.description,
        color: hexColor,
        importance: poi.importance || 1
      };
    });
    
    console.log('virtualPOIs生成:', pois.length, 'filteredBrands:', filteredBrands.length);
    return pois;
  }, [filteredBrands]);
  
  // 生成初始路径 - 使用useMemo优化
  const virtualPaths = useMemo<Path[]>(() => {
    return [];
  }, []);
  
  // 预加载POI图片 - 优化版：更高效的加载策略
  useEffect(() => {
    const preloadPOIImages = async () => {
      // 不使用延迟执行，直接开始预加载
      
      // 只预加载第一张图片，其他图片按需加载
      const imagesToPreload = mapData.map(poi => ({
        poi,
        imageUrl: poi.images[0],
        index: 0
      }));
      
      // 并行处理所有图片预加载，提高效率
      const promises = imagesToPreload.map(({ poi, imageUrl, index }) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            // 使用更高效的状态更新，只更新当前图片的状态
            setImageLoaded((prev) => {
              const existing = prev[poi.id] || Array(poi.images.length).fill(false);
              const updated = [...existing];
              updated[index] = true;
              return { ...prev, [poi.id]: updated };
            });
            resolve();
          };
            
          img.onerror = () => {
            // 错误处理，避免影响其他图片加载
            resolve();
          };
            
          img.src = imageUrl;
        });
      });
      
      await Promise.all(promises);
    };
    
    preloadPOIImages();
  }, []);

  // 重置图片轮播索引当选择新的POI时
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedBrand]);

  // 处理标记点击
  const handleMarkerClick = (brand: POI) => {
    setSelectedBrand(brand);
    setShowInfo(true);
  };
  
  // 处理虚拟地图POI点击
  const handlePOIClick = useCallback((poiId: string) => {
    const brand = mapData.find(b => b.id.toString() === poiId);
    if (brand) {
      handleMarkerClick(brand);
    } else {
      console.error('未找到对应的POI:', poiId);
    }
  }, [mapData]);
  
  // 处理虚拟地图点击 - 添加关闭信息卡片逻辑
  const handleMapClick = useCallback(() => {
    setShowInfo(false);
    setSelectedBrand(null);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      {/* 英雄区 */}
      <GradientHero 
        title="天津老字号历史地图" 
        subtitle="探索天津百年老字号的历史分布与文化传承" 
        theme="heritage"
        stats={[
          { label: '文化资源', value: mapData.length.toString() },
          { label: '文化分类', value: Object.keys(categories).length.toString() },
          { label: '历史跨度', value: '近200年' },
          { label: '文化遗产', value: '国家级' }
        ]}
        pattern={true}
        size="lg"
        // 中文注释：使用Unsplash高清"复古地图纹理"作为背景图，替代原AI生成图片，营造沉浸式历史氛围
        backgroundImage="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1920&q=80"
      />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">

        
        {/* 地图控制区 */}
        <div className={`p-3 md:p-6 rounded-2xl shadow-lg mb-3 md:mb-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <div className="flex flex-col gap-3">
            {/* 搜索输入框 - 置顶显示在移动端 */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜索老字号或地标..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300`}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* 分类筛选和区域筛选 */}
            <div className="flex flex-col gap-3 pt-1">
              {/* 分类筛选 - 移动端紧凑布局 */}
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg ${selectedCategory === 'all' ? (isDark ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')} border border-transparent hover:border-opacity-50`}
                  onClick={() => setSelectedCategory('all')}
                >
                  全部分类
                </button>
                {Object.entries(categories).map(([key, category]) => {
                  const colorClass = category.color.replace('bg-', '');
                  return (
                  <button 
                    key={key}
                    className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-1.5 ${selectedCategory === key ? (isDark ? `bg-gradient-to-r from-${colorClass}/80 to-${colorClass}` : `bg-gradient-to-r from-${colorClass} to-${colorClass}/80`) + ' text-white' : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')} border border-transparent hover:border-opacity-50`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    <span className="text-base">{category.icon}</span> <span className="hidden sm:inline">{category.name}</span>
                  </button>
                  );
                })}
              </div>
              
              {/* 区域筛选 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>区域:</span>
                <button 
                  className={`px-3 py-1 rounded-md text-xs transition-all duration-300 ${selectedRegion === 'all' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  onClick={() => setSelectedRegion('all')}
                >
                  全部
                </button>
                {regions.filter(r => r !== 'all').map(region => (
                  <button 
                    key={region}
                    className={`px-3 py-1 rounded-md text-xs transition-all duration-300 ${selectedRegion === region ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                    onClick={() => setSelectedRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 地图展示区 - 响应式设计 */}
        <div className="relative w-full rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700" style={{ height: '800px', minHeight: '500px', maxHeight: 'calc(100vh - 100px)' }}>
          {/* 使用虚拟地图组件 */}
          <VirtualMap
            initialRegions={virtualRegions}
            initialPOIs={virtualPOIs}
            initialPaths={virtualPaths}
            onPOIClick={handlePOIClick}
            onMapClick={handleMapClick}
            className={`${isDark ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'}`}
            style={{ height: '100%', width: '100%' }}
          />
          
          {/* 信息面板 - 响应式设计 */}
          {showInfo && selectedBrand && (
            <motion.div
              className={`absolute bottom-16 left-0 right-0 md:bottom-20 md:left-4 md:right-auto md:w-80 lg:w-96 bg-white dark:bg-gray-800 rounded-t-xl md:rounded-xl shadow-2xl border-t md:border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-50 max-h-[50vh] md:max-h-[70vh]`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* 图片轮播区域 */}
              <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                
                {/* 图片轮播 */}
                {selectedBrand.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${selectedBrand.name} - 图片 ${index + 1}`} 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => {
                      setImageLoaded(prev => {
                        const existing = prev[selectedBrand.id] || Array(selectedBrand.images.length).fill(false);
                        const updated = [...existing];
                        updated[index] = true;
                        return { ...prev, [selectedBrand.id]: updated };
                      });
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // 使用内置占位图替代外部服务
                      target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23${isDark ? '374151' : 'e5e7eb'}'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='20' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E${selectedBrand.name}%3C/text%3E%3Ctext x='200' y='180' font-family='Arial' font-size='14' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E图片加载中...%3C/text%3E%3C/svg%3E`;
                      target.alt = `${selectedBrand.name} 图片`;
                      setImageLoaded(prev => {
                        const existing = prev[selectedBrand.id] || Array(selectedBrand.images.length).fill(false);
                        const updated = [...existing];
                        updated[index] = true;
                        return { ...prev, [selectedBrand.id]: updated };
                      });
                    }}
                    style={{ display: 'block' }}
                  />
                ))}
                
                {/* SVG数据URL会立即加载，移除加载占位符 */}
                
                {/* 年份徽章 */}
                <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <i className="fas fa-calendar-alt text-xs"></i>
                  {selectedBrand.year} 年
                </div>
                
                {/* 图片轮播导航 */}
                {selectedBrand.images.length > 1 && (
                  <>
                    {/* 导航按钮 */}
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-20"
                      onClick={() => setCurrentImageIndex(prev => (prev - 1 + selectedBrand.images.length) % selectedBrand.images.length)}
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-20"
                      onClick={() => setCurrentImageIndex(prev => (prev + 1) % selectedBrand.images.length)}
                    >
                      <i className="fas fa-chevron-right text-sm"></i>
                    </button>
                    
                    {/* 轮播指示器 */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
                      {selectedBrand.images.map((_, index) => (
                        <button 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
                          onClick={() => setCurrentImageIndex(index)}
                        ></button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 内容区域 - 添加滚动功能 */}
              <div className="p-5 overflow-y-auto max-h-[calc(50vh-140px)] md:max-h-[calc(70vh-140px)] pb-8">
                <h3 className="text-2xl font-bold mb-2 dark:text-white">{selectedBrand.name}</h3>
                
                {/* 重要性等级展示 */}
                {selectedBrand.importance && (
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <i 
                        key={index}
                        className={`fas fa-star ${index < (selectedBrand.importance || 0) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} text-sm`}
                      ></i>
                    ))}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {['', '一般', '重要', '很重要', '非常重要', '极其重要'][selectedBrand.importance] || ''}
                    </span>
                  </div>
                )}
                
                {/* 分类和地址 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                    {CATEGORY_ICONS[selectedBrand.category]} {localPOIData.categories[selectedBrand.category]?.name || '其他'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-xs"></i>
                    {selectedBrand.address}
                  </span>
                </div>
                
                {/* 标签系统 */}
                {selectedBrand.tags && selectedBrand.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedBrand.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:opacity-80 transition-opacity`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 核心信息卡片 */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  {/* 创立时间 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                      <i className="fas fa-calendar-alt text-xs"></i>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">创立时间</div>
                      <div className="text-sm font-semibold dark:text-white">{selectedBrand.year} 年</div>
                    </div>
                  </div>
                  
                  {/* 开放时间 */}
                  {selectedBrand.openingHours && (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                        <i className="fas fa-clock text-xs"></i>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">开放时间</div>
                        <div className="text-sm font-semibold dark:text-white">{selectedBrand.openingHours}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 联系电话 */}
                  {selectedBrand.phone && (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800'}`}>
                        <i className="fas fa-phone text-xs"></i>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">联系电话</div>
                        <div className="text-sm font-semibold dark:text-white">{selectedBrand.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 文化遗产级别 */}
                  {selectedBrand.culturalHeritageLevel && (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`}>
                        <i className="fas fa-award text-xs"></i>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">遗产级别</div>
                        <div className="text-sm font-semibold dark:text-white">{selectedBrand.culturalHeritageLevel}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 历史背景 */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1">
                    <i className="fas fa-history text-gray-500 dark:text-gray-400"></i>
                    历史背景
                  </h4>
                  <p className="text-sm dark:text-gray-300 leading-relaxed">{selectedBrand.description}</p>
                </div>
                
                {/* 历史意义 */}
                {selectedBrand.historicalSignificance && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1">
                      <i className="fas fa-book text-gray-500 dark:text-gray-400"></i>
                      历史意义
                    </h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed">{selectedBrand.historicalSignificance}</p>
                  </div>
                )}
                
                {/* 特色产品/服务 */}
                {selectedBrand.featuredProducts && selectedBrand.featuredProducts.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1">
                      <i className="fas fa-gift text-gray-500 dark:text-gray-400"></i>
                      特色产品
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBrand.featuredProducts.map((product, index) => (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-800/30' : 'bg-green-100 text-green-800 hover:bg-green-200'} hover:opacity-80 transition-all duration-300`}
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 荣誉资质 */}
                {selectedBrand.honors && selectedBrand.honors.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1">
                      <i className="fas fa-trophy text-gray-500 dark:text-gray-400"></i>
                      荣誉资质
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBrand.honors || []).map((honor, index) => (
                        <span 
                          key={`honor-${index}`}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/30' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'} hover:opacity-80 transition-all duration-300`}
                        >
                          {honor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 相关POI推荐 */}
                {selectedBrand.relatedPois && selectedBrand.relatedPois.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1">
                      <i className="fas fa-compass text-gray-500 dark:text-gray-400"></i>
                      相关推荐
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedBrand.relatedPois.map(poiId => {
                        const relatedPoi = mapData.find(p => p.id === poiId);
                        return relatedPoi ? (
                          <button 
                            key={relatedPoi.id}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-all duration-300 hover:shadow-md`}
                            onClick={() => handleMarkerClick(relatedPoi)}
                          >
                            <span className={`text-lg ${CATEGORY_COLORS[relatedPoi.category]}`}>{CATEGORY_ICONS[relatedPoi.category]}</span>
                            <div className="flex-1 text-left">
                              <div className="font-medium truncate">{relatedPoi.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{localPOIData.categories[relatedPoi.category]?.name}</div>
                            </div>
                            <i className="fas fa-chevron-right text-xs text-gray-400 dark:text-gray-500"></i>
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                    onClick={() => setShowInfo(false)}
                  >
                    <i className="fas fa-times"></i>
                    关闭
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                    onClick={() => {
                      try {
                        const url = window.location.href;
                        // 根据当前选中的POI自定义分享内容
                        const shareTitle = selectedBrand 
                          ? `${selectedBrand.name} - 天津老字号历史地图` 
                          : '天津老字号历史地图';
                        
                        if (navigator.share && window.isSecureContext) {
                          // 使用Web Share API调用系统分享功能
                          navigator.share({
                            title: shareTitle,
                            url: url
                          });
                        } else {
                          // 不支持Web Share API时，复制链接到剪贴板
                          navigator.clipboard.writeText(url);
                          // 添加简单的提示
                          alert('分享链接已复制到剪贴板');
                        }
                      } catch (error) {
                        console.error('分享失败:', error);
                        alert('分享失败，请稍后重试');
                      }
                    }}
                  >
                    <i className="fas fa-share-alt"></i>
                    分享
                  </button>
                </div>
                
                {/* AR体验按钮 */}
                <button 
                  className={`w-full mt-3 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                  onClick={() => window.open('/AR', '_blank', 'width=1000,height=800')}
                >
                  <i className="fas fa-vr-cardboard"></i>
                  AR体验
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* 地图说明 */}
        <div className={`p-6 rounded-2xl shadow-lg mt-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <h3 className="text-xl font-bold mb-4">地图使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-mouse-pointer text-red-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">点击标记</h4>
                <p className="text-sm dark:text-gray-400">点击地图上的标记点查看老字号详细信息</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-filter text-blue-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">分类与区域筛选</h4>
                <p className="text-sm dark:text-gray-400">支持按品牌类型和行政区域进行组合筛选</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-search-plus text-green-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">缩放控制</h4>
                <p className="text-sm dark:text-gray-400">使用鼠标滚轮或地图控件调整地图大小</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-purple-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">了解历史</h4>
                <p className="text-sm dark:text-gray-400">探索天津老字号的百年历史与文化传承</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
