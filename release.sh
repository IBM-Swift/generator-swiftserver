# Script to release to NPM and publish tag
# GITHUB_TOKEN and NPM_TOKEN are provided by the Travis environment.
# They MUST be set in the Travis project settings for generator-swiftserver.

# Remove origin remote
git remote rm origin
git remote add origin https://SwiftDevOps:${GITHUB_TOKEN}@github.com/IBM-Swift/generator-swiftserver

# Get the version from package.json
VERSION=`node -e "console.log(require('./package.json').version);"`
echo "Creating release ${VERSION}" 
git tag $VERSION && git push origin $VERSION || true

# Merge back into develop and push those changes
git fetch origin && git checkout develop && git merge origin/master && git push origin develop

# Publish to npm
echo "Publish to NPM"
makeshift $NPM_TOKEN
npm publish

# Deleting the old release branch
BRANCH_TO_DELETE=updateTo$VERSION
echo Deleting $BRANCH_TO_DELETE 
curl -u SwiftDevOps:${GITHUB_TOKEN} -X DELETE -H "Accept: application/vnd.github.loki-preview+json" "https://api.github.com/repos/IBM-Swift/generator-swiftserver/branches/$BRANCH_TO_DELETE/protection"
git push origin :$BRANCH_TO_DELETE

