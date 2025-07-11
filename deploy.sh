#!/bin/bash
# WorkBeat SaaS Deployment Script

# Exit on any error
set -e

# Print colored output
print_info() {
  echo -e "\e[1;34m[INFO]\e[0m $1"
}

print_success() {
  echo -e "\e[1;32m[SUCCESS]\e[0m $1"
}

print_error() {
  echo -e "\e[1;31m[ERROR]\e[0m $1"
}

print_warning() {
  echo -e "\e[1;33m[WARNING]\e[0m $1"
}

# Check if Docker and Docker Compose are installed
check_prerequisites() {
  print_info "Checking prerequisites..."
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker and try again."
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
  }
  
  print_success "Prerequisites check passed."
}

# Generate secure secrets
generate_secrets() {
  print_info "Generating secure secrets..."
  
  if [ ! -f .env ]; then
    touch .env
    echo "# Generated on $(date)" >> .env
    echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env
    echo "REFRESH_TOKEN_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env
    echo "SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')" >> .env
    echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')" >> .env
    echo "REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')" >> .env
    echo "CLIENT_URL=https://yourdomain.com" >> .env
    echo "CORS_ORIGIN=https://yourdomain.com" >> .env
    echo "VITE_APP_API_URL=https://yourdomain.com/api" >> .env
    
    print_success "Secret keys generated and saved to .env file."
    print_warning "Please update the domain name in the .env file before deployment."
  else
    print_warning ".env file already exists. Skipping secret generation."
    print_info "If you want to regenerate secrets, please remove or rename the existing .env file."
  fi
}

# Build and deploy the application
deploy() {
  print_info "Deploying WorkBeat SaaS application..."
  
  # Check if running in production mode
  if [ "$1" == "production" ]; then
    print_info "Deploying in PRODUCTION mode with Nginx reverse proxy."
    docker-compose --profile production up -d --build
  else
    print_info "Deploying in DEVELOPMENT mode without Nginx reverse proxy."
    docker-compose up -d --build
  fi
  
  print_info "Waiting for services to start..."
  sleep 10
  
  # Run database migrations
  print_info "Running database migrations..."
  docker-compose exec backend npx prisma migrate deploy
  
  print_success "WorkBeat SaaS application has been deployed successfully!"
}

# Show help message
show_help() {
  echo "WorkBeat SaaS Deployment Script"
  echo ""
  echo "Usage: $0 [option]"
  echo ""
  echo "Options:"
  echo "  --help             Show this help message"
  echo "  --check            Check prerequisites only"
  echo "  --secrets          Generate secure secrets only"
  echo "  --deploy           Deploy in development mode"
  echo "  --deploy-prod      Deploy in production mode with Nginx"
  echo ""
}

# Main script execution
case "$1" in
  --help)
    show_help
    ;;
  --check)
    check_prerequisites
    ;;
  --secrets)
    generate_secrets
    ;;
  --deploy)
    check_prerequisites
    generate_secrets
    deploy
    ;;
  --deploy-prod)
    check_prerequisites
    generate_secrets
    deploy "production"
    ;;
  *)
    show_help
    ;;
esac
