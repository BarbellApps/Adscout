const apiBaseUrlInput = document.getElementById('apiBaseUrl')
const apiKeyInput = document.getElementById('apiKey')
const statusEl = document.getElementById('status')

chrome.storage.local.get(['apiKey', 'apiBaseUrl'], ({ apiKey, apiBaseUrl }) => {
  if (apiBaseUrl) apiBaseUrlInput.value = apiBaseUrl
  if (apiKey) apiKeyInput.value = apiKey
})

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    apiBaseUrl: apiBaseUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
  })
  statusEl.textContent = 'Saved.'
  setTimeout(() => (statusEl.textContent = ''), 2000)
})
