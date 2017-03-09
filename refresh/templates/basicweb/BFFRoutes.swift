import Kitura

func initializeBFFRoutes() {

    router.get("/") {
        request, response, next in 
        response.send("Hello World!")
        next()
    }

    router.post("/") { 
        request, response, next in 
        response.send("POST request at /")
        next()
    }

    router.put("/") { 
        request, response, next in 
        response.send("PUT request at /")
        next()
    }

    router.delete("/") { 
        request, response, next in 
        response.send("DELETE request at /")
        next()
    }

}
