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

// Habitica API URL
const habiticaBaseUrl = 'https://habitica.com/api/v3'

const habiticaTasksUrl = `${habiticaBaseUrl}/tasks/user?type=todos`
const updateHabiticaTaskUrl = (taskId) => `${habiticaBaseUrl}/tasks/${taskId}`
const addHabiticaTasksUrl = `${habiticaBaseUrl}/tasks/user`
const habiticaTagsUrl = `${habiticaBaseUrl}/tags`
const markCompleteUrl = (taskId) =>
   `${habiticaBaseUrl}/tasks/${taskId}/score/up`
const deleteUrl = (taskId) => `${habiticaBaseUrl}/tasks/${taskId}`

// Todoist API URL Calls
const todoistGetTasksUrl = `https://api.todoist.com/rest/v2/tasks`
const getCompletedTodoistTasksUrl =
   'https://api.todoist.com/sync/v9/completed/get_all'

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

// Todoist - GET = get all Due Tasks
async function getTodoistTasks() {
   const response = await fetch(todoistGetTasksUrl, {
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
   const response = await fetch(getCompletedTodoistTasksUrl, {
      method: 'POST',
      headers: todoistHeaders,
      body: JSON.stringify({ resource_types: ['items'] }),
   })

   if (response.ok) {
      const data = await response.json()
      return data.items
   } else {
      console.error('Todoist API error:', response.status, response.statusText)
   }
}

function createHabiticaApi() {
   // Util functions
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

   // Habitica - GET = Get all Due Tasks
   async function getTasks() {
      await waitForLimitReset()
      const response = await fetch(habiticaTasksUrl, {
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
      const response = await fetch(markCompleteUrl(task.id), {
         method: 'POST',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         updateRateLimit(response.headers)

         return { success: true }
      } else {
         console.log('Error fetching Habitica tasks:', response.statusText)
      }
   }

   // Habitica - DELETE = delete a task
   async function deleteTask(task) {
      await waitForLimitReset()
      const response = await fetch(deleteUrl(task.id), {
         method: 'DELETE',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         updateRateLimit(response.headers)

         return { success: true }
      } else {
         console.log('Error fetching Habitica tasks:', response.statusText)
      }
   }

   // Habitica - Post = Create a Task
   async function addTasks(tasks) {
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

      const response = await fetch(addHabiticaTasksUrl, {
         method: 'POST',
         headers: habiticaHeaders,
         body: JSON.stringify(body),
      })
      if (response.ok) {
         updateRateLimit(response.headers)

         const data = await response.json()
         return data
      } else {
         console.log('Error fetching Habitica tasks:', response.statusText)
      }
   }

   // Habitica - PUT = Update a Tasks
   async function updateTasks(task) {
      await waitForLimitReset()
      const response = await fetch(updateHabiticaTaskUrl(task.id), {
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
      }
   }

   // Habitica - GET = Todoist Tag on Habitica
   async function getTag(name = TODOIST_TAG) {
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

   return {
      getTasks,
      markComplete,
      deleteTask,
      addTasks,
      updateTasks,
      getTag,
   }
}

// Habitica - Get all Habitica task that is connected to Todoiest Task's
async function getHabiticaTodoistTasks(habiticaApi) {
   todoistTag = await habiticaApi.getTag()
   const tasks = await habiticaApi.getTasks()

   // Filter out habitica task that don't have the todiest tag.
   const habiticaTasks = tasks.filter((task) =>
      task.tags.some((tag) => tag === todoistTag.id) ? true : false
   )

   return habiticaTasks
}

function objectfyH(habiticaDueTasks) {
   return habiticaDueTasks.reduce((acc, task) => {
      acc[task.notes] = task
      return acc
   }, {})
}

async function run() {
   const habiticaApi = createHabiticaApi()
   // Action Stacks
   const addToHabiticaStack = []
   const updateHabiticaStack = []
   const removeHabiticaStack = []
   const markCompleteHabiticaStack = []

   // Get H Todo Tasks
   const habiticaDueTasks = await getHabiticaTodoistTasks(habiticaApi)
   const HabiticaDueTasksObj = objectfyH(habiticaDueTasks)

   // Get T Todo Task for Completed and Un-completed
   const uncompleted = await getTodoistTasks()
   const completed = await getCompletedTodoistTasks()
   const uncompletedObj = uncompleted.reduce((acc, task) => {
      acc[task.id] = task
      return acc
   }, {})

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

   // Find the Habitica Task that need to be removed
   for (const task of habiticaDueTasks) {
      if (!uncompletedObj[task.notes]) {
         removeHabiticaStack.push(task)
      }
   }

   //--// Do updates on habitica
   // Add Task to Haitica
   if (addToHabiticaStack.length > 0) {
      await habiticaApi.addTasks(addToHabiticaStack)
   }
   // Mark Haitica Taslk as completed
   for (const task of markCompleteHabiticaStack) {
      await habiticaApi.markComplete(task)
   }
   // Delete Task on Habitica of task that are no longer on Todoiest (That have not been completed.)
   for (const task of removeHabiticaStack) {
      await habiticaApi.deleteTask(task)
   }
   // synce task text/content from Todoist task to Habitica task
   for (const task of updateHabiticaStack) {
      await habiticaApi.updateTasks(task)
   }
}

run()
