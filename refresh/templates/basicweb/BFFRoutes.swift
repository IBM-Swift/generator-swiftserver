func initializeBFFRoutes() {

    router.get('/', function (req, res) {
        request, response, next in 
        response.send('Hello World!')
        next()
    })

    router.post('/', function (req, res) { 
        request, response, next in 
        response.send('POST request at /')
        next()
    })

    router.put('/', function (req, res) { 
        request, response, next in 
        response.send('PUT request at /')
        next()
    })

    router.delete('/') { 
        request, response, next in 
        response.send('DELETE request at /')
        next()
    })

}
