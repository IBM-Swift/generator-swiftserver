import SwiftyJSON

public enum ModelError: Error {
    case requiredPropertyMissing(name: String)
    case extraneousProperty(name: String)
    case propertyTypeMismatch(name: String, type: String, value: String, valueType: String)
    func defaultMessage() -> String {
        switch self {
        case let .requiredPropertyMissing(name): return "Required property \(name) not provided"
        case let .extraneousProperty(name):      return "Property \(name) not found"
        case let .propertyTypeMismatch(name, type, value, valueType):
            return "Provided value (\(value)) for property '\(name)' has type (\(valueType))" +
                   " which is not compatible with the property type (\(type))"
        }
    }
}

public struct <%- model.classname %> {
    <% propertyInfos.forEach(function(info) {
      %>public let <%- info.name %>: <%- info.swiftType %>
    <% }); %>

    public init(<%- propertyInfos.map((info) => `${info.name}: ${info.swiftType}`).join(', ') %>) {
        <% propertyInfos.forEach(function(info) {
          %>self.<%- info.name %> = <%- info.name %>
        <% }); %>
    }

    public init(json: JSON) throws {
        // Required properties
        <% propertyInfos.filter((info) => !info.optional).forEach(function(info) {
      %>guard json["<%- info.name %>"].exists() else {
            throw ModelError.requiredPropertyMissing(name: "<%- info.name %>")
        }
        guard let <%- info.name %> = json["<%- info.name %>"].<%- info.jsType %> else {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
        <% if (info.jsType === 'number') {
      %>self.<%- info.name %> = Double(<%- info.name %>)
        <% } else {
      %>self.<%- info.name %> = <%- info.name %>
        <% } %>
        <% }); %>
        // Optional properties
        <% propertyInfos.filter((info) => info.optional).forEach(function(info) {
      %>if json["<%- info.name %>"].exists() &&
           json["<%- info.name %>"].type != .<%- info.jsType %> {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
        <% if (info.jsType === 'number') {
      %>self.<%- info.name %> = json["<%- info.name %>"].number.map { Double($0) }
        <% } else {
      %>self.<%- info.name %> = json["<%- info.name %>"].<%- info.jsType %>
        <% } %>
        <% }); %>
    }

    public func settingID(_ newId: String?) -> <%- model.classname %> {
        return <%- model.classname %>(id: newId, <%- propertyInfos.filter((info) => info.name !== 'id').map((info) => `${info.name}: ${info.name}`).join(', ') %>)
    }

    public func updatingWith(json: JSON) throws -> <%- model.classname %> {
        <% propertyInfos.forEach(function(info) {
      %>if json["<%- info.name %>"].exists() &&
           json["<%- info.name %>"].type != .<%- info.jsType %> {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
        <% if (info.jsType === 'number') {
      %>let <%- info.name %> = json["<%- info.name %>"].number.map { Double($0) } ?? self.<%- info.name %>
        <% } else {
      %>let <%- info.name %> = json["<%- info.name %>"].<%- info.jsType %> ?? self.<%- info.name %>
        <% } %>
        <% }); %>
        return <%- model.classname %>(<%- propertyInfos.map((info) => `${info.name}: ${info.name}`).join(', ') %>)
    }

    public func toJSON() -> JSON {
        var result = JSON([
            <% propertyInfos.filter((info) => !info.optional).forEach(function(info) {
              %>"<%- info.name %>": JSON(<%- info.name %>),
            <% }); %>
        ])
        <% propertyInfos.filter((info) => info.optional).forEach(function(info) {
          %>if let <%- info.name %> = <%- info.name %> {
                result["<%- info.name %>"] = JSON(<%- info.name %>)
            }
        <% }); %>
        return result
    }
}
