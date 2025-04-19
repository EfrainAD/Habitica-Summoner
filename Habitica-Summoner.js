require('dotenv').config()

// Habitica Auth
const habiticaUserId = process.env.HABITICA_USER_ID
const habiticaApiToken = process.env.HABITICA_API_TOKEN
const HabiticaXClient = process.env.HABITICA_X_CLIENT
// Todoist Auth
const todoistApiKey = process.env.TODOIST_API_KEY

// API Base URLs
const habiticaBaseUrl = 'https://habitica.com/api/v3'
const todoistBaseUrl = 'https://api.todoist.com/rest/v2'

// Habitica API URL Calls
const habiticaStatusURL = `${habiticaBaseUrl}/status`
const habiticaTaskURL = `${habiticaBaseUrl}/tasks/user?type=todos`
const habiticaUrl = habiticaTaskURL

// Todoist API URL Calls
const todoistUrl = `${todoistBaseUrl}/tasks`

// Habatica API Headers
const habiticaHeaders = {
   'x-api-user': habiticaUserId,
   'x-api-key': habiticaApiToken,
   'x-client': HabiticaXClient,
}

// Todoist API Headers
const todoistHeaders = {
   Authorization: `Bearer ${todoistApiKey}`,
   'Content-Type': 'application/json',
}

async function getTodoistTasks() {
   const response = await fetch(todoistUrl, {
      method: 'GET',
      headers: todoistHeaders,
   })

   if (response.ok) {
      const data = await response.json()
      console.log(data)
   } else {
      console.error('Todoist API error:', response.status, response.statusText)
   }
}

// Fetch tasks from Habitica (as an example of GET request)
async function getHabiticaTasks() {
   const response = await fetch(habiticaUrl, {
      method: 'GET',
      headers: habiticaHeaders,
   })

   if (response.ok) {
      const data = await response.json()
      console.log(data)
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

// getHabiticaTasks()
getTodoistTasks()
