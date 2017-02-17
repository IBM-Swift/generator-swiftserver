import Foundation
import LoggerAPI
import SwiftyJSON

public struct ApplicationConfiguration {
    public static let defaultPort: Int = 8090;
    public var port: Int

    public init(configURL: URL) throws {
        self.init(json: JSON(data: try Data(contentsOf: configURL)))
    }

    public init(json: JSON?) {
        guard let json = json else {
            port = ApplicationConfiguration.defaultPort
            return
        }
        port = json["port"].int ?? ApplicationConfiguration.defaultPort
    }
}

public enum ConfigurationError: Error {
  case urlNotFound(url: String)

  public func defaultMessage() -> String {
    switch (self) {
    case let .urlNotFound(url):
      return "URL not found '\(url)'"
    }
  }
}
