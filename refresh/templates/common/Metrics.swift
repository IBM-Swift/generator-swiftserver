import SwiftMetrics
import SwiftMetricsDash
import LoggerAPI

var swiftMetrics: SwiftMetrics?
var swiftMetricsDash: SwiftMetricsDash?

func initializeMetrics() {
    do {
      swiftMetrics = try SwiftMetrics()
      swiftMetricsDash = try SwiftMetricsDash(swiftMetricsInstance: swiftMetrics, endpoint: router)
      Log.info("Initialized metrics.")
    } catch {
        Log.warning("Failed to initialize metrics: \(error)")
    }
}
