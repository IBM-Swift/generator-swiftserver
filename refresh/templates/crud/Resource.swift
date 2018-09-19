import Kitura
import LoggerAPI
import SwiftyJSON

public class {{model.classname}}Resource {
    private let adapter: {{model.classname}}Adapter
    private let path = "/api/{{model.plural}}"
    private let pathWithID = "/api/{{model.plural}}/:id"

    init(factory: AdapterFactory) throws {
        adapter = try factory.get{{model.classname}}Adapter()
    }

    func setupRoutes(router: Router) {
        router.all("/*", middleware: BodyParser())

        router.get(path, handler: handleIndex)
        router.post(path, handler: handleCreate)
        router.delete(path, handler: handleDeleteAll)

        router.get(pathWithID, handler: handleRead)
        router.put(pathWithID, handler: handleReplace)
        router.patch(pathWithID, handler: handleUpdate)
        router.delete(pathWithID, handler: handleDelete)
    }

    private func handleIndex(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("GET \(path)")
        // TODO: offset and limit
        adapter.findAll() { models, error in
            if let error = error {
                // TODO: Send error object?
                Log.error("InternalServerError during handleIndex: \(error)")
                response.status(.internalServerError)
            } else {
                response.send(models.map { $0.toJSON().description })
            }
            next()
        }
    }

    private func handleCreate(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("POST \(path)")
        guard let contentType = request.headers["Content-Type"],
              contentType.hasPrefix("application/json") else {
            response.status(.unsupportedMediaType)
            response.send([ "error": "Request Content-Type must be application/json" ])
            return next()
        }
        guard case .json(let json)? = request.body else {
            response.status(.badRequest)
            response.send([ "error": "Request body could not be parsed as JSON" ])
            return next()
        }
        do {
            let model = try {{model.classname}}(json: JSON(json))
            adapter.create(model) { storedModel, error in
                if let error = error {
                    // TODO: Handle model errors (eg id conflict)
                    Log.error("InternalServerError during handleCreate: \(error)")
                    response.status(.internalServerError)
                } else {
                    response.send(storedModel!.toJSON().description)
                }
                next()
            }
        } catch let error as ModelError {
            response.status(.unprocessableEntity)
            response.send([ "error": error.defaultMessage() ])
            next()
        } catch {
            Log.error("InternalServerError during handleCreate: \(error)")
            response.status(.internalServerError)
            next()
        }
    }

    private func handleDeleteAll(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("DELETE \(path)")
        adapter.deleteAll() { error in
            if let error = error {
                Log.error("InternalServerError during handleDeleteAll: \(error)")
                response.status(.internalServerError)
            } else {
                response.send("[]")
            }
            next()
        }
    }

    private func handleRead(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
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
                response.send(model!.toJSON().description)
            }
            next()
        }
    }

    private func handleReplace(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("PUT \(pathWithID)")
        guard let contentType = request.headers["Content-Type"],
              contentType.hasPrefix("application/json") else {
            response.status(.unsupportedMediaType)
            response.send([ "error": "Request Content-Type must be application/json" ])
            return next()
        }
        guard case .json(let json)? = request.body else {
            response.status(.badRequest)
            response.send([ "error": "Request body could not be parsed as JSON" ])
            return next()
        }
        do {
            let model = try {{model.classname}}(json: JSON(json))
            adapter.update(request.parameters["id"], with: model) { storedModel, error in
                if let error = error {
                    switch error {
                    case AdapterError.notFound:
                        response.status(.notFound)
                    case AdapterError.idConflict(let id):
                        response.status(.conflict)
                        response.send([ "error": "Cannot update id to a value that already exists (\(id))" ])
                    default:
                        Log.error("InternalServerError during handleCreate: \(error)")
                        response.status(.internalServerError)
                    }
                } else {
                    response.send(storedModel!.toJSON().description)
                }
                next()
            }
        } catch let error as ModelError {
            response.status(.unprocessableEntity)
            response.send([ "error": error.defaultMessage() ])
            next()
        } catch {
            Log.error("InternalServerError during handleReplace: \(error)")
            response.status(.internalServerError)
            next()
        }
    }

    private func handleUpdate(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("PATCH \(pathWithID)")
        guard let contentType = request.headers["Content-Type"],
              contentType.hasPrefix("application/json") else {
            response.status(.unsupportedMediaType)
            response.send([ "error": "Request Content-Type must be application/json" ])
            return next()
        }
        guard case .json(let json)? = request.body else {
            response.status(.badRequest)
            response.send([ "error": "Request body could not be parsed as JSON" ])
            return next()
        }
        adapter.findOne(request.parameters["id"]) { model, error in
            if let error = error {
                switch error {
                case AdapterError.notFound:
                    response.status(.notFound)
                default:
                    response.status(.internalServerError)
                }
                return next()
            }
            do {
                let updatedModel = try model!.updatingWith(json: JSON(json))
                self.adapter.update(request.parameters["id"], with: updatedModel) { storedModel, error in
                    if let error = error {
                        switch error {
                        case AdapterError.notFound:
                            response.status(.notFound)
                        case AdapterError.idConflict(let id):
                            response.status(.conflict)
                            response.send([ "error": "Cannot update id to a value that already exists (\(id))" ])
                        default:
                            Log.error("InternalServerError during handleUpdate: \(error)")
                            response.status(.internalServerError)
                        }
                    } else {
                        response.send(storedModel!.toJSON().description)
                    }
                    next()
                }
            } catch let error as ModelError {
                response.status(.unprocessableEntity)
                response.send([ "error": error.defaultMessage() ])
                next()
            } catch {
                Log.error("InternalServerError during handleUpdate: \(error)")
                response.status(.internalServerError)
                next()
            }
        }
    }

    private func handleDelete(request: RouterRequest, response: RouterResponse, next: @escaping () -> Void) {
        Log.debug("DELETE \(pathWithID)")
        adapter.delete(request.parameters["id"]) { model, error in
            if let error = error {
                switch error {
                case AdapterError.notFound:
                    response.send([ "count": 0 ])
                default:
                    response.status(.internalServerError)
                }
            } else {
                response.send([ "count": 1] )
            }
            next()
        }
    }
}
