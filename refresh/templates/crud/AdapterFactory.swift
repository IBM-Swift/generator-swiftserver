import Foundation
import CouchDB
import Configuration
<% if(bluemix) {-%>
import CloudFoundryConfig
<% } -%>

public class AdapterFactory {
    let manager: ConfigurationManager

    init(manager: ConfigurationManager) {
        self.manager = manager
    }

<% models.forEach(function(model) { -%>
    public func get<%- model.classname %>Adapter() throws -> <%- model.classname %>Adapter {
<% if (crudService.type === 'cloudant') { -%>
<% if (bluemix) { -%>
      let service = try manager.getCloudantService(name: "<%- crudService.service.name %>")
      return <%- model.classname %>CloudantAdapter(ConnectionProperties(
          host:     service.host,
          port:     Int16(service.port),
          secured:  true, // FIXME Fix CloudConfiguration
          username: service.username,
          password: service.password
      ))
<% } else { -%>
      // TODO fix optionals here
      // TODO checking on values
      let service = try getCloudantConfig(name: "<%- crudService.service.name %>")
      return <%- model.classname %>CloudantAdapter(ConnectionProperties(
          host:     service["host"] as? String ?? "localhost",
          port:     service["port"] as? Int16 ?? 5984,
          secured:  service["secured"] as? Bool ?? false,
          username: service["username"] as? String ?? nil,
          password: service["password"] as? String ?? nil
      ))
<% } -%>
<% } -%>
<% if (crudService.type === '__memory__') { -%>
      return <%- model.classname %>MemoryAdapter()
<% } -%>
    }
<% }); -%>

  struct ConfigError: Error {}
  func getCloudantConfig(name: String) throws -> [String: Any] {
    let cloudantServices = manager["services:cloudant"] as? [[String:Any]] ?? []
    guard let result = cloudantServices.first(where: { $0["name"] as? String == name }) else {
      throw ConfigError()
    }
    return result
  }
}
