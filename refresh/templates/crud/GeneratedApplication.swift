import Foundation
import Kitura
import Configuration

public class GeneratedApplication {
    public let router: Router
    private let manager: ConfigurationManager
    private let factory: AdapterFactory

    public init(configURL: URL) throws {
        router = Router()
        manager = try ConfigurationManager()
                          .load(.environmentVariables)
                          .load(url: configURL)
        factory = AdapterFactory(manager: manager)

        <%_ models.forEach(function(model) { _%>
        try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
        <%_ }); _%>
    }
}
