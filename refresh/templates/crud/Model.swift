import SwiftyJSON

public struct <%- model.classname %> {
    <%_ propertyInfos.forEach(function(info) { _%>
    public let <%- info.name %>: <%- info.swiftType %>
    <%_ }); _%>

    public init(<%- propertyInfos.map((info) => `${info.name}: ${info.swiftType}`).join(', ') %>) {
        <%_ propertyInfos.forEach(function(info) { _%>
        self.<%- info.name %> = <%- info.name %>
        <%_ }); _%>
    }

    public init(json: JSON) throws {
        // Required properties
        <%_ propertyInfos.filter((info) => !info.optional).forEach(function(info) { _%>
        guard json["<%- info.name %>"].exists() else {
            throw ModelError.requiredPropertyMissing(name: "<%- info.name %>")
        }
        guard let <%- info.name %> = json["<%- info.name %>"].<%- info.swiftyJSONType %> else {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
            <%_ if (info.jsType === 'number') { _%>
        self.<%- info.name %> = Double(<%- info.name %>)
            <%_ } else { _%>
        self.<%- info.name %> = <%- info.name %>
            <%_ } _%>
        <%_ }); _%>

        // Optional properties
        <%_ propertyInfos.filter((info) => info.optional).forEach(function(info) { _%>
            <%_ var defaultValueClause = ''; _%>
            <%_ if (typeof(model.properties[info.name].default) !== 'undefined') { _%>
                <%_ var swiftDefaultLiteral = helpers.convertJSDefaultValueToSwift(model.properties[info.name].default); _%>
                <%_ defaultValueClause = ' ?? ' + swiftDefaultLiteral; _%>
            <%_ } _%>
        if json["<%- info.name %>"].exists() &&
           json["<%- info.name %>"].type != .<%- info.swiftyJSONType %> {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
            <%_ if (info.jsType === 'number') { _%>
        self.<%- info.name %> = json["<%- info.name %>"].number.map { Double($0) }<%- defaultValueClause %>
            <%_ } else { _%>
        self.<%- info.name %> = json["<%- info.name %>"].<%- info.swiftyJSONProperty %><%- defaultValueClause %>
            <%_ } _%>
        <%_ }); _%>

        // Check for extraneous properties
        if let jsonProperties = json.dictionary?.keys {
            let properties: [String] = [<%- propertyInfos.map((info) => `"${info.name}"`).join(', ') %>]
            for jsonPropertyName in jsonProperties {
                if !properties.contains(where: { $0 == jsonPropertyName }) {
                    throw ModelError.extraneousProperty(name: jsonPropertyName)
                }
            }
        }
    }

    public func settingID(_ newId: String?) -> <%- model.classname %> {
      <% var args = (['id: newId'].concat(propertyInfos.filter((info) => info.name !== 'id').map((info) => `${info.name}: ${info.name}`))).join(', ')
      %>return <%- model.classname %>(<%- args %>)
    }

    public func updatingWith(json: JSON) throws -> <%- model.classname %> {
        <%_ propertyInfos.forEach(function(info) { _%>
        if json["<%- info.name %>"].exists() &&
           json["<%- info.name %>"].type != .<%- info.swiftyJSONType %> {
            throw ModelError.propertyTypeMismatch(name: "<%- info.name %>", type: "<%- info.jsType %>", value: json["<%- info.name %>"].description, valueType: String(describing: json["<%- info.name %>"].type))
        }
            <%_ if (info.jsType === 'number') { _%>
        let <%- info.name %> = json["<%- info.name %>"].number.map { Double($0) } ?? self.<%- info.name %>
            <%_ } else { _%>
        let <%- info.name %> = json["<%- info.name %>"].<%- info.swiftyJSONProperty %> ?? self.<%- info.name %>
            <%_ } _%>

        <%_ }); _%>
        return <%- model.classname %>(<%- propertyInfos.map((info) => `${info.name}: ${info.name}`).join(', ') %>)
    }

    public func toJSON() -> JSON {
        var result = JSON([
            <%_ propertyInfos.filter((info) => !info.optional).forEach(function(info) { _%>
            "<%- info.name %>": JSON(<%- info.name %>),
            <%_ }); _%>
        ])
        <%_ propertyInfos.filter((info) => info.optional).forEach(function(info) { _%>
        if let <%- info.name %> = <%- info.name %> {
            result["<%- info.name %>"] = JSON(<%- info.name %>)
        }
        <%_ }); _%>

        return result
    }
}
