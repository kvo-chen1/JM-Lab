// 主题样式索引文件
// 导出所有主题样式，便于统一管理和加载

// 导入各主题样式
import './base.css';
import './blue.css';
import './green.css';
import './pixel.css';
import './dark.css';
import './tianjin.css';
import './tianjin-enhanced.css';
import './poizon.css';
import './delta-force.css';
import './cyber-brutalist.css';
import './pink-brutalist.css';
import './retro-pixel.css';
import './kawaii.css';
import './chiikawa.css';

// 导出主题类型
export type Theme = 'light' | 'blue' | 'green' | 'pixel' | 'dark' | 'tianjin' | 'nirenzhang' | 'yangliuqing' | 'fengzhengwei' | 'guifaxiang' | 'goubuli' | 'tianjin-enhanced' | 'poizon' | 'delta-force' | 'cyber-brutalist' | 'pink-brutalist' | 'retro-pixel' | 'kawaii' | 'chiikawa';

// 导出主题配置接口
export interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
  description?: string;
}

// 导出主题配置列表
export const themeConfigs: ThemeConfig[] = [
  { value: 'light', label: '浅色', icon: 'fas fa-sun', description: '明亮清爽的默认主题' },
  { value: 'dark', label: '暗色', icon: 'fas fa-moon', description: '墨韵深空暗色主题，专业级深色体验' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water', description: '清新蓝色主题，带来宁静感' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf', description: '自然绿色主题，充满生机' },
  { value: 'pixel', label: '赛博像素', icon: 'fas fa-dungeon', description: '复古赛博朋克风格主题' },
  { value: 'delta-force', label: '三角洲行动', icon: 'fas fa-crosshairs', description: '三角洲行动军事科技主题，军事绿+科技蓝，战术风格' },
  { value: 'tianjin', label: '津门雅韵', icon: 'fas fa-landmark', description: '天津城市特色主题，融合海河蓝、历史砖红、老字号文化元素' },
  { value: 'nirenzhang', label: '泥人张红', icon: 'fas fa-palette', description: '工艺美术主题，热烈红色调，用于重要操作和强调' },
  { value: 'yangliuqing', label: '杨柳青绿', icon: 'fas fa-tree', description: '天津杨柳青年画主题，石青配朱砂红，半印半绘工艺' },
  { value: 'fengzhengwei', label: '风筝魏蓝', icon: 'fas fa-paper-plane', description: '传统技艺主题，清新蓝色调，用于信息提示和链接' },
  { value: 'guifaxiang', label: '桂发祥金', icon: 'fas fa-crown', description: '传统美食主题，尊贵金色调，用于VIP标识和会员等级' },
  { value: 'goubuli', label: '狗不理棕', icon: 'fas fa-bread-slice', description: '传统美食主题，温暖棕色调，用于暖色调装饰' },
  { value: 'tianjin-enhanced', label: '津门雅韵·深', icon: 'fas fa-city', description: '天津文化主题深化版，融合海河波纹、传统纹样、老字号元素' },
  { value: 'poizon', label: '得物潮流', icon: 'fas fa-bolt', description: '得物App风格主题，极光蓝品牌色+黑白极简基底' },
  { value: 'kawaii', label: '日系萌系', icon: 'fas fa-heart', description: '日系萌系治愈风，马卡龙粉+柠檬黄+天蓝色调，温暖治愈的数字乌托邦' },
  { value: 'chiikawa', label: 'Chiikawa世界', icon: 'fas fa-heart', description: 'Chiikawa治愈风，马卡龙粉+柠檬黄+Baby蓝渐变，Chiikawa角色元素与柔和波浪边框' }
];

// 导出主题切换顺序
export const themeOrder: Theme[] = ['light', 'dark', 'blue', 'green', 'pixel', 'delta-force', 'tianjin', 'nirenzhang', 'yangliuqing', 'fengzhengwei', 'guifaxiang', 'goubuli', 'tianjin-enhanced', 'poizon', 'kawaii', 'chiikawa'];
