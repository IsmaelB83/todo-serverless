// Node Modules
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

// Constants
const XAWS = AWSXRay.captureAWS(AWS)
const S3 = new XAWS.S3({'signatureVersion': 'v4'});
const EXPIRATION: number = parseInt(process.env.SIGNED_URL_EXPIRATION || "300");
const BUCKET: string = process.env.ATTACHMENT_S3_BUCKET!;

// Return pre-signed url
export async function getAttachmentUploadUrl(todoId: string): Promise<String> {
  // Generate pre-signed url
  return S3.getSignedUrl('putObject', {
    Bucket: BUCKET,
    Key: todoId,
    Expires: EXPIRATION
  })
}