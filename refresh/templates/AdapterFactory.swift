public class AdapterFactory {
    <% models.forEach(function(model) { %>
    public func get<%- model.classname %>Adapter() -> <%- model.classname %>Adapter {
        return <%- model.classname %>MemoryAdapter()
    }
    <% }); %>
}

