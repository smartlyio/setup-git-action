FROM alpine

LABEL version="1.0.0"
LABEL repository="http://github.com/smartlyio/setup-gem-publish-action"
LABEL homepage="http://github.com/setup-gem-publish-action"

LABEL com.github.actions.name="Setup gem publish action"
LABEL com.github.actions.icon="package"

RUN apk add --no-cache bash git openssh

# User user that has the same uid as Github's virtual runner. This causes the generated files to have assumed
# permissions.
RUN adduser -S runner -u 1001
USER runner

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]