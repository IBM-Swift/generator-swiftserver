let mongoDBService = try manager.getMongoDBService(name: "<%- serviceDef.name %>")
server = Server(service: mongoDBService)
