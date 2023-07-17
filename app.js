const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let db = null;
let dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
// scenario 1 return all todos status= to do
//scenario 2 return all todos whose priority = high
//scenario 3 return all todos whose priority=high and status = in progress
//scenario 4 return all todos whose todo contains search_q=html
const hasPriorityAndHasStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndHasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE 
            '%${search_q}%' AND 
            priority='${priority}' AND status='${status}'`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE 
            '%${search_q}%' AND 
            priority='${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE 
            '%${search_q}%' AND 
            status='${status}'`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE 
            '%${search_q}%'`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2 specific todo based on todo Id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3 post a todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createTodoQuery = `INSERT INTO todo (id,todo,priority,status) 
    VALUES('${id}','${todo}','${priority}','${status}')`;
  const createdTodo = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 update a todo based on id
const todoChange = (updatedKey) => {
  return updatedKey.todo !== undefined;
};
const priorityChange = (updatedKey) => {
  return updatedKey.priority !== undefined;
};
const statusChange = (updatedKey) => {
  return updatedKey.status !== undefined;
};
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let data = null;
  let updatedColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;
  const newUpdatedQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
    status='${status}' WHERE id=${todoId}`;
  const updatedTodo = await db.run(newUpdatedQuery);
  response.send(`${updatedColumn} Updated`);
});

//API 5 delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE  FROM todo WHERE id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
