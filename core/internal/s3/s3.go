package s3

import (
	"context"
	"fmt"
	"log"
	"path"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	_ "github.com/joho/godotenv/autoload"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
)

var (
	spacesAccessKey = dotenv.EnvString("SPACES_ACCESS_KEY", "YOUR_SPACES_ACCESS_KEY")
	spacesSecretKey = dotenv.EnvString("SPACES_SECRET_KEY", "YOUR_SPACES_SECRET_KEY")
	spacesRegion    = dotenv.EnvString("SPACES_REGION", "blr1")
	spacesBucket    = dotenv.EnvString("SPACES_BUCKET", "devex")
	spacesEndpoint  = dotenv.EnvString("SPACES_ENDPOINT", "https://blr1.digitaloceanspaces.com")
)

type S3Client struct {
	client *s3.Client
	ctx    context.Context
}

func NewS3Client() *S3Client {
	ctx := context.TODO()

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(spacesRegion),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(spacesAccessKey, spacesSecretKey, "")),
	)
	if err != nil {
		log.Printf("❌ Failed to load config: %v", err)
	}

	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(spacesEndpoint)
		o.UsePathStyle = true
	})

	return &S3Client{
		client: s3Client,
		ctx:    ctx,
	}
}

func (s *S3Client) CopyFolder(sourcePrefix, destinationPrefix string) error {
	var continuationToken *string

	for {
		// Step 1: List objects
		listInput := &s3.ListObjectsV2Input{
			Bucket:            aws.String(spacesBucket),
			Prefix:            aws.String(sourcePrefix),
			ContinuationToken: continuationToken,
		}

		output, err := s.client.ListObjectsV2(s.ctx, listInput)
		if err != nil {
			return fmt.Errorf("❌ Failed to list objects: %w", err)
		}

		if len(output.Contents) == 0 {
			log.Println("⚠️ No objects found under prefix:", sourcePrefix)
			break
		}

		// Step 2: Copy each object
		for _, obj := range output.Contents {
			sourceKey := *obj.Key

			// 🔒 Skip folder placeholders like "base/lang/"
			if strings.HasSuffix(sourceKey, "/") {
				continue
			}

			// Derive destination key
			relativeKey := strings.TrimPrefix(sourceKey, sourcePrefix)
			destinationKey := path.Join(destinationPrefix, relativeKey)

			// Fix: Use simple bucket/key format for DigitalOcean Spaces
			copySource := spacesBucket + "/" + sourceKey

			copyInput := &s3.CopyObjectInput{
				Bucket:     aws.String(spacesBucket),
				CopySource: aws.String(copySource),
				Key:        aws.String(destinationKey),
				// Remove ACL for DigitalOcean Spaces compatibility
			}

			_, err := s.client.CopyObject(s.ctx, copyInput)
			if err != nil {
				log.Printf("❌ Failed to copy object %s -> %s: %v", sourceKey, destinationKey, err)
				continue
			}

			log.Printf("✅ Copied %s -> %s", sourceKey, destinationKey)
		}

		// Step 3: Handle pagination
		if output.IsTruncated != nil && *output.IsTruncated {
			continuationToken = output.NextContinuationToken
		} else {
			break
		}
	}

	return nil
}

func (s *S3Client) CopyTemplateFolder(sourcePrefix, destinationPrefix string) error {
	var continuationToken *string

	for {
		// Step 1: List all objects under sourcePrefix with pagination
		input := &s3.ListObjectsV2Input{
			Bucket:            aws.String(spacesBucket),
			Prefix:            aws.String(sourcePrefix),
			ContinuationToken: continuationToken,
		}

		output, err := s.client.ListObjectsV2(s.ctx, input)
		if err != nil {
			return fmt.Errorf("❌ Failed to list objects: %w", err)
		}

		if len(output.Contents) == 0 && continuationToken == nil {
			return fmt.Errorf("❌ No objects found under prefix: %s", sourcePrefix)
		}

		if len(output.Contents) > 0 {
			log.Println("✅ Objects found under prefix:", sourcePrefix)
		}

		// Step 2: Loop and copy each object
		for _, obj := range output.Contents {
			sourceKey := *obj.Key

			// Skip folder placeholders
			if strings.HasSuffix(sourceKey, "/") {
				continue
			}

			relativeKey := strings.TrimPrefix(sourceKey, sourcePrefix)
			destinationKey := path.Join(destinationPrefix, relativeKey)

			// Fix: Use simple bucket/key format for DigitalOcean Spaces
			copySource := spacesBucket + "/" + sourceKey

			copyInput := &s3.CopyObjectInput{
				Bucket:     aws.String(spacesBucket),
				CopySource: aws.String(copySource),
				Key:        aws.String(destinationKey),
				// Remove ACL for DigitalOcean Spaces compatibility
			}

			_, err := s.client.CopyObject(s.ctx, copyInput)
			if err != nil {
				return fmt.Errorf("❌ Failed to copy object %s: %w", sourceKey, err)
			}

			log.Printf("✅ Copied %s to %s\n", sourceKey, destinationKey)
		}

		// Step 3: Handle pagination
		if output.IsTruncated != nil && *output.IsTruncated {
			continuationToken = output.NextContinuationToken
		} else {
			break
		}
	}

	return nil
}

func (s *S3Client) ListObjects(prefix string) error {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(spacesBucket),
		Prefix: aws.String(prefix),
	}

	resp, err := s.client.ListObjectsV2(s.ctx, input)
	if err != nil {
		return fmt.Errorf("failed to list objects: %w", err)
	}

	if len(resp.Contents) == 0 {
		fmt.Println("No objects found with prefix:", prefix)
		return nil
	}

	fmt.Println("✅ Objects found under prefix:", prefix)
	for _, object := range resp.Contents {
		fmt.Println(" -", *object.Key)
	}

	return nil
}

func (s *S3Client) DeleteFolder(folderPrefix string) error {
	var continuationToken *string

	for {
		// Step 1: List objects under the folder prefix
		listInput := &s3.ListObjectsV2Input{
			Bucket:            aws.String(spacesBucket),
			Prefix:            aws.String(folderPrefix),
			ContinuationToken: continuationToken,
		}

		output, err := s.client.ListObjectsV2(s.ctx, listInput)
		if err != nil {
			return fmt.Errorf("❌ Failed to list objects: %w", err)
		}

		if len(output.Contents) == 0 && continuationToken == nil {
			log.Println("⚠️ No objects found under prefix:", folderPrefix)
			return nil
		}

		// Step 2: Delete each object
		for _, obj := range output.Contents {
			deleteInput := &s3.DeleteObjectInput{
				Bucket: aws.String(spacesBucket),
				Key:    obj.Key,
			}

			_, err := s.client.DeleteObject(s.ctx, deleteInput)
			if err != nil {
				log.Printf("❌ Failed to delete object %s: %v", *obj.Key, err)
				continue
			}

			log.Printf("✅ Deleted %s", *obj.Key)
		}

		// Step 3: Handle pagination
		if output.IsTruncated != nil && *output.IsTruncated {
			continuationToken = output.NextContinuationToken
		} else {
			break
		}
	}

	return nil
}
