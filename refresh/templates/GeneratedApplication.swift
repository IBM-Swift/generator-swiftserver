import Foundation
import Kitura

public class GeneratedApplication {
    public let router: Router
    private let factory: AdapterFactory

    public init(config: ApplicationConfiguration) {
        router = Router()
        factory = AdapterFactory(config: config)
        <% models.forEach(function(model) { %>
        <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
        <% }); %>
    }
}
