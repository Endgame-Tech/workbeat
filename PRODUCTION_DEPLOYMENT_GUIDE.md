# WorkBeat SaaS Production Deployment Guide

This guide provides step-by-step instructions for deploying the WorkBeat SaaS application to a production environment.

## Prerequisites

- A Linux server with at least 2GB RAM, 2 vCPUs
- Domain name with DNS configured to point to your server
- Docker and Docker Compose installed
- Git installed
- Basic understanding of Linux server administration

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/workbeat.git
cd workbeat

# Switch to the main branch
git checkout main
```

## Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your production values
nano .env
```

Make sure to update the following variables:

- Replace all placeholder passwords with strong, secure passwords
- Update `CLIENT_URL` and `CORS_ORIGIN` with your actual domain
- Configure your SMTP settings for email notifications
- Set up your payment gateway credentials

## Step 3: Configure SSL Certificates

For production, you need valid SSL certificates. We recommend using Let's Encrypt:

```bash
# Install certbot (Ubuntu/Debian)
apt-get update
apt-get install certbot

# Obtain certificates
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create the SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Copy certificates to the nginx/ssl directory
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

## Step 4: Run the Deployment Script

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script in production mode
./deploy.sh --deploy-prod
```

The script will:

1. Check prerequisites
2. Generate secure secrets if not already present
3. Build and start all containers
4. Run database migrations

## Step 5: Verify Deployment

After deployment, verify that everything is working correctly:

1. Open your domain in a browser (`https://yourdomain.com`)
2. Check if you can access the login page
3. Try logging in with the admin credentials
4. Verify that the API is accessible (`https://yourdomain.com/api/health`)

## Step 6: Set Up Automated Backups

Set up a cron job to automatically backup the database:

```bash
# Create a backup script
cat > /opt/workbeat/backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/workbeat/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
docker-compose exec -T postgres pg_dump -U workbeat_user workbeat > $BACKUP_DIR/workbeat_$TIMESTAMP.sql

# Compress the backup
gzip $BACKUP_DIR/workbeat_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "workbeat_*.sql.gz" -type f -mtime +30 -delete
EOF

# Make the script executable
chmod +x /opt/workbeat/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/workbeat/backup.sh") | crontab -
```

## Step 7: Set Up Monitoring

We recommend setting up monitoring for your production environment:

1. **Server Monitoring**:
   - Set up Prometheus and Grafana for comprehensive monitoring
   - Configure alerts for high CPU, memory, and disk usage

2. **Application Monitoring**:
   - Set up log aggregation with the ELK stack or a similar solution
   - Configure error tracking with Sentry or a similar service

## Common Issues and Troubleshooting

### Database Connection Issues

If the application can't connect to the database:

```bash
# Check if the PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection from backend
docker-compose exec backend npx prisma db seed
```

### Email Sending Problems

If emails aren't being sent:

```bash
# Check SMTP configuration in .env
# Verify SMTP server logs
docker-compose logs backend | grep SMTP
```

### Payment Integration Issues

If payment processing isn't working:

```bash
# Verify Paystack credentials in .env
# Check webhook configuration in Paystack dashboard
# Ensure webhook URL is correct: https://yourdomain.com/api/webhooks/paystack
```

## Updating the Application

To update the application to a new version:

```bash
# Pull the latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose --profile production up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

## Security Best Practices

1. **Keep the server updated**:

   ```bash
   apt-get update && apt-get upgrade -y
   ```

2. **Configure a firewall**:

   ```bash
   # Install and configure UFW
   apt-get install ufw
   ufw allow ssh
   ufw allow http
   ufw allow https
   ufw enable
   ```

3. **Set up fail2ban**:

   ```bash
   apt-get install fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

4. **Regular security audits**:

   - Regularly check for outdated dependencies
   - Run security scanning tools like OWASP ZAP
   - Review application logs for suspicious activity

## Scaling the Application

As your user base grows, you may need to scale the application:

1. **Vertical Scaling**:
   - Increase CPU and RAM on your server

2. **Horizontal Scaling**:
   - Set up multiple backend instances
   - Configure load balancing with Nginx
   - Use a managed database service for PostgreSQL

3. **Caching**:
   - Implement Redis caching for frequently accessed data
   - Set up a CDN for static assets

---

For any issues or questions, please consult the full documentation or contact support.
