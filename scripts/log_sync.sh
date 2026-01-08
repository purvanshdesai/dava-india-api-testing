#!/bin/bash

# Variables
S3_BUCKET="s3://davaindia-logs/logs"
STORAGE_CLASS="STANDARD_IA"
LOCAL_FOLDER="/home/pm2user/dava-india-api/logs"

# Sync files to S3 with Infrequent Access storage class
aws s3 sync "$LOCAL_FOLDER" "$S3_BUCKET" --storage-class "$STORAGE_CLASS"

# Check the exit code of the command
if [ $? -eq 0 ]; then
    echo "S3 bucket successfully synced to Infrequent Access storage class."
else
    echo "Error: Failed to sync files to S3 bucket."
fi
