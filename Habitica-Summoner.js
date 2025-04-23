require('dotenv').config()

let todoistTag = null
const TODOIST_TAG = 'Todoist'

// Habitica Auth
const habiticaUserId = process.env.HABITICA_USER_ID
const habiticaApiToken = process.env.HABITICA_API_TOKEN
const HabiticaXClient = process.env.HABITICA_X_CLIENT
// Todoist Auth
const todoistApiKey = process.env.TODOIST_API_KEY

// Habitica Rate Limits
let requestLimitRemaining = null
let requestLimitReset = null

// API Base URLs
const habiticaBaseUrl = 'https://habitica.com/api/v3'
const todoistBaseUrl = 'https://api.todoist.com/rest/v2'

// Habitica API URL
const habiticaStatusUrl = `${habiticaBaseUrl}/status`
const habiticaTasksUrl = `${habiticaBaseUrl}/tasks/user?type=todos`
const updateHabiticaTaskUrl = 'https://habitica.com/api/v3/tasks'
const habiticaAddTaskUrl = `${habiticaBaseUrl}/tasks/user`
const habiticaTagsUrl = `${habiticaBaseUrl}/tags`

// Todoist API URL Calls
const todoistUrl = `${todoistBaseUrl}/tasks`

// Habatica API Headers
const habiticaHeaders = {
   'x-api-user': habiticaUserId,
   'x-api-key': habiticaApiToken,
   'x-client': HabiticaXClient,
   'Content-Type': 'application/json',
}

// Todoist API Headers
const todoistHeaders = {
   Authorization: `Bearer ${todoistApiKey}`,
   'Content-Type': 'application/json',
}

function updateRateLimit(responseHeaders) {
   const limitRemainingHeader = responseHeaders.get('X-RateLimit-Remaining')
   const limitResetHeader = responseHeaders.get('X-RateLimit-Reset')

   if (limitRemainingHeader !== null) {
      requestLimitRemaining = parseInt(limitRemainingHeader, 10)
   }
   if (limitResetHeader !== null) {
      requestLimitReset = new Date(limitResetHeader).getTime()
   }
}
async function waitForLimitReset() {
   if (requestLimitRemaining !== null && requestLimitRemaining > 0) {
      return
   }

   const now = Date.now()
   const waitMs = requestLimitReset - now

   if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
   }
}

// Todoist - GET = get all Due Tasks
async function getTodoistTasks() {
   const response = await fetch(todoistUrl, {
      method: 'GET',
      headers: todoistHeaders,
   })

   if (response.ok) {
      const data = await response.json()
      return data
   } else {
      console.error('Todoist API error:', response.status, response.statusText)
   }
}

// Todoist - POST = get all checked off Tasks
async function getCompletedTodoistTasks() {
   const response = await fetch(
      'https://api.todoist.com/sync/v9/completed/get_all',
      {
         method: 'POST',
         headers: todoistHeaders,
         body: JSON.stringify({ resource_types: ['items'] }),
      }
   )

   if (response.ok) {
      const data = await response.json()
      return data.items
   } else {
      console.error('Todoist API error:', response.status, response.statusText)
   }
}

// Habitica - GET = Get all Due Tasks
async function getHabiticaTasks() {
   await waitForLimitReset()
   const response = await fetch(`${habiticaTasksUrl}`, {
      method: 'GET',
      headers: habiticaHeaders,
   })

   if (response.ok) {
      updateRateLimit(response.headers)
      const data = await response.json()
      return data.data
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

// Habitica - POST = mark a task as complete
async function markComplete(task) {
   await waitForLimitReset()
   const response = await fetch(
      `https://habitica.com/api/v3/tasks/${task.id}/score/up`,
      {
         method: 'POST',
         headers: habiticaHeaders,
      }
   )

   if (response.ok) {
      updateRateLimit(response.headers)

      return { success: true }
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

// Habitica - Post = Create a Task
async function addHabiticaTasks(tasks) {
   await waitForLimitReset()
   const priorityArray = [0.1, 1, 1.5, 2]
   // Difficulty, options are 0.1, 1, 1.5, 2; equivalent of Trivial, Easy, Medium, Hard.

   const body = []
   for (const task of tasks) {
      body.push({
         text: task.content,
         type: 'todo',
         tags: ['fd988064-d94b-4494-8a21-172eac28009b'],
         priority: priorityArray[task.priority - 1],
         notes: task.id,
      })
   }

   const response = await fetch(`https://habitica.com/api/v3/tasks/user`, {
      method: 'POST',
      headers: habiticaHeaders,
      body: JSON.stringify(body),
   })
   if (response.ok) {
      updateRateLimit(response.headers)
      console.log(response)
      const data = await response.json()
      return data
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
      console.log(response)
   }
}

// Habitica - PUT = Update a Tasks
async function updateHabiticaTasks(task) {
   await waitForLimitReset()
   const response = await fetch(`${updateHabiticaTaskUrl}/${task.id}`, {
      method: 'PUT',
      headers: habiticaHeaders,
      body: JSON.stringify({ text: task.text }),
   })

   if (response.ok) {
      updateRateLimit(response.headers)
      const data = await response.json()
      return data.data
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
      console.log('response:', response)
   }
}

// Habitica - GET = Todoist Tag on Habitica
async function getHabiticaTag(name = TODOIST_TAG) {
   await waitForLimitReset()
   if (todoistTag) {
      return todoistTag
   }

   const response = await fetch(habiticaTagsUrl, {
      method: 'GET',
      headers: habiticaHeaders,
   })

   if (response.ok) {
      updateRateLimit(response.headers)

      const data = await response.json()
      const tags = data.data
      todoistTag = tags.find((tag) => tag.name === name)

      return todoistTag
   } else {
      console.log('Error fetching Habitica tasks:', response.statusText)
   }
}

// Habitica - Get all Habitica task that is connected to Todoiest Task's
async function getHabiticaTodoistTasks() {
   todoistTag = await getHabiticaTag()
   const tasks = await getHabiticaTasks()

   // Filter out habitica task that don't have the todiest tag.
   const habiticaTasks = tasks.filter((task) =>
      task.tags.some((tag) => tag === todoistTag.id) ? true : false
   )

   return habiticaTasks
}

async function run() {
   // Action Stacks
   const addToHabiticaStack = []
   const updateHabiticaStack = []
   const markCompleteHabiticaStack = []

   // Get H Todo Tasks
   const habiticaDueTasks = await getHabiticaTodoistTasks()
   const HabiticaDueTasksObj = habiticaDueTasks.reduce((acc, task) => {
      acc[task.notes] = task
      return acc
   }, {})

   // Get T Todo Task for Completed and Un-completed
   const uncompleted = await getTodoistTasks()
   const completed = await getCompletedTodoistTasks()

   // For completed task, check them off on Habitica
   for (const task of completed) {
      const { task_id: id } = task
      const habiticaTask = HabiticaDueTasksObj[id]

      if (habiticaTask) {
         markCompleteHabiticaStack.push(habiticaTask)
      }
   }

   for (const task of uncompleted) {
      // Does it Need to be Created on Habitica?
      if (!HabiticaDueTasksObj[task.id]) {
         addToHabiticaStack.push(task)
      }
      // Does the task need to be updated on Habitica.
      else if (task.content !== HabiticaDueTasksObj[task.id].text) {
         updateHabiticaStack.push({
            id: HabiticaDueTasksObj[task.id].id,
            text: task.content,
         })
      }
   }

   //--// Do updates on habitica
   // Add Task to Haitica
   if (addToHabiticaStack.length > 0) {
      await addHabiticaTasks(addToHabiticaStack)
   }
   // Mark Haitica Taslk as completed
   for (const task of markCompleteHabiticaStack) {
      await markComplete(task)
   }
   // synce task text/content from Todoist task to Habitica task
   for (const task of updateHabiticaStack) {
      await updateHabiticaTasks(task)
   }
}

run()
