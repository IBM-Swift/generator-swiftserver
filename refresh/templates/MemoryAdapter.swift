import Foundation

public class <%- model.classname %>MemoryAdapter: <%- model.classname %>Adapter {
    var items: [String:<%- model.classname %>] = [:]

    public func findAll(onCompletion: ([<%- model.classname %>], Error?) -> Void) {
        onCompletion(items.map { $1 }, nil)
    }

    public func create(_ model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void) {
        let id = model.id ?? UUID().uuidString
        // TODO: Don't overwrite if id already exists
        let storedModel = model.settingID(id)
        items[id] = storedModel
        onCompletion(storedModel, nil)
    }

    public func deleteAll(onCompletion: (Error?) -> Void) {
        items.removeAll()
        onCompletion(nil)
    }

    public func findOne(_ maybeID: String?, onCompletion: (<%- model.classname %>?, Error?) -> Void) {
        guard let id = maybeID else {
            return onCompletion(nil, AdapterError.invalidId(maybeID))
        }
        guard let retrievedModel = items[id] else {
            return onCompletion(nil, AdapterError.notFound(id))
        }
        onCompletion(retrievedModel, nil)
    }

    public func update(_ maybeID: String?, with model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void) {
        delete(maybeID) { _, error in
            if let error = error {
                onCompletion(nil, error)
            } else {
                // NOTE: delete() guarantees maybeID non-nil if error is nil
                let id = maybeID!
                let model = (model.id == nil) ? model.settingID(id) : model
                create(model) { storedModel, error in
                    onCompletion(storedModel, error)
                }
            }
        }
    }

    public func delete(_ maybeID: String?, onCompletion: (<%- model.classname %>?, Error?) -> Void) {
        guard let id = maybeID else {
            return onCompletion(nil, AdapterError.invalidId(maybeID))
        }
        guard let removedModel = items.removeValue(forKey: id) else {
            return onCompletion(nil, AdapterError.notFound(id))
        }
        onCompletion(removedModel, nil)
    }
}
