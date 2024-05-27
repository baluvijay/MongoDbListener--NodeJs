# dbStreamListener
DBStreamListener
Overview
DBStreamListener is a Node.js application designed to listen to MongoDB database streams and capture operations made on a specific collection. It processes these operations separately, offering a high-performance solution for monitoring and reacting to database changes in real-time. This tool is ideal for scenarios where you need to watch all entries made to a particular collection and perform specific actions based on those changes. DBStreamListener can also be run as a separate service, making it versatile for various use cases.

Features
Real-time Listening: Captures operations (insert, update, delete) on a specific MongoDB collection as they happen.
High Performance: Processes database changes quickly and efficiently.
Easy to Use: Simple configuration and setup.
Versatile: Can be run as a standalone service.
Custom Processing: Allows for custom processing of each database change event.
Prerequisites
Node.js (version 12 or higher)
MongoDB (version 3.6 or higher) with a replica set enabled
npm (Node Package Manager)
