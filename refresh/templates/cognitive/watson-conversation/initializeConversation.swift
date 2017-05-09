let service = manager.getService(spec: "<%- conversationService.name %>")

if let conService = service {
    
    if let creds = conService.credentials {
        if let username = creds["username"] as? String,
            let password = creds["password"] as? String {
            
            conversation = Conversation(username: username, password: password, version: version)
           
            conversation!.message(withWorkspace: workspaceID, failure: failure) { response in
                print(response.output.text)
                context = response.context
            } 
        }
    }
}

