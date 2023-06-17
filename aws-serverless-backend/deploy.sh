echo 'Synthesize and deploy base stack'
cdk synthesize MmfSyncApiStack \
    --require-approval never \;

cdk deploy MmfSyncApiStack \
    -O aws_config.json \;
