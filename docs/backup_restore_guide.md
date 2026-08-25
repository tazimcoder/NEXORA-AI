# NEXORA AI — Database Backup and Disaster Recovery Procedure Guide

This document outlines backup, snapshot, and disaster recovery restore procedures for MySQL and Redis.

---

## 1. MySQL Database Backup Procedure

### Automated Backup Command (`mysqldump`)
```bash
# Export full database schema and data payload to compressed backup file
mysqldump -u nexora_prod_user -p --single-transaction --quick nexora_ai_production | gzip > /backups/nexora_mysql_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 2. MySQL Database Restore Procedure

### Restore Command
```bash
# Decompress and import backup snapshot into target MySQL database
gunzip < /backups/nexora_mysql_20260822_150000.sql.gz | mysql -u nexora_prod_user -p nexora_ai_production
```

---

## 3. Redis Snapshot & Backup Procedure

```bash
# Trigger Redis background snapshot
redis-cli -h redis.internal.nexora.ai BGSAVE

# Copy dump.rdb snapshot file to backup storage
cp /var/lib/redis/dump.rdb /backups/redis_dump_$(date +%Y%m%d_%H%M%S).rdb
```

---

## 4. Redis Restore Procedure

```bash
# Stop Redis, place dump.rdb in data directory, and start Redis
service redis-server stop
cp /backups/redis_dump_20260822_150000.rdb /var/lib/redis/dump.rdb
service redis-server start
```
