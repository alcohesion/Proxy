# Redis and MongoDB Setup for Fly.io Deployment

This document explains how to set up external Redis and MongoDB services for your Pori Proxy deployment.

## MongoDB Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account
   - Create a new cluster (free M0 cluster is sufficient for testing)

2. **Configure Database**
   - Create a database named `pori-proxy`
   - Create a user with read/write permissions
   - Add your Fly.io app's IP ranges to the IP whitelist (or use 0.0.0.0/0 for all IPs)

3. **Get Connection String**
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/pori-proxy`
   - Replace `username`, `password`, and `cluster` with your actual values

## Redis Setup (Upstash Redis)

1. **Create Upstash Account**
   - Go to https://upstash.com
   - Sign up for a free account
   - Create a new Redis database

2. **Configure Redis**
   - Choose a region close to your Fly.io deployment region
   - Free tier provides 10MB storage (sufficient for testing)

3. **Get Connection URL**
   - Format: `redis://default:password@host:port`
   - Copy the connection URL from your Upstash dashboard

## Alternative: Fly.io Managed Services

### Fly.io Redis (Upstash Integration)
```bash
# Create Redis instance
flyctl redis create --name pori-redis --region iad
```

### Fly.io PostgreSQL (Alternative to MongoDB)
```bash
# Create PostgreSQL instance (if you want to use PostgreSQL instead)
flyctl postgres create --name pori-db --region iad
```

## Environment Variables Setup

Use the provided `secrets.sh` script to set up all environment variables:

```bash
cd fly/
./secrets.sh
```

Or manually set secrets:

```bash
flyctl secrets set MONGODB_URI="your-mongodb-uri" --app pori-proxy
flyctl secrets set REDIS_URL="your-redis-url" --app pori-proxy
```

## Security Considerations

1. **Network Security**
   - Use strong passwords for database connections
   - Enable SSL/TLS for all database connections
   - Restrict database access to known IP ranges when possible

2. **Authentication**
   - Generate a strong AUTH_TOKEN (32+ characters)
   - Rotate tokens regularly
   - Use different tokens for different environments

3. **Data Encryption**
   - All data in transit is encrypted (MongoDB Atlas and Upstash use TLS)
   - Generate a unique HEX_ENCRYPTION_KEY for ID encryption

## Monitoring and Maintenance

1. **Database Monitoring**
   - Monitor MongoDB Atlas metrics
   - Set up alerts for connection issues
   - Monitor storage usage

2. **Redis Monitoring**
   - Monitor Upstash Redis metrics
   - Monitor memory usage
   - Set up alerts for high latency

3. **Application Monitoring**
   - Use Fly.io metrics: `flyctl metrics --app pori-proxy`
   - Monitor application logs: `flyctl logs --app pori-proxy`
   - Set up health check alerts

## Backup Strategy

1. **MongoDB Backups**
   - MongoDB Atlas provides automatic backups
   - Configure backup retention policies
   - Test restore procedures

2. **Redis Backups**
   - Upstash provides automatic backups
   - Redis data can be rebuilt from MongoDB if needed

## Cost Optimization

1. **MongoDB Atlas**
   - Free M0 cluster: 512MB storage
   - Upgrade to M2/M5 for production workloads
   - Monitor connection pooling efficiency

2. **Upstash Redis**
   - Free tier: 10MB storage, 1000 requests/day
   - Upgrade to Pro for higher limits
   - Implement efficient caching strategies

## Troubleshooting

1. **Connection Issues**
   ```bash
   # Check if secrets are set correctly
   flyctl secrets list --app pori-proxy
   
   # Check application logs
   flyctl logs --app pori-proxy
   
   # Connect to the application
   flyctl ssh console --app pori-proxy
   ```

2. **Database Connection Problems**
   - Verify connection strings
   - Check IP whitelist settings
   - Verify credentials
   - Test connections from local environment first

3. **Performance Issues**
   - Monitor database metrics
   - Check Redis cache hit rates
   - Analyze Fly.io performance metrics
   - Consider upgrading database tiers
