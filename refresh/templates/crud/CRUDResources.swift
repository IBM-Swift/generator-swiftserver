import Kitura
import Configuration

public func initializeCRUDResources(manager: ConfigurationManager, router: Router) throws {
<% if (models.length > 0) { -%>
    let factory = AdapterFactory(manager: manager)
<%   models.forEach(function(model) { -%>
    try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
<%   }); -%>
<% } -%>
}
