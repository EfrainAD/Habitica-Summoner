require('dotenv').config()

// Get values from the .env file
const habiticaUserId = process.env.HABITICA_USER_ID
const habiticaApiToken = process.env.HABITICA_API_TOKEN
const HabiticaXClient = process.env.HABITICA_X_CLIENT

// Set up Habitica API
const habiticaStatusURL = 'https://habitica.com/api/v3/status'
const habiticaTaskURL = 'https://habitica.com/api/v3/tasks/user?type=todos'
const habiticaUrl = habiticaTaskURL

const habiticaHeaders = {
   'x-api-user': habiticaUserId,
   'x-api-key': habiticaApiToken,
   'x-client': HabiticaXClient,
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

getHabiticaTasks()
