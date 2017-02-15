import Kitura

public func initializeIndex() {

    router.get("/") { request, response, next in
        response.status(.OK).send("")
        next()
    }

}
