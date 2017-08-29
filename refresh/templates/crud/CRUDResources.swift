import Kitura
import CloudEnvironment

public func initializeCRUDResources(cloudEnv: CloudEnv, router: Router) throws {
<% if (models.length > 0) { -%>
    let factory = AdapterFactory(cloudEnv: cloudEnv)
<%   models.forEach(function(model) { -%>
    try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
<%   }); -%>
<% } -%>
}
