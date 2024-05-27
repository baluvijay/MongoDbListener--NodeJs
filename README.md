# dbStreamListener
DBStreamListener
Overview
DBStreamListener is a Node.js application designed to listen to MongoDB database streams and capture operations made on a specific collection. It processes these operations separately, offering a high-performance solution for monitoring and reacting to database changes in real-time. This tool is ideal for scenarios where you need to watch a particular collection and take actions depending on the operations done on it.
It can be run as a seperate service in a cluster.

Features
Real-time Listening: Captures operations (insert, update, delete) on a specific MongoDB collection as they happen. <br>
High Performance: Processes database changes quickly and efficiently. <br>
Easy to Use: Simple configuration and setup. <br>
Versatile: Can be run as a standalone service. <br>
Custom Processing: Allows for custom processing of each database change event. <br>

How to run the project: <br>
Step1 : Create and add these variables in the .env file
```
ENV=development
DB_CONNECTION_URL=mongodb://localhost:27017/<database_name> //give the db url
```
If database is password protected, either add it in the url , or add it as a seperate env variable ( check config code for more info)

Step2: Run the script using the command `node runScript.js dbStreamListener` 

Now go to the database, and insert a document into samplemodels collection, and you will see the information coming in the logs.
Modify the sample model according to your usecase.

In this project,we are only logging the data coming in the dataReceiver.js file. But you can do your postProcessing like make an apiCall/insert data into another collection and other things there.<br>
If you want to change the model, replace sampleModel collection with the new model and make the changes in the dataAdder.js collection.
You can also add multiple models and push those info into the array to make it work.




