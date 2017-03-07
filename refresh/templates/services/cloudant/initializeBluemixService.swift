let cloudantService = try manager.getCloudantService(name: "<%- service.name %>")
let dbClient = CouchDBClient(service: cloudantService)
