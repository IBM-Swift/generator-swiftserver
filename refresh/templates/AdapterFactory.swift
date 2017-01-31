import CouchDB

public class AdapterFactory {
    let config: ApplicationConfiguration

    init(config: ApplicationConfiguration) {
        self.config = config
    }

    <% models.forEach(function(model) { -%>
    public func get<%- model.classname %>Adapter() -> <%- model.classname %>Adapter {
        switch self.config.adapterConfig {
        case .memory: return <%- model.classname %>MemoryAdapter()
        case .cloudant(let properties): return <%- model.classname %>CloudantAdapter(properties)
        }
    }
    <% }); %>
}
