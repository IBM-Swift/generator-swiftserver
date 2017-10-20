import LoggerAPI

func initializeSwaggerRoutes(app: App) {
    // Host swagger definition
    app.router.get("/swagger/api") { request, response, next in
        do {
            try response.send(fileName: app.swaggerPath).end()
        } catch {
            Log.error("Failed to serve OpenAPI Swagger definition from \(app.swaggerPath)")
        }
    }
}
