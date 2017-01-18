public protocol <%- model.classname %>Adapter {
    func findAll(onCompletion: ([<%- model.classname %>], Error?) -> Void)
    func create(_ model: <%- model.classname %>, onCompletion: (<%- model.classname %>?, Error?) -> Void)
    func deleteAll(onCompletion: (Error?) -> Void)

    func findOne(_ maybeID: String?, onCompletion: (<%- model.classname %>?, Error?) -> Void)
}
