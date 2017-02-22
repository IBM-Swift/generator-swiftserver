let cloudantService = try manager.getCloudantService(name: "<%= serviceDef.name %>")
let dbClient = CouchDBClient(service: cloudantService)
