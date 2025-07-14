# Deployment Guide

## Deployment Overview

This guide covers multiple deployment strategies for the tunnel proxy system, from local development to production environments.

## Development Deployment

### Local Development Setup

#### Prerequisites
- Node.js 18.0 or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher
- Docker and Docker Compose (optional)

#### Quick Start

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd Tunnel/src
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Start dependencies:
   ```bash
   # Option 1: Using Docker Compose
   cd ../docker/dev
   docker-compose up -d mongodb redis
   
   # Option 2: Local installation
   sudo systemctl start mongod redis
   ```

4. Start the application:
   ```bash
   cd ../../src
   npm run dev
   ```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development node app.js",
    "dev:watch": "nodemon app.js",
    "dev:debug": "NODE_ENV=development node --inspect app.js",
    "test": "NODE_ENV=test npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=test/unit",
    "test:integration": "jest --testPathPattern=test/integration",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  }
}
```

### Development Environment Variables

```env
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug

# Database
MONGODB_URI=mongodb://localhost:27017/proxy_dev
REDIS_URL=redis://localhost:6379

# Target application
TARGET_HOST=localhost
TARGET_PORT=3000
TARGET_PROTOCOL=http

# Security (weak keys for development)
AUTH_TOKEN=dev-token-123
HEX_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Performance
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
REQUEST_TIMEOUT=5000
```

## Docker Deployment

### Dockerfile Optimization

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs package*.json ./

# Set user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start application
CMD ["node", "src/app.js"]
```

### Docker Compose Development

```yaml
# docker/dev/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ../..
      dockerfile: docker/Dockerfile
      target: production
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/proxy
      REDIS_URL: redis://redis:6379
      TARGET_HOST: target-app
      TARGET_PORT: 3000
      AUTH_TOKEN: dev-token-123
      HEX_ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef
    volumes:
      - ../../src:/app/src:ro
      - app_logs:/app/logs
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongodb:
    image: mongo:6.0-focal
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: proxy
    volumes:
      - mongodb_data:/data/db
      - ../../docker/init.sh:/docker-entrypoint-initdb.d/init.sh:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ../../docker/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
  redis_data:
  app_logs:

networks:
  default:
    driver: bridge
```

### Docker Compose Production

```yaml
# docker/prod/docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    image: tunnel-proxy:${VERSION:-latest}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongodb:27017/proxy
      REDIS_URL: redis://redis:6379
    secrets:
      - auth_token
      - encryption_key
    volumes:
      - app_logs:/app/logs
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  mongodb:
    image: mongo:6.0-focal
    environment:
      MONGO_INITDB_ROOT_USERNAME_FILE: /run/secrets/mongo_root_user
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_root_password
      MONGO_INITDB_DATABASE: proxy
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    secrets:
      - mongo_root_user
      - mongo_root_password
      - mongo_app_user
      - mongo_app_password
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7.0-alpine
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
  mongodb_config:
  redis_data:
  app_logs:
  nginx_logs:

secrets:
  auth_token:
    external: true
  encryption_key:
    external: true
  mongo_root_user:
    external: true
  mongo_root_password:
    external: true
  mongo_app_user:
    external: true
  mongo_app_password:
    external: true
```

## Cloud Deployment

### AWS Deployment

#### ECS Fargate Deployment

```yaml
# aws/ecs-task-definition.json
{
  "family": "tunnel-proxy",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "tunnel-proxy",
      "image": "your-account.dkr.ecr.region.amazonaws.com/tunnel-proxy:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "AUTH_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tunnel-proxy/auth-token"
        },
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:tunnel-proxy/mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tunnel-proxy",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### ECS Service Configuration

```yaml
# aws/ecs-service.json
{
  "serviceName": "tunnel-proxy-service",
  "cluster": "tunnel-proxy-cluster",
  "taskDefinition": "tunnel-proxy",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-12345",
        "subnet-67890"
      ],
      "securityGroups": [
        "sg-tunnel-proxy"
      ],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/tunnel-proxy/abc123",
      "containerName": "tunnel-proxy",
      "containerPort": 8080
    }
  ],
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 50,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  }
}
```

### Google Cloud Platform

#### Cloud Run Deployment

```yaml
# gcp/cloudrun-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: tunnel-proxy
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "1Gi"
        run.googleapis.com/cpu: "1000m"
    spec:
      containerConcurrency: 100
      serviceAccountName: tunnel-proxy-sa
      containers:
      - image: gcr.io/project-id/tunnel-proxy:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "8080"
        - name: AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: auth-token
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

### Azure Deployment

#### Container Instances

```yaml
# azure/container-group.yaml
apiVersion: 2021-10-01
location: eastus
name: tunnel-proxy-group
properties:
  containers:
  - name: tunnel-proxy
    properties:
      image: your-registry.azurecr.io/tunnel-proxy:latest
      resources:
        requests:
          cpu: 1
          memoryInGb: 2
        limits:
          cpu: 2
          memoryInGb: 4
      ports:
      - port: 8080
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: PORT
        value: "8080"
      - name: AUTH_TOKEN
        secureValue: ${AUTH_TOKEN}
      - name: MONGODB_URI
        secureValue: ${MONGODB_URI}
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 30
        periodSeconds: 30
      readinessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
  restartPolicy: Always
type: Microsoft.ContainerInstance/containerGroups
```

## Kubernetes Deployment

### Kubernetes Manifests

#### Namespace and ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tunnel-proxy
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tunnel-proxy-config
  namespace: tunnel-proxy
data:
  NODE_ENV: "production"
  PORT: "8080"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "2000"
  CONNECTION_TIMEOUT: "60000"
  REQUEST_TIMEOUT: "15000"
```

#### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: tunnel-proxy-secrets
  namespace: tunnel-proxy
type: Opaque
data:
  auth-token: <base64-encoded-token>
  encryption-key: <base64-encoded-key>
  mongodb-uri: <base64-encoded-uri>
  redis-url: <base64-encoded-url>
```

#### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tunnel-proxy
  namespace: tunnel-proxy
  labels:
    app: tunnel-proxy
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: tunnel-proxy
  template:
    metadata:
      labels:
        app: tunnel-proxy
    spec:
      containers:
      - name: tunnel-proxy
        image: tunnel-proxy:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        envFrom:
        - configMapRef:
            name: tunnel-proxy-config
        env:
        - name: AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: auth-token
        - name: HEX_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: encryption-key
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: tunnel-proxy-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      securityContext:
        fsGroup: 1001
```

#### Service and Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: tunnel-proxy-service
  namespace: tunnel-proxy
  labels:
    app: tunnel-proxy
spec:
  selector:
    app: tunnel-proxy
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tunnel-proxy-ingress
  namespace: tunnel-proxy
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/websocket-services: tunnel-proxy-service
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: tunnel-proxy-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tunnel-proxy-service
            port:
              number: 80
```

#### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tunnel-proxy-hpa
  namespace: tunnel-proxy
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tunnel-proxy
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
```

## CI/CD Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: src/package-lock.json
    
    - name: Install dependencies
      run: cd src && npm ci
    
    - name: Run tests
      run: cd src && npm test
    
    - name: Run linting
      run: cd src && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image: ${{ steps.meta.outputs.tags }}
      digest: ${{ steps.build.outputs.digest }}
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        file: docker/Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
    
    - name: Deploy to Kubernetes
      run: |
        cd k8s
        sed -i 's|tunnel-proxy:latest|${{ needs.build.outputs.image }}|g' deployment.yaml
        kubectl apply -f namespace.yaml
        kubectl apply -f configmap.yaml
        kubectl apply -f secrets.yaml
        kubectl apply -f deployment.yaml
        kubectl apply -f service.yaml
        kubectl apply -f ingress.yaml
        kubectl apply -f hpa.yaml
    
    - name: Wait for deployment
      run: |
        kubectl rollout status deployment/tunnel-proxy -n tunnel-proxy --timeout=300s
    
    - name: Verify deployment
      run: |
        kubectl get pods -n tunnel-proxy
        kubectl get services -n tunnel-proxy
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: node:18-alpine
  services:
    - mongo:6.0
    - redis:7.0-alpine
  variables:
    MONGODB_URI: mongodb://mongo:27017/proxy_test
    REDIS_URL: redis://redis:6379
  script:
    - cd src
    - npm ci
    - npm test
    - npm run lint
  artifacts:
    reports:
      junit: src/test-results.xml
      coverage: src/coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -f docker/Dockerfile -t $IMAGE_TAG .
    - docker push $IMAGE_TAG
  only:
    - main
    - tags

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://your-domain.com
  script:
    - echo $KUBE_CONFIG | base64 -d > ~/.kube/config
    - cd k8s
    - sed -i "s|tunnel-proxy:latest|$IMAGE_TAG|g" deployment.yaml
    - kubectl apply -f .
    - kubectl rollout status deployment/tunnel-proxy -n tunnel-proxy
  only:
    - main
```

## Monitoring and Health Checks

### Health Check Endpoints

```javascript
// Health check implementation
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {}
  };
  
  // Check database connectivity
  try {
    await mongoose.connection.db.admin().ping();
    health.dependencies.mongodb = 'healthy';
  } catch (error) {
    health.dependencies.mongodb = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Check Redis connectivity
  try {
    await redis.ping();
    health.dependencies.redis = 'healthy';
  } catch (error) {
    health.dependencies.redis = 'unhealthy';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Readiness and Liveness Probes

```bash
# Readiness probe script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ $response -eq 200 ]; then
  exit 0
else
  exit 1
fi
```

### Deployment Verification

```bash
# Post-deployment verification script
#!/bin/bash

echo "Verifying deployment..."

# Check service health
HEALTH_STATUS=$(curl -s http://your-domain.com/health | jq -r '.status')
if [ "$HEALTH_STATUS" != "healthy" ]; then
  echo "Health check failed: $HEALTH_STATUS"
  exit 1
fi

# Check WebSocket connectivity
wscat -c ws://your-domain.com?token=$AUTH_TOKEN -x 'ping' > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "WebSocket connectivity test failed"
  exit 1
fi

# Check database connectivity
MONGO_STATUS=$(curl -s http://your-domain.com/health | jq -r '.dependencies.mongodb')
if [ "$MONGO_STATUS" != "healthy" ]; then
  echo "MongoDB connectivity failed"
  exit 1
fi

echo "Deployment verification passed"
```
