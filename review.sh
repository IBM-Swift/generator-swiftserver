# Script to create a review branch 
# Prevent the build when it is just a merge request
COMMIT_REGEX="Merge pull request #[0-9]+ from .+\s*Release [0-9]+\.[0-9]+\.[0-9]+"
if [[ $TRAVIS_BRANCH == "develop" ]] && [[ $TRAVIS_PULL_REQUEST == "false" ]]
then
  # Check if we are merging from master
  if [[ $TRAVIS_COMMIT_MESSAGE =~ $COMMIT_REGEX ]]
  then 
    echo This is a merge from master - exiting
  else
    git config user.email "travis@travis-ci.org"
    git config user.name "Generator bot"
    git config push.default simple
    git remote rm origin
    # TODO: Create bot account and insert details
    #git remote add origin https://<BOT_NAME>:<BOT_TOKEN>@github.com/IBM-Swift/generator-swiftserver
    echo Creating branch with the new version to be reviewed
    git checkout -b temp
    echo Updating the version
    standard-version -i "CHANGES.md" --tag-version

    # Delete all the other branches that are release branches
    PULLS=$(curl -u <BOT_NAME>:<BOT_TOKEN> -X GET -H "Accept: application/vnd.github.loki-preview+json" "https://api.github.com/repos/IBM-Swift/generator-swiftserver/pulls")
    LENGTH=$(echo $PULLS | jq 'length')
    SIZE=$(( $LENGTH - 1 ))
    # Loop through all the different pull requests and delete the release branches
    for i in $(seq 0 $SIZE); do
      BASE=$(echo $PULLS | jq -r ".[$i].base.ref")
      PULL_BRANCH=$(echo $PULLS | jq -r ".[$i].head.ref")
      BRANCH_REGEX="updateTo[0-9]+\.[0-9]+\.[0-9]+"
      if [[ $BASE == "master" ]] && [[ $PULL_BRANCH =~ $BRANCH_REGEX ]]; then
        # Unprotect the branch before deleting
        echo Removing protection on $PULL_BRANCH
        curl -u <BOT_NAME>:<BOT_TOKEN> -X DELETE -H "Accept: application/vnd.github.loki-preview+json" "https://api.github.com/repos/IBM-Swift/generator-swiftserver/branches/$PULL_BRANCH/protection"
        echo Deleting $PULL_BRANCH
        git push origin :$PULL_BRANCH
      fi
    done

    VERSION=`node -e "console.log(require('./package.json').version);"`
    BRANCH=updateTo${VERSION}
    git branch -m $BRANCH
    git push -u origin $BRANCH
    # Protect the branch from force push and deletion
    curl -u <BOT_NAME>:<BOT_TOKEN>rob-deans:${GH_TOKEN} -X PUT -H "Content-Type: application/json" -H "Accept: application/vnd.github.loki-preview+json" -d "{\"required_status_checks\": {\"strict\": true,\"contexts\": []},\"required_pull_request_reviews\":{},\"restrictions\": null,\"enforce_admins\": true}" "https://api.github.com/repos/IBM-Swift/generator-swiftserver/branches/$BRANCH/protection"

    # create a pull request to master
    curl -u <BOT_NAME>:<BOT_TOKEN> -H "Content-Type: application/json" -X POST -d "{\"title\": \"Release ${VERSION}\", \"head\": \"${BRANCH}\", \"base\": \"master\", \"body\": \"Do NOT attempt to push further changes to this branch.\"}" https://api.github.com/repos/IBM-Swift/generator-swiftserver/pulls 

  fi
else
  echo This not on develop or a push to develop - exiting
fi
