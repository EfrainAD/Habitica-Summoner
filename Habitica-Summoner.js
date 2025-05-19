require('dotenv').config()

const TODOIST_TAG = 'Todoist'

// ENV - Habitica Auth
const habiticaUserId = process.env.HABITICA_USER_ID
const habiticaApiToken = process.env.HABITICA_API_TOKEN
const HabiticaXClient = process.env.HABITICA_X_CLIENT
// ENV - Todoist Auth
const todoistApiKey = process.env.TODOIST_API_KEY

function logError(response) {
   console.log('Error fetching Habitica tasks:', response.statusText)
   console.log('Errors array:', response.errors)
   console.log('response', response)
}

function createHabiticaRateLimiter() {
   let requestLimitRemaining = null
   let requestLimitReset = null

   function update(responseHeaders) {
      const limitRemainingHeader = responseHeaders.get('X-RateLimit-Remaining')
      const limitResetHeader = responseHeaders.get('X-RateLimit-Reset')

      if (limitRemainingHeader !== null) {
         requestLimitRemaining = parseInt(limitRemainingHeader, 10)
      }
      if (limitResetHeader !== null) {
         requestLimitReset = new Date(limitResetHeader).getTime()
      }
   }
   async function wait() {
      if (requestLimitRemaining !== null && requestLimitRemaining > 0) {
         return
      }

      const now = Date.now()
      const waitMs = requestLimitReset - now

      if (waitMs > 0) {
         await new Promise((resolve) => setTimeout(resolve, waitMs))
      }
   }
   return { update, wait }
}

function createTodoistApi() {
   const todoistHeaders = {
      Authorization: `Bearer ${todoistApiKey}`,
      'Content-Type': 'application/json',
   }
   const todoistUrls = {
      getTask: (id) => `https://api.todoist.com/rest/v2/tasks/${id}`,
      getUncompletedTasks: `https://api.todoist.com/rest/v2/tasks`,
      getCompletedTasks: 'https://api.todoist.com/sync/v9/completed/get_all',
   }

   // Todoist - GET = get all Due Tasks
   async function getTodoistTasks() {
      const response = await fetch(todoistUrls.getUncompletedTasks, {
         method: 'GET',
         headers: todoistHeaders,
      })

      if (response.ok) {
         const data = await response.json()
         return data
      } else {
         console.error(
            'Todoist API error:',
            response.status,
            response.statusText
         )
      }
   }

   // Todoist - GET = get a Task
   async function getTodoistTask(id) {
      const response = await fetch(todoistUrls.getTask(id), {
         method: 'GET',
         headers: todoistHeaders,
      })

      if (response.ok) {
         const data = await response.json()
         return data
      } else {
         console.error(
            'Todoist API error:',
            response.status,
            response.statusText
         )
      }
   }

   // Todoist - POST = get all checked off Tasks
   async function getCompletedTodoistTasks() {
      const response = await fetch(todoistUrls.getCompletedTasks, {
         method: 'POST',
         headers: todoistHeaders,
         body: JSON.stringify({ resource_types: ['items'] }),
      })

      if (response.ok) {
         const data = await response.json()
         return data.items
      } else {
         console.error(
            'Todoist API error:',
            response.status,
            response.statusText
         )
      }
   }

   return {
      getTodoistTask,
      getTodoistTasks,
      getCompletedTodoistTasks,
   }
}

function createHabiticaApi() {
   const base = 'https://habitica.com/api/v3'
   const habiticaHeaders = {
      'x-api-user': habiticaUserId,
      'x-api-key': habiticaApiToken,
      'x-client': HabiticaXClient,
      'Content-Type': 'application/json',
   }
   const rateLimiter = createHabiticaRateLimiter()
   let todoistTag = null

   // Habitica API URL
   const habiticaUrls = {
      getTasks: `${base}/tasks/user?type=todos`,
      updateTask: (taskId) => `${base}/tasks/${taskId}`,
      addTasks: `${base}/tasks/user`,
      getTags: `${base}/tags`,
      markTaskComplete: (taskId) => `${base}/tasks/${taskId}/score/up`,
      deleteTask: (taskId) => `${base}/tasks/${taskId}`,
   }

   // Habitica - GET = Get all Due Tasks
   async function getTasks() {
      await rateLimiter.wait()
      const response = await fetch(habiticaUrls.getTasks, {
         method: 'GET',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         rateLimiter.update(response.headers)
         const data = await response.json()
         return data.data
      } else {
         logError(response)
      }
   }

   // Habitica - POST = mark a task as complete
   async function markComplete(task) {
      await rateLimiter.wait()
      const response = await fetch(habiticaUrls.markTaskComplete(task.id), {
         method: 'POST',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         rateLimiter.update(response.headers)

         return { success: true }
      } else {
         logError(response)
      }
   }

   // Habitica - DELETE = delete a task
   async function deleteTask(task) {
      await rateLimiter.wait()
      const response = await fetch(habiticaUrls.deleteTask(task.id), {
         method: 'DELETE',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         rateLimiter.update(response.headers)

         return { success: true }
      } else {
         logError(response)
      }
   }

   // Difficulty, options are 0.1, 1, 1.5, 2;
   // equivalent of Trivial, Easy, Medium, Hard.
   function convertPriority(priority) {
      return [0.1, 1, 1.5, 2][priority - 1]
   }

   // Habitica - Post = Create a Task
   async function addTasks(tasks) {
      await rateLimiter.wait()

      const body = []
      for (const task of tasks) {
         body.push({
            text: task.content,
            type: 'todo',
            tags: ['fd988064-d94b-4494-8a21-172eac28009b'],
            priority: convertPriority(task.priority),
            notes: task.id,
         })
      }

      const response = await fetch(habiticaUrls.addTasks, {
         method: 'POST',
         headers: habiticaHeaders,
         body: JSON.stringify(body),
      })
      if (response.ok) {
         rateLimiter.update(response.headers)

         const data = await response.json()
         return data.data
      } else {
         logError(response)
      }
   }

   // Habitica - PUT = Update a Tasks
   async function updateTasks(task) {
      await rateLimiter.wait()
      const response = await fetch(habiticaUrls.updateTask(task.id), {
         method: 'PUT',
         headers: habiticaHeaders,
         body: JSON.stringify({ text: task.text }),
      })

      if (response.ok) {
         rateLimiter.update(response.headers)
         const data = await response.json()
         return data.data
      } else {
         logError(response)
      }
   }

   // Habitica - GET = Todoist Tag on Habitica
   async function getTag(name = TODOIST_TAG) {
      if (todoistTag) {
         return todoistTag
      }

      await rateLimiter.wait()

      const response = await fetch(habiticaUrls.getTags, {
         method: 'GET',
         headers: habiticaHeaders,
      })

      if (response.ok) {
         rateLimiter.update(response.headers)

         const data = await response.json()
         const tags = data.data
         todoistTag = tags.find((tag) => tag.name === name)

         return todoistTag
      } else {
         logError(response)
      }
   }

   return {
      getTasks,
      markComplete,
      deleteTask,
      addTasks,
      updateTasks,
      getTag,
      convertPriority,
   }
}

// Habitica - Get all Habitica task that is connected to Todoiest Task's
async function getHabiticaTodoistTasks(habiticaApi) {
   const todoistTag = await habiticaApi.getTag()
   const tasks = await habiticaApi.getTasks()

   // Filter out habitica task that don't have the todiest tag.
   const habiticaTasks = tasks.filter((task) =>
      task.tags.some((tag) => tag === todoistTag.id) ? true : false
   )

   return habiticaTasks
}

// Tasks Todoist id is used to track/map tasks
const indexById = {
   habitica: function (habiticaTasks) {
      return habiticaTasks.reduce((acc, task) => {
         acc[task.notes] = task
         return acc
      }, {})
   },
   todoist: function (todoistTasks) {
      return todoistTasks.reduce((acc, task) => {
         acc[task.id] = task
         return acc
      }, {})
   },
}

async function run() {
   const habiticaApi = createHabiticaApi()
   const todoistApi = createTodoistApi()

   const tasksToAddToHabitica = []

   // Fetch the tasks from Habitica & Todoist
   const habiticaDueTasks = await getHabiticaTodoistTasks(habiticaApi)
   const uncompleted = await todoistApi.getTodoistTasks()
   const completed = await todoistApi.getCompletedTodoistTasks()

   // Create Maps for Habitica task and Todoiest Tasks
   const HabiticaDueTasksMap = indexById.habitica(habiticaDueTasks)
   const uncompletedMap = indexById.todoist(uncompleted)

   // For completed task, mark them off as completed in Habitica
   for (const task of completed) {
      const { task_id: id } = task
      const habiticaTask = HabiticaDueTasksMap[id]

      if (habiticaTask) {
         const success = await habiticaApi.markComplete(habiticaTask)
         if (success)
            console.log(
               `Task Marked Completed: id: ${habiticaTask.id}, text: ${habiticaTask.text}`
            )
      }
   }

   for (const task of uncompleted) {
      const habiticaTask = HabiticaDueTasksMap[task.id]

      // Does it Need to be Created on Habitica? (Send as one api request)
      if (!habiticaTask) {
         tasksToAddToHabitica.push(task)
      }
      // Does the task need to be updated on Habitica.
      else if (task.content !== habiticaTask.text) {
         const updatedTask = await habiticaApi.updateTasks({
            id: HabiticaDueTasksMap[task.id].id,
            text: task.content,
         })

         if (updatedTask)
            console.log(
               `Task Updated: id: ${updatedTask.id}, ${habiticaTask.text} TO ${updatedTask.text}`
            )
      }
   }

   // Find the Habitica Task that need to be removed & Delete them
   for (const task of habiticaDueTasks) {
      const todoistTask = uncompletedMap[task.notes]

      if (!todoistTask) {
         const success = await habiticaApi.deleteTask(task)
         if (success)
            console.log(`Task Deleted: id: ${task.id}, text: ${task.text}`)
      }
   }

   // Add Task to Habitica
   if (tasksToAddToHabitica.length > 0) {
      const data = await habiticaApi.addTasks(tasksToAddToHabitica)
      if (data) {
         console.log('Tasks added:', data)
      }
   }
}

run()
