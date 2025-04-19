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
const habiticaStatusUrl = `${habiticaBaseUrl}/status`
const habiticaTasksUrl = `${habiticaBaseUrl}/tasks/user?type=todos`
const habiticaTagsUrl = `${habiticaBaseUrl}/tags`

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
   const response = await fetch(habiticaTasksUrl, {
      method: 'GET',
      headers: habiticaHeaders,
   })

   if (response.ok) {
      const data = await response.json()
      // console.log(data)
      return data.data
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

async function getHabiticaTags() {
   const response = await fetch(habiticaTagsUrl, {
      method: 'GET',
      headers: habiticaHeaders,
   })

   if (response.ok) {
      const data = await response.json()
      return data.data
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

async function getHabiticaTag(name) {
   const tags = await getHabiticaTags()
   const foundTag = tags.find((tag) => tag.name === name)

   return foundTag
}
async function getHabiticaTodoistTasks() {
   const todoistTag = {
      name: 'Todoist',
      id: 'fd988064-d94b-4494-8a21-172eac28009b',
   }
   //  {
   //    name: '✨ NEA Neatness',
   //    id: '0b0dd0c2-0d1b-4265-8160-ee72bc0f8ef0',
   // }
   //   await getHabiticaTag('Todoist')
   const tasks = await getHabiticaTasks()

   // Filter out habitica task that don't have the todiest tag.
   const habiticaTasks = tasks.filter((task) =>
      task.tags.some((tag) => tag === todoistTag.id) ? true : false
   )

   return habiticaTasks
}

async function run() {
   // getHabiticaTasks()
   // getHabiticaTags()
   getHabiticaTodoistTasks()
   // getTodoistTasks()
}

run()
