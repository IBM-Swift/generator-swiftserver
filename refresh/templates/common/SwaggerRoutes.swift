import LoggerAPI

func initializeSwaggerRoutes(path swaggerPath: String) {
    // Host swagger definition
    router.get("/swagger/api") { request, response, next in
        do {
            try response.send(fileName: swaggerPath).end()
        } catch {
            Log.error("Failed to serve OpenAPI Swagger definition from \(swaggerPath)")
        }
    }
}
