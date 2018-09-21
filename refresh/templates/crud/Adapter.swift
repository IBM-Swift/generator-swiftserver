public protocol {{{model.classname}}}Adapter {
    func findAll(onCompletion: @escaping ([{{{model.classname}}}], Error?) -> Void)
    func create(_ model: {{{model.classname}}}, onCompletion: @escaping ({{{model.classname}}}?, Error?) -> Void)
    func deleteAll(onCompletion: @escaping (Error?) -> Void)

    func findOne(_ maybeID: String?, onCompletion: @escaping ({{{model.classname}}}?, Error?) -> Void)
    func update(_ maybeID: String?, with model: {{model.classname}}, onCompletion: @escaping ({{{model.classname}}}?, Error?) -> Void)
    func delete(_ maybeID: String?, onCompletion: @escaping ({{{model.classname}}}?, Error?) -> Void)
}
