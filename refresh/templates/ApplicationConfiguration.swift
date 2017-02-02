import Foundation
import LoggerAPI
import SwiftyJSON
import CouchDB
import Configuration

public enum AdapterConfiguration: CustomStringConvertible {
    case memory
    case cloudant(ConnectionProperties)

    // NOTE: By default the associated values are included in the
    // description which could reveal passwords. This cumbersome
    // switch is the only reliable way I have found to return the
    // adapter name. This broad approach is compatible with translating
    // the adapter names into other languages.
    public var description: String {
        switch self {
        case .memory: return "memory"
        case .cloudant: return "cloudant"
        }
    }
}

public struct ApplicationConfiguration {
    public static let defaultPort: Int = 8090;
    public var port: Int
    public var adapterConfig: AdapterConfiguration

    public let manager = ConfigurationManager()

    public init() {
        port = ApplicationConfiguration.defaultPort
        adapterConfig = .memory
    }
    
    public init(configURL: URL) throws {
       
       do {
         try manager.load(url: configURL) 
       } catch {
          throw ConfigurationError.urlNotFound(url: configURL.absoluteString);
       }

       port = manager["port"] as? Int ?? ApplicationConfiguration.defaultPort

       let store1 = manager["store"] as? String
       let store2 = manager["store:type"] as? String
       let storeName = store1 ?? store2 ?? "memory"
 
       switch storeName {
       case "memory":
         adapterConfig = .memory
       case "cloudant":
         adapterConfig = .cloudant(ConnectionProperties(
            host:     ((manager["store:host"] as? String) ?? "localhost"),
            port:     ((manager["store:port"] as? Int16) ?? 5984),
            secured:  ((manager["store:secured"] as? Bool) ?? false),
            username: ((manager["store:username"] as? String) ?? nil),
            password: ((manager["store:password"] as? String) ?? nil)
         ))
         // TODO: Need to add type mismatch checks
       default:
         // TODO throw ConfigurationError?
         adapterConfig = .memory
       }
  }
}

public enum ConfigurationError: Error {
    case urlNotFound(url: String)

    public func defaultMessage() -> String {
        switch self {
        case let .urlNotFound(url):
            return "URL not found '\(url)'"
        }
    }
}
