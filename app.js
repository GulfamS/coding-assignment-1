const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const checkRequestQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryValues = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInList = categoryValues.includes(category)

    if (categoryIsInList === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityValues = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInList = priorityValues.includes(priority)

    if (priorityIsInList === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusValues = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInList = statusValues.includes(status)

    if (statusIsInList === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'Valid')
      if (isValidDate === true) {
        request.date = formatDate
      } else {
        response.satus(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkRequestBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryValues = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInList = categoryValues.includes(category)

    if (categoryIsInList === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityValues = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInList = priorityValues.includes(priority)

    if (priorityIsInList === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusValues = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInList = statusValues.includes(status)

    if (statusIsInList === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatDate)
      const result = toDate(new Date(formatDate))
      const isValidDate = isValid(result)
      console.log(isValidDate)
      console.log(isValidDate)

      if (isValidDate === true) {
        request.dueDate = formatDate
      } else {
        response.satus(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id
  request.todoId = todoId
  next()
}

//API 1 Return list of all todo whose statu is TO DO
app.get('/todos/', checkRequestQueries, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request
  console.log(status, search_q, priority, category)

  const getTodosQuery = `
        SELECT 
          id, todo, priority, status, category, due_date AS dueDate
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}$%' AND priority = '%${priority}%' AND status = '%${status}%' AND category = '%${category}%';
    `
  const todosList = await db.all(getTodosQuery)
  response.send(todosList)
})

//API 2 Return a specific todo based on todoID
app.get('/todos/:todoId/', checkRequestQueries, async (request, response) => {
  const {todoId} = request
  const getTodoQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate
        FROM todo
        WHERE id = ${todoId};
    `
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

//API 3 Return all todos with specific due date
app.get('/agenda/', checkRequestQueries, async (request, response) => {
  const {date} = request
  console.log(date, 'a')
  const getDueDateQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate
        FROM 
          todo
        WHERE 
          due_date = ${date};
    `
  const todosArray = await db.all(getDueDateQuery)

  if (todosArray === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todosArray)
  }
})

//API 4 Create a todo in todo table
app.post('/todos/', checkRequestBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const addTodoQuery = `
      INSERT INTO 
        todo (id, todo, priority, status, category, due_date)
      VALUES 
        (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${dueDate}'
        );
  `
  const createUser = await db.run(addTodoQuery)
  console.log(createUser)
  response.send('Todo Successfully Added')
})

//API 5 Update details of specific todo
app.put('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request
  const {priority, todo, status, dueDate, category} = request

  let updateTodoQuery = null

  console.log(priority, todo, status, category, dueDate)

  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE 
              todo
            SET 
              status = '${status}'
            WHERE id = ${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      updateTodoQuery = `
        UPDATE 
          todo
        SET 
          priority = '${priority}'
        WHERE id = ${todoId};
      `
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
      break
    case todo !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId};
      `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case category !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET category = '${category}'
        WHERE id = ${todoId};
      `
      await db.run(updateTodoQuery)
      response.send('Category Updated')
      break
    case dueDate !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET due_date = '${dueDate}'
        WHERE id = ${todoId};
      `
      await db.run(updateTodoQuery)
      response.send('Due Date Updated')
      break
  }
})

//API 6 Delete todo api
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
      DELETE FROM 
        todo
      WHERE id = ${todoId};
    `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
