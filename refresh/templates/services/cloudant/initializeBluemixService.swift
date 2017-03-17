    let cloudantService = try manager.getCloudantService(name: "<%- service.name %>")
    couchDBClient = CouchDBClient(service: cloudantService)
