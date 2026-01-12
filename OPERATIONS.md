# HelpDesk Pro - Operations Guide

Operational procedures, monitoring, and maintenance guide for HelpDesk Pro.

## 📊 System Requirements

### Development Environment

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4GB | 8GB |
| Disk | 10GB | 20GB |
| OS | Linux, macOS, Windows | Linux (Ubuntu 20.04+) |

### Production Environment

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4GB | 8GB+ |
| Disk | 20GB | 50GB+ |
| OS | Linux | Ubuntu 22.04 LTS |
| Database | PostgreSQL 12+ | PostgreSQL 14+ |
| Node.js | 18.0.0 | 20.x LTS |

## 🏥 Health Checks

### Backend Health

**Endpoint:** `GET /health`

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Backend is healthy",
  "timestamp": "2026-01-11T05:37:09.000Z",
  "uptime": 123.456
}
```

### Database Health

```bash
# Quick connection test
npx prisma db execute --stdin <<< "SELECT 1" --schema ./prisma/schema.prisma

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('helpdesk'));"

# Check table sizes
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Application Health Checks

```bash
# Check if backend is running
ps aux | grep "node.*index.js"

# Check port usage
lsof -i :4000

# Check frontend build
ls -lh client/dist/

# Check uploads directory
du -sh backend/uploads/
```

## 📝 Logging

### Backend Logging

**Current Implementation:**
- Logs to stdout (console)
- Request logging: `METHOD PATH STATUS DURATION`
- Error logging: Full error stack in development

**Example Logs:**
```
✓ Database connection successful
POST /api/auth/login 200 45ms
GET /api/tickets 200 123ms
Error: Validation error
```

### Production Logging (Recommended)

**Using PM2:**
```bash
# View logs
pm2 logs helpdesk-backend

# Save logs to file
pm2 start src/index.js --name helpdesk-backend --log /var/log/helpdesk/backend.log

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Using systemd:**
```bash
# View logs
journalctl -u helpdesk-backend -f

# View last 100 lines
journalctl -u helpdesk-backend -n 100
```

### Database Logging

```bash
# PostgreSQL logs location (Ubuntu)
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Enable query logging (development only)
psql $DATABASE_URL -c "ALTER SYSTEM SET log_statement = 'all';"
psql $DATABASE_URL -c "SELECT pg_reload_conf();"
```

## 📈 Monitoring

### Key Metrics to Monitor

| Metric | Target | Critical |
|--------|--------|----------|
| API Response Time | < 200ms | > 1000ms |
| Database Query Time | < 100ms | > 500ms |
| Error Rate | < 1% | > 5% |
| CPU Usage | < 70% | > 90% |
| Memory Usage | < 80% | > 95% |
| Disk Usage | < 80% | > 90% |
| Active Connections | - | > 100 |

### Monitoring Tools (Recommended)

**Application Monitoring:**
- PM2 Plus (https://pm2.io)
- New Relic
- Datadog
- Sentry (error tracking)

**Database Monitoring:**
```bash
# Active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Long-running queries
psql $DATABASE_URL -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
"

# Database locks
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

**System Monitoring:**
```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network connections
netstat -an | grep :4000
```

## 🔄 Backup & Recovery

### Database Backup

**Manual Backup:**
```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema only
pg_dump --schema-only $DATABASE_URL > schema_$(date +%Y%m%d).sql

# Data only
pg_dump --data-only $DATABASE_URL > data_$(date +%Y%m%d).sql
```

**Automated Backup (Cron):**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump postgresql://user:pass@localhost:5432/helpdesk | gzip > /backups/helpdesk_$(date +\%Y\%m\%d).sql.gz

# Keep only last 7 days
0 3 * * * find /backups -name "helpdesk_*.sql.gz" -mtime +7 -delete
```

### Database Restore

```bash
# Restore from backup
psql $DATABASE_URL < backup_20260111.sql

# Restore from compressed backup
gunzip -c backup_20260111.sql.gz | psql $DATABASE_URL

# Restore specific table
pg_restore -t tickets backup.sql | psql $DATABASE_URL
```

### File Upload Backup

```bash
# Backup uploads directory
tar -czf uploads_$(date +%Y%m%d).tar.gz backend/uploads/

# Sync to remote storage (S3 example)
aws s3 sync backend/uploads/ s3://your-bucket/helpdesk/uploads/

# Rsync to backup server
rsync -avz backend/uploads/ user@backup-server:/backups/helpdesk/uploads/
```

### Restore Files

```bash
# Extract backup
tar -xzf uploads_20260111.tar.gz -C backend/

# Restore from S3
aws s3 sync s3://your-bucket/helpdesk/uploads/ backend/uploads/
```

## 🚀 Deployment

### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
cd backend
pm2 start src/index.js --name helpdesk-backend

# Start with environment variables
pm2 start src/index.js --name helpdesk-backend --env production

# View status
pm2 status

# View logs
pm2 logs helpdesk-backend

# Restart
pm2 restart helpdesk-backend

# Stop
pm2 stop helpdesk-backend

# Delete
pm2 delete helpdesk-backend

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

**PM2 Ecosystem File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'helpdesk-backend',
    script: './src/index.js',
    cwd: '/var/www/helpdesk/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      BACKEND_PORT: 4000
    },
    error_file: '/var/log/helpdesk/error.log',
    out_file: '/var/log/helpdesk/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M'
  }]
};
```

### Systemd Service

**Create service file:** `/etc/systemd/system/helpdesk-backend.service`

```ini
[Unit]
Description=HelpDesk Pro Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/helpdesk/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Manage service:**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start helpdesk-backend

# Enable auto-start
sudo systemctl enable helpdesk-backend

# Check status
sudo systemctl status helpdesk-backend

# View logs
journalctl -u helpdesk-backend -f
```

## 🔧 Maintenance

### Database Maintenance

**Vacuum (reclaim storage):**
```bash
# Vacuum all tables
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Vacuum specific table
psql $DATABASE_URL -c "VACUUM ANALYZE tickets;"

# Full vacuum (requires exclusive lock)
psql $DATABASE_URL -c "VACUUM FULL;"
```

**Reindex:**
```bash
# Reindex all tables
psql $DATABASE_URL -c "REINDEX DATABASE helpdesk;"

# Reindex specific table
psql $DATABASE_URL -c "REINDEX TABLE tickets;"
```

**Update Statistics:**
```bash
psql $DATABASE_URL -c "ANALYZE;"
```

### Clean Old Data

```bash
# Delete old notifications (older than 30 days)
psql $DATABASE_URL -c "
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND is_read = true;
"

# Delete old ticket history (older than 1 year)
psql $DATABASE_URL -c "
DELETE FROM ticket_history 
WHERE created_at < NOW() - INTERVAL '1 year';
"

# Archive closed tickets (older than 6 months)
psql $DATABASE_URL -c "
-- Create archive table first
CREATE TABLE IF NOT EXISTS tickets_archive AS SELECT * FROM tickets WHERE false;

-- Move old tickets
INSERT INTO tickets_archive 
SELECT * FROM tickets 
WHERE status_id IN (SELECT id FROM ticket_statuses WHERE is_closed = true)
AND updated_at < NOW() - INTERVAL '6 months';

-- Delete from main table
DELETE FROM tickets 
WHERE id IN (SELECT id FROM tickets_archive);
"
```

### Update Dependencies

```bash
# Check for updates
cd backend && npm outdated
cd client && npm outdated

# Update all dependencies
npm update

# Update specific package
npm update express

# Security audit
npm audit
npm audit fix
```

## 🔒 Security Operations

### SSL/TLS Certificate Management

**Using Let's Encrypt with Caddy:**
```bash
# Caddy automatically handles SSL
# Just configure domain in Caddyfile
```

**Manual Certificate Renewal:**
```bash
# Using certbot
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Security Audits

```bash
# NPM security audit
cd backend && npm audit
cd client && npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### Access Control

```bash
# Review user permissions
psql $DATABASE_URL -c "
SELECT u.email, r.name as role, r.permissions 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.is_active = true;
"

# Deactivate user
psql $DATABASE_URL -c "
UPDATE users SET is_active = false WHERE email = 'user@example.com';
"

# List admin users
psql $DATABASE_URL -c "
SELECT u.email, r.name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN');
"
```

## 📊 Performance Optimization

### Database Optimization

**Add Indexes:**
```sql
-- Already indexed in schema, but for reference:
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_status ON tickets(status_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to_id);
```

**Query Performance:**
```bash
# Enable query timing
psql $DATABASE_URL -c "\timing"

# Explain query plan
psql $DATABASE_URL -c "
EXPLAIN ANALYZE 
SELECT * FROM tickets 
WHERE customer_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 20;
"
```

**Connection Pooling:**
```javascript
// Already configured in Prisma
// Adjust in DATABASE_URL:
DATABASE_URL="postgresql://user:pass@localhost:5432/helpdesk?connection_limit=10"
```

### Application Optimization

**Enable Compression:**
```javascript
// Add to backend/src/index.js
const compression = require('compression');
app.use(compression());
```

**Caching (Future Enhancement):**
```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
app.get('/api/departments', async (req, res) => {
  const cached = await client.get('departments');
  if (cached) return res.json(JSON.parse(cached));
  
  const data = await prisma.department.findMany();
  await client.setex('departments', 3600, JSON.stringify(data));
  res.json(data);
});
```

## 🚨 Incident Response

### Application Crashes

```bash
# Check if running
pm2 status

# View recent logs
pm2 logs helpdesk-backend --lines 100

# Restart application
pm2 restart helpdesk-backend

# If PM2 not responding
pkill -9 node
pm2 resurrect
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND state_change < NOW() - INTERVAL '10 minutes';
"
```

### High CPU/Memory Usage

```bash
# Identify process
top
htop

# Check Node.js memory
pm2 monit

# Restart application
pm2 restart helpdesk-backend

# If memory leak suspected
pm2 restart helpdesk-backend --max-memory-restart 500M
```

### Disk Space Full

```bash
# Check disk usage
df -h

# Find large files
du -sh /var/* | sort -h

# Clean logs
pm2 flush
sudo journalctl --vacuum-time=7d

# Clean old backups
find /backups -name "*.sql.gz" -mtime +30 -delete

# Clean uploads (carefully!)
find backend/uploads -type f -mtime +365 -delete
```

## 📋 Operational Checklists

### Daily Checks
- [ ] Check application health endpoint
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Check backup completion

### Weekly Checks
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Update dependencies (if needed)

### Monthly Checks
- [ ] Database vacuum and analyze
- [ ] Review and archive old data
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill

## 🎯 Non-Goals (Intentional Limitations)

This system does **NOT** currently support:

- ❌ Real-time WebSocket updates (uses polling)
- ❌ Multi-tenancy (multiple organizations)
- ❌ SSO/OAuth providers (only email/password)
- ❌ Email notifications (no SMTP integration)
- ❌ Mobile apps (web-only)
- ❌ Advanced reporting/BI tools
- ❌ Workflow automation/triggers
- ❌ Time tracking
- ❌ Customer portal (separate from main app)

These features can be added in future versions based on requirements.

---

**Last Updated:** January 11, 2026  
**Operations Guide Version:** 1.0
