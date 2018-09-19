import SwiftyJSON

public struct {{model.classname}} {
    {{#each propertyInfos}}
    public let {{name}}: {{swiftType}}
    {{/each}}

    public init({{#each propertyInfos}} {{name}}: {{swiftType}}, {{/each}} {
        {{#each propertyInfos}}
        self.{{name}} = {{name}}
        {{/each}}
    }

    public init(json: JSON) throws {
        // Required properties
        {{#each infoFilter}}
        guard json["{{name}}"].exists() else {
            throw ModelError.requiredPropertyMissing(name: "{{name}}")
        }
        guard let {{name}} = json["{{name}}"].{{swiftyJSONType}} else {
            throw ModelError.propertyTypeMismatch(name: "{{name}}", type: "{{jsType}}", value: json["{{name}}"].description, valueType: String(describing: json["{{name}}"].type))
        }
            {{#ifCond jsType '===' 'number'}}
        self.{{name}} = Double({{name}})
            {{else}}
        self.{{name}} = {{name}}
            {{/ifCond}}
        {{/each}}

        {{#optionalProperties propertyInfos, helpers, model}}
        {{/optionalProperties}}

        // Check for extraneous properties
        if let jsonProperties = json.dictionary?.keys {
            let properties: [String] = [{{#propertyMapping propertyInfos}}]
            for jsonPropertyName in jsonProperties {
                if !properties.contains(where: { $0 == jsonPropertyName }) {
                    throw ModelError.extraneousProperty(name: jsonPropertyName)
                }
            }
        }
    }

    public func settingID(_ newId: String?) -> {{model.classname}} {
      {{#settingID propertyInfos args model}}
      {{/settingID}}
    }

    public func updatingWith(json: JSON) throws -> {{model.classname}} {
        {{#each propertyInfos}}
        if json["{{name}}"].exists() &&
           json["{{name}}"].type != .{{swiftyJSONType}} {
            throw ModelError.propertyTypeMismatch(name: "{{name}}", type: "{{jsType}}", value: json["{{name}}"].description, valueType: String(describing: json["{{name}}"].type))
        }
            {{#ifCond jsType '===' 'number'}}
        let {{name}} = json["{{name}}"].number.map { Double($0) } ?? self.{{name}}
            {{else}}
        let {{name}} = json["{{name}}"].{{swiftyJSONProperty}} ?? self.{{name}}
            {{/ifCond}}

        {{/each}}
        return {{model.classname}}({{#each propertyInfos}} {{name}}: {name}}, {{/each}})
    }

    public func toJSON() -> JSON {
        var result = JSON([:])
        {{each infoFilter}}
        result["{{name}}"] = JSON({{name}})
        {{/each}}
        {{each infoFilter}}
        if let {{name}} = {{name}} {
            result["{{name}}"] = JSON({{name}})
        }
        {{/each}}

        return result
    }
}
