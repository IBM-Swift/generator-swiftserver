public enum AdapterError: Error {
    case invalidId(String?)
    case notFound(String)
    case idConflict(String)
    case unavailable(String)
}

public protocol <%- model.classname %>Adapter {
    func findAll(onCompletion: ([<%- model.classname %>], Error?) -> Void)
    func create(_ model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void)
    func deleteAll(onCompletion: (Error?) -> Void)

    func findOne(_ maybeID: String?, onCompletion: (<%- model.classname %>?, Error?) -> Void)
    func update(_ maybeID: String?, with model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void)
    func delete(_ maybeID: String?, onCompletion: (<%- model.classname %>?, Error?) -> Void)
}
