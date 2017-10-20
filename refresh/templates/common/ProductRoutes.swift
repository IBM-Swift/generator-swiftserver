import Kitura
import SwiftyJSON

func initializeProductRoutes(app: App) {

    app.router.get("/products") { request, response, next in
        response.send(json: [:])
        next()
    }

    app.router.post("/products") { request, response, next in
        response.send(json: [:])
        next()
    }

    app.router.get("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }

    app.router.put("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }

    app.router.delete("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }
}
