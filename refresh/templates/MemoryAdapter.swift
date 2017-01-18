import Foundation

public enum AdapterError: Error {
    case invalidId(String?)
    case notFound(String)
    case unavailable(String)
}

public class <%- model.classname %>MemoryAdapter: <%- model.classname %>Adapter {
    var items: [String:<%- model.classname %>] = [:]

    public func findAll(onCompletion: ([<%- model.classname %>], Error?) -> Void) {
        onCompletion(items.map { $1 }, nil)
    }

    public func create(_ model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void) {
        let id = model.id ?? UUID().uuidString
        // TODO: Don't overwrite if id already exists
        let storedModel = model.settingId(id)
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
        guard let result = items[id] else {
            return onCompletion(nil, AdapterError.notFound(id))
        }
        onCompletion(result, nil)
    }
}
