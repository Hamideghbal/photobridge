"""Read-only independent SDK check against the existing empty probe session."""
import json, os, re
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

def env(name):
    value = os.environ.get(name, '').strip()
    if not value:
        raise RuntimeError('Missing qualification environment: ' + name)
    return value

recovery = json.loads(Path('work/prior-probe/liara-empty-probe-recovery.json').read_text())
key, upload_id = recovery['key'], recovery['uploadId']
if not recovery.get('empty') or not re.fullmatch(r'photobridge-compatibility-probes/[0-9a-f-]{36}/empty-probe\.bin', key):
    raise RuntimeError('Only the existing isolated empty probe may be read')
if not isinstance(upload_id, str) or not upload_id:
    raise RuntimeError('Missing existing probe upload ID')
checks = []
for region in ['default', 'us-east-1']:
    for style in ['path', 'virtual']:
        client = boto3.client('s3', endpoint_url=env('S3_ENDPOINT'), region_name=region,
            aws_access_key_id=env('S3_ACCESS_KEY'), aws_secret_access_key=env('S3_SECRET_KEY'),
            config=Config(signature_version='s3v4', s3={'addressing_style': style},
                connect_timeout=10, read_timeout=15, retries={'max_attempts': 0},
                request_checksum_calculation='when_required', response_checksum_validation='when_required'))
        for operation in ['list_objects_v2', 'list_parts']:
            entry = {'sdk': 'boto3', 'region': region, 'addressing': style, 'operation': operation}
            params = {'Bucket': env('S3_BUCKET')}
            params.update({'Prefix': 'photobridge-compatibility-probes/', 'MaxKeys': 1} if operation == 'list_objects_v2' else {'Key': key, 'UploadId': upload_id})
            try:
                response = getattr(client, operation)(**params)
                entry.update(ok=True, status=response['ResponseMetadata']['HTTPStatusCode'])
            except ClientError as error:
                entry.update(ok=False, status=error.response.get('ResponseMetadata', {}).get('HTTPStatusCode'),
                    code=error.response.get('Error', {}).get('Code'), requestId=error.response.get('ResponseMetadata', {}).get('RequestId'))
            except Exception as error:
                entry.update(ok=False, category=type(error).__name__)
            checks.append(entry)
        client.close()
report = {'readOnly': True, 'createdUploads': 0, 'checks': checks}
Path('work/liara-boto3-diagnostics.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
