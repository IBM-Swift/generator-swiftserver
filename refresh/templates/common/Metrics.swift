import SwiftMetrics
import SwiftMetricsDash
import LoggerAPI

var swiftMetrics: SwiftMetrics?
var swiftMetricsDash: SwiftMetricsDash?

func initializeMetrics() {
    do {
        let metrics = try SwiftMetrics()
        let dashboard = try SwiftMetricsDash(swiftMetricsInstance: metrics, endpoint: router)

        swiftMetrics = metrics
        swiftMetricsDash = dashboard
        Log.info("Initialized metrics.")
    } catch {
        Log.warning("Failed to initialize metrics: \(error)")
    }
}
