# dbStreamListener
DBStreamListener
Overview
DBStreamListener is a Node.js application designed to listen to MongoDB database streams and capture operations made on a specific collection. It processes these operations separately, offering a high-performance solution for monitoring and reacting to database changes in real-time. This tool is ideal for scenarios where you need to watch all entries made to a particular collection and perform specific actions based on those changes. DBStreamListener can also be run as a separate service, making it versatile for various use cases.

Features
Real-time Listening: Captures operations (insert, update, delete) on a specific MongoDB collection as they happen. <br>
High Performance: Processes database changes quickly and efficiently. <br>
Easy to Use: Simple configuration and setup. <br>
Versatile: Can be run as a standalone service. <br>
Custom Processing: Allows for custom processing of each database change event. <br>

How to run the project: <br>
Add these variables in the .env file
```
ENV=development
DB_CONNECTION_URL=mongodb://localhost:27017/<database_name> //give the db url
```

If database is password protected, either add it in the url , or add it as a seperate env variable ( check config code for more info)

Then run the script using the command `node runScript.js dbStreamListener` 

Now go to the database, and insert a document into samplemodels collection, and you will see the information coming in the logs.

Modify the sample model according to your usecase.


