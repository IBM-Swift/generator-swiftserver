FROM ibmcom/swift-ubuntu-runtime:latest
MAINTAINER IBM Swift Engineering at IBM Cloud
LABEL Description="Template Dockerfile that extends the ibmcom/swift-ubuntu-runtime:latest image."

# To override the default entrypoint, you can use the following:
# docker run --entrypoint=/bin/bash -i -t <image name>
# For further details, see https://github.com/docker/docker/issues/5539

# We can replace this port with what the user wants
# EXPOSE {{PORT}}
EXPOSE 8080

# Linux OS utils
RUN apt-get update

# <%= data/postgresql/system-library-install %>

WORKDIR /root/project

COPY . /root/project

ADD https://raw.githubusercontent.com/IBM-Swift/swift-ubuntu-docker/master/utils/run-utils.sh /root/utils/run-utils.sh
RUN chmod +x /root/utils/run-utils.sh
ADD https://raw.githubusercontent.com/IBM-Swift/swift-ubuntu-docker/master/utils/common-utils.sh /root/utils/common-utils.sh
RUN chmod +x /root/utils/common-utils.sh

#ENTRYPOINT ["bash", "/root/utils/run-utils.sh", "/root/project"]
CMD [ "sh", "-c", "/root/utils/run-utils.sh /root/project" ]
