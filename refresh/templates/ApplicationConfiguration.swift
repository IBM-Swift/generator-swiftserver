import Foundation
import LoggerAPI
import SwiftyJSON
import CouchDB
import Configuration
import CloudFoundryConfig

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
    // Only on couch
    //internal let database: Database

    //public init() {
    //    port = ApplicationConfiguration.defaultPort
    //    adapterConfig = .memory
    //}

    // Do we default to default Port here when on bluemix?
    public init() {
      port = ApplicationConfiguration.defaultPort
      adapterConfig = .memory
    }   

    // If on bluemix we should load the environment variables first
    public init(configURL: URL) throws {

       do {
         try manager.load(.environmentVariables)
                    .load(url: configURL)
       } catch {
          throw ConfigurationError.urlNotFound(url: configURL.absoluteString);
       }

       // where is the port going to be set as it's not currently in the VCAP_SERVICES? is it in the bluemix env?
       port = manager["port"] as? Int ?? ApplicationConfiguration.defaultPort

       let storeName = "cloudant"

       switch storeName {
       case "memory":
         adapterConfig = .memory
       case "cloudant":
         
         guard let cruddatastore = manager["cruddatastore"] as? String else {
           throw ConfigurationError.noCrudDataStoreSpecified
         } 
         print("cruddatastore is: ", cruddatastore)

         let cloudantService = try manager.getCloudantService(name: cruddatastore) 

         print("cloudantService.host: ", cloudantService.host)
         print("cloudantService.port: ", cloudantService.port)
         print("cloudantService.username: ", cloudantService.username)
         print("cloudantService.password: ", cloudantService.password)

         adapterConfig = .cloudant(ConnectionProperties(
           host:     cloudantService.host,
           port:     Int16(cloudantService.port),
           secured:  true, // FIXME
           username: cloudantService.username,
           password: cloudantService.password
         ))
         
         // TODO: Need to add type mismatch checks
       default:
         // TODO throw ConfigurationError?
         adapterConfig = .memory
       }
  }
}

    
//    public init(configURL: URL) throws {
//       
//       do {
//         try manager.load(url: configURL) 
//       } catch {
//          throw ConfigurationError.urlNotFound(url: configURL.absoluteString);
//       }
//
//       port = manager["port"] as? Int ?? ApplicationConfiguration.defaultPort
//
//       let store1 = manager["store"] as? String
//       let store2 = manager["store:type"] as? String
//       let storeName = store1 ?? store2 ?? "memory"
// 
//       switch storeName {
//       case "memory":
//         adapterConfig = .memory
//       case "cloudant":
//         adapterConfig = .cloudant(ConnectionProperties(
//            host:     ((manager["store:host"] as? String) ?? "localhost"),
//            port:     ((manager["store:port"] as? Int16) ?? 5984),
//            secured:  ((manager["store:secured"] as? Bool) ?? false),
//            username: ((manager["store:username"] as? String) ?? nil),
//            password: ((manager["store:password"] as? String) ?? nil)
//         ))
//         // TODO: Need to add type mismatch checks
//       default:
//         // TODO throw ConfigurationError?
//         adapterConfig = .memory
//       }
//  }
//}

public enum ConfigurationError: Error {
    case urlNotFound(url: String)
    case noCrudDataStoreSpecified

    public func defaultMessage() -> String {
        switch self {
        case let .urlNotFound(url):
            return "URL not found '\(url)'"
        case .noCrudDataStoreSpecified:
            return "No cruddatastore defined. This is required by CRUD application types."
        }
    }
}

