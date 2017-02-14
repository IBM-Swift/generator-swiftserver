import Foundation
import CouchDB
import KituraNet
import SwiftyJSON
import CloudFoundryConfig // Not needed unless on bluemix

public class <%- model.classname %>CloudantAdapter: <%- model.classname %>Adapter {
    let client: CouchDBClient
    var database: Database {
        // TODO: Properly ensure database exists
        client.createDB("<%- model.classname.toLowerCase() %>") { _, _ in }
        return client.database("<%- model.classname.toLowerCase() %>")
    }

    public init(_ connectionProperties: ConnectionProperties) {
        client = CouchDBClient(connectionProperties: connectionProperties)
    }

    public init(_ service: CloudantService) {
        client = CouchDBClient(service: service)
    }

    public func findAll(onCompletion: @escaping ([<%- model.classname %>], Swift.Error?) -> Void) {
        database.retrieveAll(includeDocuments: true) { maybeDocuments, error in
            if let error = error {
                if error.code == Database.InternalError {
                    onCompletion([], AdapterError.unavailable(error.localizedDescription))
                } else {
                    onCompletion([], AdapterError.internalError(error.localizedDescription))
                }
                return
            }

            guard let documents = maybeDocuments?["rows"] else {
                onCompletion([], AdapterError.internalError("No data in response from Kitura-CouchDB"))
                return
            }

            do {
                let models = try documents.map { _, document -> <%- model.classname %> in
                    guard let docid = document["id"].string else {
                        let message = (document["id"].exists() ? "Unexpected type for" : "Missing")
                        throw AdapterError.internalError("\(message) docid in document")
                    }
                    guard document["doc"].exists() else {
                        throw AdapterError.internalError("Missing document content")
                    }
                    let model = try <%- model.classname %>(json: document["doc"])
                    return model.settingID(docid)
                }
                onCompletion(models, nil)
            } catch {
                onCompletion([], AdapterError.internalError(String(describing: error)))
            }
        }
    }

    public func create(_ model: <%- model.classname %>, onCompletion: @escaping (<%- model.classname %>?, Swift.Error?) -> Void) {
        database.create(model.toJSON()) { _, rev, maybeDocument, error in
            if let error = error {
                switch error.code {
                case Database.InternalError:
                    onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                case HTTPStatusCode.conflict.rawValue where model.id != nil:
                    // TODO: Are there other kinds of conflicts we need to check for?
                    onCompletion(nil, AdapterError.idConflict(model.id!))
                default:
                    onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                }
                return
            }

            guard let document = maybeDocument else {
                onCompletion(nil, AdapterError.internalError("No data in response from Kitura-CouchDB"))
                return
            }

            guard let docid = document["id"].string else {
                let message = (document["id"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) docid in document"))
                return
            }

            let storedModel = model.settingID(docid)
            onCompletion(storedModel, nil)
        }
    }

    public func deleteAll(onCompletion: @escaping (Swift.Error?) -> Void) {
        client.deleteDB("<%- model.classname.toLowerCase() %>") { error in
            if let error = error, error.code != HTTPStatusCode.notFound.rawValue {
                onCompletion(AdapterError.internalError(error.localizedDescription))
            } else {
                onCompletion(nil)
            }
        }
    }

    public func findOne(_ maybeID: String?, onCompletion: @escaping (<%- model.classname %>?, Swift.Error?) -> Void) {
        guard let id = maybeID else {
            return onCompletion(nil, AdapterError.invalidId(maybeID))
        }
        database.retrieve(id) { maybeDocument, error in
            if let error = error {
                switch error.code {
                case HTTPStatusCode.notFound.rawValue:
                    onCompletion(nil, AdapterError.notFound(id))
                case Database.InternalError:
                    onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                default:
                    onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                }
                return
            }

            guard let document = maybeDocument else {
                onCompletion(nil, AdapterError.internalError("No data in response from Kitura-CouchDB"))
                return
            }

            guard let docid = document["_id"].string else {
                let message = (document["_id"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) docid in document"))
                return
            }

            do {
                let model = try <%- model.classname %>(json: document)
                onCompletion(model.settingID(docid), nil)
            } catch {
                onCompletion(nil, AdapterError.internalError(String(describing: error)))
            }
        }
    }

    public func update(_ maybeID: String?, with model: <%- model.classname %>, onCompletion: @escaping (<%- model.classname %>?, Swift.Error?) -> Void) {
        guard let id = maybeID else {
            return onCompletion(nil, AdapterError.invalidId(maybeID))
        }
        database.retrieve(id) { maybeDocument, error in
            if let error = error {
                switch error.code {
                case HTTPStatusCode.notFound.rawValue:
                    onCompletion(nil, AdapterError.notFound(id))
                case Database.InternalError:
                    onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                default:
                    onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                }
                return
            }

            guard let document = maybeDocument else {
                onCompletion(nil, AdapterError.internalError("No data in response from Kitura-CouchDB"))
                return
            }

            guard let docid = document["_id"].string else {
                let message = (document["_id"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) docid in document"))
                return
            }

            guard let rev = document["_rev"].string else {
                let message = (document["_rev"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) rev in document"))
                return
            }

            let json = model.settingID(nil).toJSON()
            self.database.update(docid, rev: rev, document: json) { _, _, error in //updatedRev, maybeDocument, error in
                if let error = error {
                    switch error.code {
                    case HTTPStatusCode.notFound.rawValue:
                        onCompletion(nil, AdapterError.notFound(id))
                    case HTTPStatusCode.conflict.rawValue:
                        // TODO Check for stale revision
                        onCompletion(nil, AdapterError.idConflict(id))
                    case Database.InternalError:
                        onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                    default:
                        onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                    }
                    return
                }

                onCompletion(model.settingID(docid), nil)
            }
        }
    }

    public func delete(_ maybeID: String?, onCompletion: @escaping (<%- model.classname %>?, Swift.Error?) -> Void) {
        guard let id = maybeID else {
            return onCompletion(nil, AdapterError.invalidId(maybeID))
        }
        database.retrieve(id) { maybeDocument, error in
            if let error = error {
                switch error.code {
                case HTTPStatusCode.notFound.rawValue:
                    onCompletion(nil, AdapterError.notFound(id))
                case Database.InternalError:
                    onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                default:
                    onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                }
                return
            }

            guard let document = maybeDocument else {
                onCompletion(nil, AdapterError.internalError("No data in response from Kitura-CouchDB"))
                return
            }

            guard let docid = document["_id"].string else {
                let message = (document["_id"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) docid in document"))
                return
            }

            guard let rev = document["_rev"].string else {
                let message = (document["_rev"].exists() ? "Unexpected type for" : "Missing")
                onCompletion(nil, AdapterError.internalError("\(message) rev in document"))
                return
            }

            self.database.delete(docid, rev: rev, failOnNotFound: true) { error in
                if let error = error {
                    switch error.code {
                    case HTTPStatusCode.notFound.rawValue:
                        onCompletion(nil, AdapterError.notFound(docid))
                    case HTTPStatusCode.conflict.rawValue:
                        // should we retry?
                        onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                    case Database.InternalError:
                        onCompletion(nil, AdapterError.unavailable(error.localizedDescription))
                    default:
                        onCompletion(nil, AdapterError.internalError(error.localizedDescription))
                    }
                    return
                }
                do {
                    let model = try <%- model.classname %>(json: document)
                    onCompletion(model.settingID(docid), nil)
                } catch {
                    onCompletion(nil, AdapterError.internalError(String(describing: error)))
                }
            }
        }
    }
}
