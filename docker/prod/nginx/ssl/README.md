# SSL Certificate Directory

This directory contains SSL certificates managed automatically by GitHub Actions deployment.

## Automated SSL Setup via GitHub Actions

The SSL certificates are automatically deployed from GitHub secrets during the deployment process. You don't need to manually place files here.

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

1. **SSL_CERT** - Your domain certificate (PEM format)
2. **SSL_KEY** - Your private key (PEM format)  
3. **SSL_CA_BUNDLE** - Certificate Authority intermediate certificates (PEM format)

## Deployment Process

When GitHub Actions deploys, it will:

1. Create `cert-original.pem` from `SSL_CERT` secret
2. Create `ca.crt` from `SSL_CA_BUNDLE` secret  
3. Create `key.pem` from `SSL_KEY` secret
4. Combine `cert-original.pem` + `ca.crt` into `cert.pem` (full chain)
5. Copy `cert.pem` to `fullchain.pem` for nginx clarity
6. Set proper file permissions
7. Start nginx with the complete certificate chain

## File Structure After Deployment

```
ssl/
├── fullchain.pem     # Full certificate chain used by nginx (domain + CA bundle)
├── cert.pem          # Full certificate chain (same as fullchain.pem)
├── cert-original.pem # Original domain certificate 
├── ca.crt           # CA intermediate certificates
└── key.pem          # Private key
```

## Manual Testing (Development Only)

For local development or troubleshooting, you can test the nginx configuration:

```bash
make prod-test-nginx  # Test nginx configuration
make prod-logs-nginx  # View nginx logs
```

## Security

- Set appropriate file permissions (readable by nginx user only)
- The Docker container will mount this directory as read-only
- Never commit actual certificate files to version control
- SSL certificates are managed via GitHub secrets for security

## Certificate Verification

After deployment, you can verify the certificate setup:

```bash
# Test nginx configuration
make prod-test-nginx

# Check nginx logs
make prod-logs-nginx

# Check certificate details (if you have shell access)
openssl x509 -in /path/to/fullchain.pem -text -noout

# Verify the full certificate chain
openssl verify -CAfile /path/to/ca.crt /path/to/fullchain.pem

# Check that certificate chain is complete (should show multiple certificates)
openssl crl2pkcs7 -nocrl -certfile /path/to/fullchain.pem | openssl pkcs7 -print_certs -text -noout

# Verify certificate chain matches private key
openssl x509 -noout -modulus -in /path/to/fullchain.pem | openssl md5
openssl rsa -noout -modulus -in /path/to/key.pem | openssl md5
# The MD5 hashes should match

# Test SSL connection externally
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```
