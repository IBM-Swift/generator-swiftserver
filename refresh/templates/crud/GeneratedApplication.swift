import Foundation
import Kitura
import LoggerAPI
import Configuration
<% if (metrics) { %>
import SwiftMetrics
import SwiftMetricsDash
<% if (autoscale) { -%>
import SwiftMetricsBluemix
<% } -%>
<% } -%>

public class GeneratedApplication {
    public let router: Router
    private let manager: ConfigurationManager
    private let factory: AdapterFactory

    public init(configURL: URL) throws {
        router = Router()
        manager = try ConfigurationManager()
                          .load(url: configURL)
                          .load(.environmentVariables)
<% if (metrics) { -%>
        // Set up monitoring
        let sm = try SwiftMetrics()
        let _ = try SwiftMetricsDash(swiftMetricsInstance : sm, endpoint: router)
<% if (autoscale) { -%>
    let _ = AutoScalar(swiftMetricsInstance: sm)
<% } -%>
<% } -%>

        factory = AdapterFactory(manager: manager)

        // Host swagger definition
        router.get("/explorer/swagger.yml") { request, response, next in
            // TODO(tunniclm): Should probably just pass the root into init()
            let projectRootURL = configURL.deletingLastPathComponent()
            let swaggerFileURL = URL(fileURLWithPath: "definitions/<%- appName %>.yaml",
                                     relativeTo: projectRootURL)
            do {
                try response.send(fileName: swaggerFileURL.path).end()
            } catch {
                Log.error("Failed to serve OpenAPI Swagger definition from \(swaggerFileURL.path)")
            }
        }

        <%_ models.forEach(function(model) { _%>
        try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
        <%_ }); _%>
    }
}
