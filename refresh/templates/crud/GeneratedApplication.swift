import Foundation
import Kitura
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

        <%_ models.forEach(function(model) { _%>
        try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
        <%_ }); _%>
    }
}
