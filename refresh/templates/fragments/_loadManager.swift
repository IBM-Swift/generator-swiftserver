func executableURL() -> URL? {
    var executableURL = Bundle.main.executableURL
    #if os(Linux)
        if (executableURL == nil) {
            executableURL = URL(fileURLWithPath: "/proc/self/exe").resolvingSymlinksInPath()
        }
    #endif
        return executableURL
}

func findProjectRoot(fromDir initialSearchDir: URL) -> URL? {
    let fileManager = FileManager()
    var searchDirectory = initialSearchDir
    while searchDirectory.path != "/" {
        let projectFilePath = searchDirectory.appendingPathComponent(".swiftservergenerator-project").path
        if fileManager.fileExists(atPath: projectFilePath) {
            return searchDirectory
        }
        searchDirectory.deleteLastPathComponent()
    }
    return nil
}

guard let searchDir = executableURL()?.deletingLastPathComponent(),
      let projectRoot = findProjectRoot(fromDir: searchDir) else {
    Log.error("Cannot find project root")
    exit(1)
}

try manager.load(file: projectRoot.appendingPathComponent("config.json").path)
            .load(.environmentVariables)
