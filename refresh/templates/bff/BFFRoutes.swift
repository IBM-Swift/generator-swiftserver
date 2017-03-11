import Kitura
import SwiftyJSON

func initializeBFFRoutes() {

    router.get("/products") { request, response, next in
        response.send(json: [:])
        next()
    }

    router.post("/products") { request, response, next in
        response.send(json: [:])
        next()
    }

    router.get("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }

    router.put("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }

    router.delete("/product/:id") { request, response, next in
        response.send(json: [:])
        next()
    }

}
