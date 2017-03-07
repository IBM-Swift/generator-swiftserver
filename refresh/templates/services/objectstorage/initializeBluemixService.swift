let objectStorageService = try manager.getObjectStorageService(name: "<%- service.name -%>")
objectStorage = ObjectStorage(service: objectStorageService)
try objectStorage?.connectSync(service: objectStorageService)
