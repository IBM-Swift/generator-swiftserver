import LoggerAPI

func initializeSwaggerRoute(path swaggerPath: String) {
    // Host swagger definition
    router.get("/explorer/swagger.yml") { request, response, next in
        do {
            try response.send(fileName: swaggerPath).end()
        } catch {
            Log.error("Failed to serve OpenAPI Swagger definition from \(swaggerPath)")
        }
    }
}
