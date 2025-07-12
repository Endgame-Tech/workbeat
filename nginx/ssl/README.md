# SSL Certificates

This directory is where SSL certificates should be placed for the production environment. The following files are required:

- `fullchain.pem`: The full certificate chain including your domain certificate and any intermediate certificates
- `privkey.pem`: The private key for your certificate

## Production Deployment

For production deployment, you should use real SSL certificates obtained from a certificate authority like Let's Encrypt.

### Using Let's Encrypt

1. Install certbot on your server
2. Run the following command to obtain certificates:

```bash
certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com
```

3.Copy the certificates to this directory:

```bash
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /path/to/workbeat/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /path/to/workbeat/nginx/ssl/
```

## Development/Testing

For development or testing, you can generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout privkey.pem -out fullchain.pem
```

Note: Self-signed certificates will cause browser warnings and should never be used in production.

## Security Notice

Never commit actual SSL certificates or private keys to version control. This directory is included in .gitignore to prevent accidental commits.
