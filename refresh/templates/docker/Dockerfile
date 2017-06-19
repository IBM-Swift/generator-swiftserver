FROM ibmcom/swift-ubuntu-runtime:3.1.1
MAINTAINER IBM Swift Engineering at IBM Cloud
LABEL Description="Template Dockerfile that extends the ibmcom/swift-ubuntu-runtime image."

# We can replace this port with what the user wants
# EXPOSE {{PORT}}
EXPOSE 8080

# Default user if not provided
ARG bx_dev_user=root
ARG bx_dev_userid=1000

# Add utils files
ADD https://raw.githubusercontent.com/IBM-Swift/swift-ubuntu-docker/master/utils/run-utils.sh /swift-utils/run-utils.sh
ADD https://raw.githubusercontent.com/IBM-Swift/swift-ubuntu-docker/master/utils/common-utils.sh /swift-utils/common-utils.sh
RUN chmod -R 555 /swift-utils

# Create user if not root
RUN if [ $bx_dev_user != "root" ]; then useradd -ms /bin/bash -u $bx_dev_userid $bx_dev_user; fi
