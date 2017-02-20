import CloudFoundryConfig
import BluemixObjectStorage
import Dispatch
import LoggerAPI

extension ObjectStorage {
    public convenience init(service: ObjectStorageService) {
        self.init(projectId: service.projectID)
    }

    public func connect(service: ObjectStorageService, completion: @escaping (_ error: ObjectStorageError?) -> Void) {
        self.connect(userId:   service.userID,
                     password: service.password,
                     region:   service.region,
                     completionHandler: completion)
    }

    public func connectSync(service: ObjectStorageService) throws {
        let connectQueue = DispatchQueue(label: "connectQueue")
        try connectQueue.sync {
            let semaphore = DispatchSemaphore(value: 0)
            var errorOccurred: Error? = nil
            connect(service: service) { error in
                errorOccurred = error
                semaphore.signal()
            }
            _ = semaphore.wait(timeout: DispatchTime.distantFuture)
            if let error = errorOccurred {
                throw error
            }
        }
    }
}
