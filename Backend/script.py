import boto3
from botocore.exceptions import NoCredentialsError

# Replace with your S3 bucket name
BUCKET_NAME = 'virtualband'
# Replace with the local path to your MIDI file
LOCAL_MIDI_FILE = 'music/example.mid'
# Replace with the desired S3 key (destination path in the bucket)
S3_OBJECT_NAME = 'midi-uploads/example.mid'

def upload_midi_to_s3(local_path, bucket, s3_key):
    """
    Uploads a file to an S3 bucket.
    """
    s3_client = boto3.client('s3')
    try:
        s3_client.upload_file(local_path, bucket, s3_key)
        print(f"Upload successful: {local_path} -> s3://{bucket}/{s3_key}")
        return True
    except FileNotFoundError:
        print(f"The file was not found: {local_path}")
        return False
    except NoCredentialsError:
        print("Credentials not available. Please configure your AWS CLI.")
        return False
    except Exception as e:
        print(f"An error occurred during upload: {e}")
        return False

if __name__ == "__main__":
    upload_midi_to_s3(LOCAL_MIDI_FILE, BUCKET_NAME, S3_OBJECT_NAME)
