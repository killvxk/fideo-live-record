import debug from 'debug'

import { getBilibiliLiveUrlsPlugin } from './plugins/bilibili'
import { getCCLiveUrlsPlugin } from './plugins/cc'
import { getDouYinLiveUrlsPlugin } from './plugins/douyin'
import { getDouyuLiveUrlsPlugin } from './plugins/douyu'
import { getHuyaLiveUrlsPlugin } from './plugins/huya'
import { getKuaishouLiveUrlsPlugin } from './plugins/kuaishou'
import { getYoutubeLiveUrlsPlugin } from './plugins/youtube'
import { getTwitchLiveUrlsPlugin } from './plugins/twitch'
import { getTiktokLiveUrlsPlugin } from './plugins/tiktok'
import { getWeiboLiveUrlsPlugin } from './plugins/weibo'
import { getHuaJiaoLiveUrlsPlugin } from './plugins/huajiao'
import { getTaobaoLiveUrlsPlugin } from './plugins/taobao'
import { getBigoLiveUrlsPlugin } from './plugins/bigo'
import { getYYLiveUrlsPlugin } from './plugins/yy'

import { CRAWLER_ERROR_CODE } from '../../code'

const log = debug('fideo-crawler')

const getPathnameItem = (url, index = 1) => {
  const { pathname } = new URL(url)
  return pathname.split('/')[index]
}

const getYoutubeRoomId = (url) => {
  const { searchParams } = new URL(url)
  return searchParams.get('v')
}

const supportPlatform = [
  'douyin',
  'bilibili',
  'cc',
  'douyu',
  'kuaishou',
  'huya',
  'youtube',
  'twitch',
  'tiktok',
  'weibo',
  'huajiao',
  'taobao',
  'bigo',
  'yy',
  'huya'
]
const platformToFnMap = {
  douyin: {
    getLiveUrlsFn: getDouYinLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  bilibili: {
    getLiveUrlsFn: getBilibiliLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  cc: {
    getLiveUrlsFn: getCCLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  huya: {
    getLiveUrlsFn: getHuyaLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  douyu: {
    getLiveUrlsFn: getDouyuLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      const { searchParams } = new URL(url)
      return searchParams.get('rid') || getPathnameItem(url)
    }
  },
  kuaishou: {
    getLiveUrlsFn: getKuaishouLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      return getPathnameItem(url, 2)
    }
  },
  youtube: {
    getLiveUrlsFn: getYoutubeLiveUrlsPlugin,
    getRoomIdByUrl: getYoutubeRoomId
  },
  twitch: {
    getLiveUrlsFn: getTwitchLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  tiktok: {
    getLiveUrlsFn: getTiktokLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  },
  weibo: {
    getLiveUrlsFn: getWeiboLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      return getPathnameItem(url, 5)
    }
  },
  huajiao: {
    getLiveUrlsFn: getHuaJiaoLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      return getPathnameItem(url, 2)
    }
  },
  taobao: {
    getLiveUrlsFn: getTaobaoLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      return new URL(url).searchParams.get('liveId')
    }
  },
  bigo: {
    getLiveUrlsFn: getBigoLiveUrlsPlugin,
    getRoomIdByUrl(url) {
      return Number.isNaN(Number(getPathnameItem(url)))
        ? getPathnameItem(url, 2)
        : getPathnameItem(url)
    }
  },
  yy: {
    getLiveUrlsFn: getYYLiveUrlsPlugin,
    getRoomIdByUrl: getPathnameItem
  }
}
/**
 *
 * @param {{ url: string, proxy?: string, cookie?: string }} info
 * @returns {Promise<{code: number, liveUrls?: string[]}>}
 */
export async function getLiveUrls(info) {
  const { roomUrl, proxy, cookie } = info
  let host
  try {
    host = new URL(roomUrl).host
  } catch (e) {
    console.error(e)
    return {
      code: CRAWLER_ERROR_CODE.INVALID_URL
    }
  }

  const platform = supportPlatform.find((p) => host.includes(p))
  log('platform:', platform)

  if (!platform) {
    return {
      code: CRAWLER_ERROR_CODE.NOT_SUPPORT
    }
  }

  const { getLiveUrlsFn, getRoomIdByUrl } = platformToFnMap[platform]
  if (!getLiveUrlsFn || !getRoomIdByUrl) {
    return {
      code: CRAWLER_ERROR_CODE.NOT_SUPPORT
    }
  }
  const roomId = getRoomIdByUrl(roomUrl)
  log('roomId:', roomId)

  const res = await getLiveUrlsFn(roomId, { proxy, cookie })
  log('res:', res)
  return res
}
