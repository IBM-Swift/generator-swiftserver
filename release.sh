# Script to release to NPM and publish tag
if [[ $TRAVIS_BRANCH == "master" ]] && [[ $TRAVIS_PULL_REQUEST == "false" ]]; then
  git remote rm origin
  git remote add origin https://<BOT_NAME>:<BOT_TOKEN>@github.com/IBM-Swift/generator-swiftserver
  VERSION=`node -e "console.log(require('./package.json').version);"`
  echo "Creating release ${VERSION}" 
  git tag $VERSION && git push origin $VERSION || true
  # Merge back into develop and push those changes
  git fetch origin && git checkout develop && git merge --ff-only origin/master && git push origin develop
  # npm publish 

  # Deleting the old release branch
  BRANCH_TO_DELETE=updateTo$VERSION
  echo Deleting $BRANCH_TO_DELETE 
  curl -u <BOT_NAME>:<BOT_TOKEN> -X DELETE -H "Accept: application/vnd.github.loki-preview+json" "https://api.github.com/repos/IBM-Swift/generator-swiftserver/branches/$BRANCH_TO_DELETE/protection"
  git push origin :$BRANCH_TO_DELETE
else
  echo "This not on master or a push to master - exiting"
fi
