let objectStorageService = try manager.getObjectStorageService(name: "<%- serviceDef.name -%>")
objectStorage = ObjectStorage(service: objectStorageService)
try objectStorage?.connectSync(service: objectStorageService)
