    let service = try manager.getWatsonConversationervice(name: "<%- service.name %>")

    if let creds = service.credentials {
        if let username = creds["username"] as? String,
            let password = creds["password"] as? String {

                let version = "<%- service.version %>"
                let workspaceID: String = "temp-workspaceID" 
            
                conversation = Conversation(username: username, password: password, version: version)
        
                conversation!.message(withWorkspace: workspaceID, failure: failure) { response in
                    print(response.output.text)
                    context = response.context
            } 
        }
    }

