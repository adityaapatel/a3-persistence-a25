const http = require("http"),
      fs   = require("fs"),
      mime = require("mime"),
      dir  = "public/",
      port = 3000

// bucket list data
const appdata = [
  { title: "See Northern Lights", category: "Travel", priority: "high", targetDate: "2025-12-31", addedAt: "2025-09-01", daysLeft: 120 },
  { title: "Try sushi in Tokyo", category: "Food", priority: "medium", targetDate: "2025-11-01", addedAt: "2025-09-01", daysLeft: 60 }
]

// keys for validation
const properties = Object.keys(appdata[0])

// days left calc
function calcDaysLeft(targetDate) {
  if (!targetDate) return null
  const today = new Date()
  const target = new Date(targetDate)
  today.setHours(0,0,0,0)
  target.setHours(0,0,0,0)
  return Math.round((target - today) / 86400000)
}

const server = http.createServer(function(request, response) {
  if (request.method === "GET") {
    handleGet(request, response)
  } else if (request.method === "POST") {
    handlePost(request, response)
  } else if (request.method === "DELETE") {
    handleDelete(request, response)
  } else if (request.method === "PUT") {
    handlePut(request, response)
  }
})

// GET: files or data
const handleGet = function(request, response) {
  const filename = dir + request.url.slice(1)

  if (request.url === "/") {
    sendFile(response, "public/index.html")
  }
  else if (request.url === "/results") {
    response.writeHead(200, "OK", { "Content-Type": "application/json" })
    response.end(JSON.stringify(appdata))
  }
  else {
    sendFile(response, filename)
  }
}

// POST: add item
const handlePost = function(request, response) {
  let dataString = ""

  request.on("data", function(data) {
    dataString += data
  })

  request.on("end", function() {
    try {
      const data = JSON.parse(dataString)
      if (correctDataFormat(data)) {
        const daysLeft = data.targetDate ? calcDaysLeft(data.targetDate) : null
        const newRow = {
          title: data.title,
          category: data.category,
          priority: data.priority,
          targetDate: data.targetDate,
          addedAt: new Date().toISOString().slice(0,10),
          daysLeft: daysLeft
        }
        appdata.push(newRow)
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify(newRow))
      } else {
        response.writeHead(400)
        response.end("Bad data")
      }
    } catch(e) {
      response.writeHead(400)
      response.end("Invalid JSON")
    }
  })
}

// DELETE: remove by index
const handleDelete = function(request, response) {
  let dataString = ""

  request.on("data", function(data) {
    dataString += data
  })

  request.on("end", function() {
    try {
      const body = JSON.parse(dataString)
      if ("row" in body && body.row < appdata.length) {
        appdata.splice(body.row, 1)
        response.writeHead(200)
        response.end("Deleted")
      } else {
        response.writeHead(400)
        response.end("Invalid row")
      }
    } catch(err) {
      response.writeHead(400)
      response.end("Invalid JSON")
    }
  })
}

// PUT: mark as completed
const handlePut = function(request, response) {
  let dataString = ""
  request.on("data", function(data) {
    dataString += data
  })
  request.on("end", function() {
    try {
      const body = JSON.parse(dataString)
      if ("row" in body && body.row < appdata.length) {
        appdata[body.row].completed = true
        response.writeHead(200)
        response.end("Marked completed")
      } else {
        response.writeHead(400)
        response.end("Invalid row")
      }
    } catch (err) {
      response.writeHead(400)
      response.end("Invalid JSON")
    }
  })
}

// static file
const sendFile = function(response, filename) {
  const type = mime.getType(filename)
  fs.readFile(filename, function(err, content) {
    if (err === null) {
      response.writeHeader(200, { "Content-Type": type })
      response.end(content)
    } else {
      response.writeHeader(404)
      response.end("404 Error: File Not Found")
    }
  })
}
// check keys
const correctDataFormat = (data) => {
  try {
    const required = ["title", "category", "priority", "targetDate"];
    return required.every(k => k in data);
  } catch (e) {
    return false;
  }
}
server.listen( process.env.PORT || port )
