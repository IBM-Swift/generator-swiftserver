import LoggerAPI

func initializeErrorRoutes(app: App) {
    app.router.all { request, response, _ in
        if response.statusCode == .unknown {
            let path = request.urlURL.path
            if path != "/" && path != "" {
                try response.status(.notFound).redirect("/404.html")
            }
        }
    }
}
