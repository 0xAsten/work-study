document.addEventListener('DOMContentLoaded', function () {
  var submitButton = document.getElementById('submitButton')
  // onClick's logic below:
  submitButton.addEventListener('click', function () {
    generateSentence()
  })

  var editIcon = document.getElementById('editIcon')
  var saveIcon = document.getElementById('saveIcon')
  editIcon.addEventListener('click', function () {
    editIcon.parentElement.classList.add('hidden')
    saveIcon.parentElement.classList.remove('hidden')
  })
  saveIcon.addEventListener('click', function () {
    storeApiKey()
    saveIcon.parentElement.classList.add('hidden')
    editIcon.parentElement.classList.remove('hidden')
  })

  // get user's api key from storage and render it to the apiKeyStored span
  chrome.storage.sync.get(['apiKey'], function (result) {
    const apiKey = result.apiKey
    document.getElementById('apiKeyStored').textContent =
      retainThreeCharacters(apiKey)
    if (!apiKey) {
      editIcon.parentElement.classList.add('hidden')
      saveIcon.parentElement.classList.remove('hidden')
    }
  })
})

function generateSentence() {
  // get api key from chrome storage
  chrome.storage.sync.get(['apiKey'], async function (result) {
    const apiKey = result.apiKey
    let words = document.getElementById('wordInput').value

    // is apiKey is empty, return
    if (!apiKey || !apiKey.length) {
      alert('Please enter your API key')
      return
    }

    // if words is empty, return
    if (!words.length || !words.trim().length) {
      alert('Please enter some words')
      return
    }

    // remove all the punctuations
    words = words.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')

    // make the submitButton disabled and grey out
    document.getElementById('submitButton').disabled = true

    let sentence = await requestGPTAPI(apiKey.trim(), words.trim(), 1)
    // make the submitButton enabled
    document.getElementById('submitButton').disabled = false

    document.getElementById('output').textContent = sentence
  })
}

// a function to retains api key three characters before and after
function retainThreeCharacters(apiKey) {
  const length = apiKey.length
  const firstThree = apiKey.slice(0, 3)
  const lastThree = apiKey.slice(length - 3, length)
  return `${firstThree}...${lastThree}`
}

// a function to store user's api key
function storeApiKey() {
  const apiKey = document.getElementById('apiKey').value

  if (apiKey.length) {
    chrome.storage.sync.set({ apiKey }, function () {
      document.getElementById('apiKeyStored').textContent =
        retainThreeCharacters(apiKey)
    })
  }
}

// a function to request GPT API and get the repsonse
async function requestGPTAPI(apiKey, words, completions) {
  const promptTemplate =
    'Write 5 paragraphs using as common and simple words as possible, each paragraph containing all the following words without prefacing it with anything:'
  const prompt = `${promptTemplate}\n${words}`
  const url = 'https://api.openai.com/v1/completions'
  const data = {
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 1000,
    temperature: 0.8,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    n: completions,
  }
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    })

    if (response.status !== 200) {
      const res = await response.json()
      throw new Error(res.error.message)
    }

    console.log(res)
    return res.data
  } catch (error) {
    return `OpenAI API Error: ${error.message}`
  }
}
