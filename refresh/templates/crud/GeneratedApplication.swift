import Foundation
import Kitura
import Configuration

public class GeneratedApplication {
    public let router: Router
    private let factory: AdapterFactory

    public init(configURL: URL) throws {
        router = Router()
        let manager = ConfigurationManager()
        do {
          try manager.load(.environmentVariables)
                     .load(url: configURL)
        } catch {
           throw ConfigurationError.urlNotFound(url: configURL.absoluteString);
        }
        factory = AdapterFactory(manager: manager)

        <%_ models.forEach(function(model) { _%>
        try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
        <%_ }); _%>
    }
}
