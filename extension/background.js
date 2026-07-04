chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'adscout-save-image',
    title: 'Save ad image to AdScout',
    contexts: ['image'],
  })
  chrome.contextMenus.create({
    id: 'adscout-save-page',
    title: 'Save this page as an ad to AdScout',
    contexts: ['page'],
  })
})

function detectPlatform(url) {
  if (!url) return 'other'
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('tiktok.com')) return 'tiktok'
  return 'other'
}

async function setBadge(text, color) {
  await chrome.action.setBadgeText({ text })
  await chrome.action.setBadgeBackgroundColor({ color })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2500)
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { apiKey, apiBaseUrl } = await chrome.storage.local.get(['apiKey', 'apiBaseUrl'])

  if (!apiKey || !apiBaseUrl) {
    await setBadge('!', '#F87171')
    return
  }

  const payload = {
    media_url: info.menuItemId === 'adscout-save-image' ? info.srcUrl : null,
    headline: tab?.title ?? null,
    body_copy: info.menuItemId === 'adscout-save-page' ? info.pageUrl : null,
    platform: detectPlatform(tab?.url),
  }

  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/extension/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })
    await setBadge(res.ok ? '✓' : '✗', res.ok ? '#22C55E' : '#F87171')
  } catch {
    await setBadge('✗', '#F87171')
  }
})
