    let mongoDBService = try manager.getMongoDBService(name: "<%- service.name %>")
    server = Server(service: mongoDBService)
