import Kitura
import LoggerAPI
import SwiftyJSON

public class <%- model.classname %>Resource {
    private let adapter: <%- model.classname %>Adapter
    private let path = "/api/<%- model.plural %>"
    private let pathWithID = "/api/<%- model.plural %>/:id"

    init(factory: AdapterFactory) {
        adapter = factory.get<%- model.classname %>Adapter()
    }

    func setupRoutes(router: Router) {
        router.all("/*", middleware: BodyParser())

        router.get(path, handler: handleIndex)
        router.post(path, handler: handleCreate)
        router.delete(path, handler: handleDeleteAll)

        router.get(pathWithID, handler: handleRead)
        router.put(pathWithID, handler: handleReplace)
        //router.patch(pathWithID, handler: handleUpdate)
        router.delete(pathWithID, handler: handleDelete)
    }

    private func handleIndex(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.info("GET \(path)")
        // TODO: offset and limit
        adapter.findAll() { models, error in
            if let _ = error {
                // TODO: Send error object?
                Log.error("InternalServerError during handleIndex: \(error)")
                response.status(.internalServerError)
            } else {
                response.send(json: JSON(models.map { $0.toJSON() }))
            }
            next()
        }
    }

    private func handleCreate(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.info("POST \(path)")
        guard let contentType = request.headers["Content-Type"],
              contentType.hasPrefix("application/json") else {
            response.status(.unsupportedMediaType)
            response.send(json: JSON([ "error": "Request Content-Type must be application/json" ]))
            return next()
        }
        guard case .json(let json)? = request.body else {
            response.status(.badRequest)
            response.send(json: JSON([ "error": "Request body could not be parsed as JSON" ]))
            return next()
        }
        do {
            let model = try <%- model.classname %>(json: json)
            adapter.create(model) { storedModel, error in
                if let _ = error {
                    // TODO: Handle model errors (eg id conflict)
                    Log.error("InternalServerError during handleCreate: \(error)")
                    response.status(.internalServerError)
                } else {
                    response.send(json: storedModel!.toJSON())
                }
                next()
            }
        } catch let error as ModelError {
            response.status(.unprocessableEntity)
            response.send(json: JSON([ "error": error.defaultMessage() ]))
            next()
        } catch {
            Log.error("InternalServerError during handleCreate: \(error)")
            response.status(.internalServerError)
            next()
        }
    }

    private func handleDeleteAll(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.debug("DELETE \(path)")
        adapter.deleteAll() { error in
            if let _ = error {
                response.status(.internalServerError)
            } else {
                let result = JSON([])
                response.send(json: result)
            }
            next()
        }
    }

    private func handleRead(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.debug("GET \(pathWithID)")
        adapter.findOne(request.parameters["id"]) { model, error in
            if let error = error {
                switch error {
                case AdapterError.notFound:
                    response.status(.notFound)
                default:
                    response.status(.internalServerError)
                }
            } else {
                response.send(json: model!.toJSON())
            }
            next()
        }
    }

    private func handleReplace(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.info("PUT \(pathWithID)")
        guard let contentType = request.headers["Content-Type"],
              contentType.hasPrefix("application/json") else {
            response.status(.unsupportedMediaType)
            response.send(json: JSON([ "error": "Request Content-Type must be application/json" ]))
            return next()
        }
        guard case .json(let json)? = request.body else {
            response.status(.badRequest)
            response.send(json: JSON([ "error": "Request body could not be parsed as JSON" ]))
            return next()
        }
        do {
            let model = try <%- model.classname %>(json: json)
            adapter.update(request.parameters["id"], with: model) { storedModel, error in
                if let error = error {
                    switch error {
                    case AdapterError.notFound:
                        response.status(.notFound)
                    case AdapterError.idConflict(let id):
                        response.status(.conflict)
                        response.send(json: JSON([ "error": "Cannot update id to a value that already exists (\(id))" ]))
                    default:
                        Log.error("InternalServerError during handleCreate: \(error)")
                        response.status(.internalServerError)
                    }
                } else {
                    response.send(json: storedModel!.toJSON())
                }
                next()
            }
        } catch let error as ModelError {
            response.status(.unprocessableEntity)
            response.send(json: JSON([ "error": error.defaultMessage() ]))
            next()
        } catch {
            Log.error("InternalServerError during handleReplace: \(error)")
            response.status(.internalServerError)
            next()
        }
    }

    private func handleDelete(request: RouterRequest, response: RouterResponse, next: () -> Void) {
        Log.debug("DELETE \(pathWithID)")
        adapter.delete(request.parameters["id"]) { model, error in
            if let error = error {
                switch error {
                case AdapterError.notFound:
                    response.send(json: JSON([ "count": 0 ]))
                default:
                    response.status(.internalServerError)
                }
            } else {
                response.send(json: JSON([ "count": 1] ))
            }
            next()
        }
    }
}
