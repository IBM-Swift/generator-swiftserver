import Foundation

public class <%- model.classname %>MemoryAdapter: <%- model.classname %>Adapter {
    var items: [String:<%- model.classname %>] = [:]

    public func findAll(onCompletion: ([<%- model.classname %>], Error?) -> Void) {
        onCompletion(items.map { $1 }, nil)
    }

    public func create(_ model: <%- model.classname %>, onCompletion: (<%- model.classname %>, Error?) -> Void) {
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
}
