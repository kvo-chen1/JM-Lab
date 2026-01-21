import AMapLoader from '@amap/amap-jsapi-loader'

type TravelMode = 'drive' | 'transit' | 'walk'

export interface TrafficQuery {
  origin: string
  destination: string
  mode?: TravelMode
}

export interface RouteStep {
  instruction: string
  distance: number
  duration: number
}

export interface TrafficRouteResult {
  mode: TravelMode
  distance: number
  duration: number
  steps: RouteStep[]
  provider: 'amap' | 'mock'
}

export interface GovServiceQuery {
  service: string
  city?: string
}

export interface GovServiceResult {
  service: string
  steps: string[]
  onlinePortal?: string
  hotline?: string
  provider: 'local' | 'mock'
}

const CACHE_PREFIX = 'jmzf_local_services_'
const ONE_HOUR = 3600000

function getEnv(key: string): string | undefined {
  try {
    if (typeof window !== 'undefined' && (window as any).env) return (window as any).env[key]
    if (typeof process !== 'undefined' && process.env) return process.env[key]
  } catch {}
  return undefined
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > ONE_HOUR) return null
    return data.value as T
  } catch {
    return null
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), value })
    )
  } catch {}
}

export async function getTrafficRoute(query: TrafficQuery): Promise<TrafficRouteResult> {
  const origin = query.origin.trim()
  const destination = query.destination.trim()
  const mode: TravelMode = query.mode || 'drive'
  const cacheKey = `traffic_${origin}_${destination}_${mode}`
  const cached = readCache<TrafficRouteResult>(cacheKey)
  if (cached) return cached

  const amapKey = getEnv('VITE_AMAP_KEY') || getEnv('AMAP_KEY')
  if (!amapKey) {
    const mock: TrafficRouteResult = {
      mode,
      distance: 8500,
      duration: 1200,
      steps: [
        { instruction: `从 ${origin} 出发`, distance: 800, duration: 180 },
        { instruction: '沿主要道路直行，经两处路口', distance: 4200, duration: 600 },
        { instruction: '根据路牌右转进入目的地区域', distance: 2100, duration: 300 },
        { instruction: `到达 ${destination}`, distance: 1400, duration: 120 }
      ],
      provider: 'mock'
    }
    writeCache(cacheKey, mock)
    return mock
  }

  try {
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0'
    })

    const routeResult: TrafficRouteResult = {
      mode,
      distance: 0,
      duration: 0,
      steps: [],
      provider: 'amap'
    }

    const geocoder = new AMap.Geocoder()
    const [originGeo, destGeo] = await Promise.all([
      new Promise<any>((resolve) => geocoder.getLocation(origin, (status: string, result: any) => resolve(status === 'complete' ? result : null))),
      new Promise<any>((resolve) => geocoder.getLocation(destination, (status: string, result: any) => resolve(status === 'complete' ? result : null)))
    ])

    if (!originGeo || !destGeo) {
      const fallback = await getTrafficRoute({ origin, destination, mode })
      writeCache(cacheKey, fallback)
      return fallback
    }

    const originLngLat = originGeo.geocodes[0].location
    const destLngLat = destGeo.geocodes[0].location

    if (mode === 'drive') {
      const driving = new AMap.Driving()
      const plan: any = await new Promise((resolve, reject) =>
        driving.search(originLngLat, destLngLat, (status: string, result: any) =>
          status === 'complete' ? resolve(result) : reject(new Error(status))
        )
      )
      const path = plan.routes?.[0]
      routeResult.distance = path?.distance || 0
      routeResult.duration = path?.time || 0
      routeResult.steps = (path?.steps || []).map((s: any) => ({
        instruction: s.instruction,
        distance: s.distance,
        duration: s.time
      }))
    } else if (mode === 'transit') {
      const transfer = new AMap.Transfer({ city: '天津' })
      const plan: any = await new Promise((resolve, reject) =>
        transfer.search(originLngLat, destLngLat, (status: string, result: any) =>
          status === 'complete' ? resolve(result) : reject(new Error(status))
        )
      )
      const path = plan.plans?.[0]
      routeResult.distance = path?.distance || 0
      routeResult.duration = path?.time || 0
      routeResult.steps = (path?.segments || []).map((seg: any) => ({
        instruction: seg.instruction || seg.transit_mode || '换乘',
        distance: seg.distance || 0,
        duration: seg.time || 0
      }))
    } else {
      const walking = new AMap.Walking()
      const plan: any = await new Promise((resolve, reject) =>
        walking.search(originLngLat, destLngLat, (status: string, result: any) =>
          status === 'complete' ? resolve(result) : reject(new Error(status))
        )
      )
      const path = plan.routes?.[0]
      routeResult.distance = path?.distance || 0
      routeResult.duration = path?.time || 0
      routeResult.steps = (path?.steps || []).map((s: any) => ({
        instruction: s.instruction,
        distance: s.distance,
        duration: s.time
      }))
    }

    writeCache(cacheKey, routeResult)
    return routeResult
  } catch {
    const mock: TrafficRouteResult = {
      mode,
      distance: 9000,
      duration: 1350,
      steps: [
        { instruction: `从 ${origin} 出发`, distance: 1000, duration: 200 },
        { instruction: '沿主干道直行，经三个路口', distance: 5000, duration: 800 },
        { instruction: '靠右行驶进入辅路', distance: 2000, duration: 270 },
        { instruction: `到达 ${destination}`, distance: 1000, duration: 80 }
      ],
      provider: 'mock'
    }
    writeCache(cacheKey, mock)
    return mock
  }
}

const GOV_GUIDES: Record<string, GovServiceResult> = {
  '身份证办理': {
    service: '身份证办理',
    steps: ['准备本人有效户口簿', '前往当地公安分局办证中心', '填写申请表并采集指纹与照片', '缴纳工本费并领取回执'],
    onlinePortal: 'https://zwfw.tj.gov.cn',
    hotline: '12345',
    provider: 'local'
  },
  '居住证办理': {
    service: '居住证办理',
    steps: ['准备租房合同与稳定就业材料', '前往社区服务中心申请登记', '提交材料审核', '审核通过后制证与领取'],
    onlinePortal: 'https://zwfw.tj.gov.cn',
    hotline: '12345',
    provider: 'local'
  }
}

export async function getGovServiceGuide(query: GovServiceQuery): Promise<GovServiceResult> {
  const key = `${query.service}_${query.city || '天津'}`
  const cache = readCache<GovServiceResult>(`gov_${key}`)
  if (cache) return cache
  const guide = GOV_GUIDES[query.service] || {
    service: query.service,
    steps: ['进入天津网上办事大厅', '在搜索框输入服务名称', '根据指引提交线上材料', '如需线下办理，携带原件前往窗口'],
    onlinePortal: 'https://zwfw.tj.gov.cn',
    hotline: '12345',
    provider: 'mock'
  }
  writeCache(`gov_${key}`, guide)
  return guide
}

export default {
  getTrafficRoute,
  getGovServiceGuide
}
