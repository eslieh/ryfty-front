# performance_config.py
"""
Performance optimizations for the experience API
Includes database indexes, cache configuration, and monitoring
"""

from flask import Flask
from flask_caching import Cache
from sqlalchemy import Index, text
import redis
import logging

# Configure logging for performance monitoring
logging.basicConfig(level=logging.INFO)
perf_logger = logging.getLogger('performance')

# --- Cache Configuration ---
class CacheConfig:
    """Optimized cache configuration for different environments"""
    
    # Redis Configuration (Production)
    REDIS_CONFIG = {
        'CACHE_TYPE': 'RedisCache',
        'CACHE_REDIS_HOST': 'localhost',
        'CACHE_REDIS_PORT': 6379,
        'CACHE_REDIS_DB': 0,
        'CACHE_REDIS_PASSWORD': None,
        'CACHE_DEFAULT_TIMEOUT': 300,
        'CACHE_KEY_PREFIX': 'exp_api:',
        # Redis specific optimizations
        'CACHE_OPTIONS': {
            'connection_pool_kwargs': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_keepalive': True,
                'socket_keepalive_options': {},
                'health_check_interval': 30,
            },
            # Enable compression for large objects
            'compressor': 'gzip',
            'ignore_exc': True,
        }
    }
    
    # Memcached Configuration (Alternative)
    MEMCACHED_CONFIG = {
        'CACHE_TYPE': 'MemcachedCache',
        'CACHE_MEMCACHED_SERVERS': ['127.0.0.1:11211'],
        'CACHE_DEFAULT_TIMEOUT': 300,
        'CACHE_KEY_PREFIX': 'exp_api:',
    }
    
    # Simple Cache (Development)
    SIMPLE_CONFIG = {
        'CACHE_TYPE': 'SimpleCache',
        'CACHE_DEFAULT_TIMEOUT': 300,
    }

# --- Database Optimization ---
class DatabaseOptimizer:
    """Database optimization utilities"""
    
    @staticmethod
    def create_performance_indexes(db):
        """Create database indexes for optimal query performance"""
        
        try:
            with db.engine.connect() as conn:
                # Composite indexes for experience queries
                indexes = [
                    # Main listing query optimization
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_status_start_date_created "
                    "ON experiences (status, start_date, created_at DESC) "
                    "WHERE status = 'published'",
                    
                    # Search optimization
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_search "
                    "ON experiences USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')))",
                    
                    # Destination filtering
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_destinations "
                    "ON experiences USING gin(destinations)",
                    
                    # Activity filtering
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_activities "
                    "ON experiences USING gin(activities)",
                    
                    # Provider lookup
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_provider_status "
                    "ON experiences (provider_id, status, created_at DESC)",
                    
                    # Slot-related indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slot_experience_price "
                    "ON slots (experience_id, price)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slot_experience_date "
                    "ON slots (experience_id, date)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slot_experience_bookings "
                    "ON slots (experience_id, booked DESC, capacity DESC)",
                    
                    # Trending/popularity calculations
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slot_bookings_date "
                    "ON slots (booked DESC, created_at DESC) "
                    "WHERE booked > 0",
                    
                    # User/provider indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role "
                    "ON users (role) "
                    "WHERE role = 'provider'",
                ]
                
                for index_sql in indexes:
                    try:
                        conn.execute(text(index_sql))
                        conn.commit()
                        perf_logger.info(f"Created index: {index_sql.split('idx_')[1].split(' ')[0] if 'idx_' in index_sql else 'unknown'}")
                    except Exception as e:
                        perf_logger.warning(f"Index creation failed: {str(e)}")
                        conn.rollback()
                        
        except Exception as e:
            perf_logger.error(f"Database optimization failed: {str(e)}")
    
    @staticmethod
    def analyze_tables(db):
        """Analyze tables for query optimization"""
        try:
            with db.engine.connect() as conn:
                tables = ['experiences', 'slots', 'users']
                for table in tables:
                    conn.execute(text(f"ANALYZE {table}"))
                    perf_logger.info(f"Analyzed table: {table}")
                conn.commit()
        except Exception as e:
            perf_logger.error(f"Table analysis failed: {str(e)}")
    
    @staticmethod
    def get_query_stats(db):
        """Get query performance statistics"""
        try:
            with db.engine.connect() as conn:
                # Get slow queries (PostgreSQL specific)
                slow_queries = conn.execute(text("""
                    SELECT query, mean_exec_time, calls, total_exec_time,
                           rows, 100.0 * shared_blks_hit / 
                           NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
                    FROM pg_stat_statements 
                    WHERE query LIKE '%experiences%' OR query LIKE '%slots%'
                    ORDER BY mean_exec_time DESC 
                    LIMIT 10
                """)).fetchall()
                
                return [dict(row._mapping) for row in slow_queries]
        except Exception as e:
            perf_logger.error(f"Query stats retrieval failed: {str(e)}")
            return []
    
    @staticmethod
    def optimize_postgresql_settings(db):
        """Apply PostgreSQL-specific optimizations"""
        try:
            with db.engine.connect() as conn:
                # Enable pg_stat_statements if not already enabled
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_stat_statements"))
                
                # Set optimal work_mem for sorting and joins
                conn.execute(text("SET work_mem = '256MB'"))
                
                # Optimize for read-heavy workloads
                conn.execute(text("SET random_page_cost = 1.1"))
                conn.execute(text("SET effective_cache_size = '2GB'"))
                
                # Enable parallel queries
                conn.execute(text("SET max_parallel_workers_per_gather = 4"))
                
                conn.commit()
                perf_logger.info("Applied PostgreSQL optimizations")
                
        except Exception as e:
            perf_logger.warning(f"PostgreSQL optimization failed: {str(e)}")
    
    @staticmethod
    def create_database_functions(db):
        """Create custom database functions for better performance"""
        try:
            with db.engine.connect() as conn:
                # Function to calculate experience popularity score
                conn.execute(text("""
                    CREATE OR REPLACE FUNCTION calculate_popularity_score(experience_id UUID)
                    RETURNS DECIMAL AS $
                    DECLARE
                        score DECIMAL := 0;
                        total_bookings INTEGER := 0;
                        recent_bookings INTEGER := 0;
                        days_since_created INTEGER := 0;
                    BEGIN
                        -- Get total bookings
                        SELECT COALESCE(SUM(booked), 0) INTO total_bookings
                        FROM slots WHERE slots.experience_id = $1;
                        
                        -- Get recent bookings (last 30 days)
                        SELECT COALESCE(SUM(booked), 0) INTO recent_bookings
                        FROM slots s
                        JOIN experiences e ON s.experience_id = e.id
                        WHERE s.experience_id = $1 
                        AND e.created_at > NOW() - INTERVAL '30 days';
                        
                        -- Get days since creation
                        SELECT EXTRACT(days FROM NOW() - created_at) INTO days_since_created
                        FROM experiences WHERE id = $1;
                        
                        -- Calculate score: recent bookings weighted by recency
                        score := recent_bookings * (1.0 - LEAST(days_since_created / 30.0, 1.0)) + 
                                total_bookings * 0.1;
                        
                        RETURN score;
                    END;
                    $ LANGUAGE plpgsql;
                """))
                
                # Function to get available slots count efficiently
                conn.execute(text("""
                    CREATE OR REPLACE FUNCTION get_available_slots(experience_id UUID)
                    RETURNS INTEGER AS $
                    BEGIN
                        RETURN COALESCE(
                            (SELECT SUM(capacity - booked) 
                             FROM slots 
                             WHERE slots.experience_id = $1 
                             AND date >= CURRENT_DATE), 
                            0
                        );
                    END;
                    $ LANGUAGE plpgsql;
                """))
                
                conn.commit()
                perf_logger.info("Created custom database functions")
                
        except Exception as e:
            perf_logger.error(f"Database function creation failed: {str(e)}")
    
    @staticmethod
    def create_triggers_for_cache_invalidation(db):
        """Create triggers to automatically invalidate cache"""
        try:
            with db.engine.connect() as conn:
                # Trigger function to notify cache invalidation
                conn.execute(text("""
                    CREATE OR REPLACE FUNCTION notify_cache_invalidation()
                    RETURNS TRIGGER AS $
                    BEGIN
                        -- Notify cache invalidation with experience ID
                        IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
                            PERFORM pg_notify('cache_invalidate', 
                                'experience:' || COALESCE(NEW.id::text, NEW.experience_id::text));
                            RETURN NEW;
                        ELSIF TG_OP = 'DELETE' THEN
                            PERFORM pg_notify('cache_invalidate', 
                                'experience:' || COALESCE(OLD.id::text, OLD.experience_id::text));
                            RETURN OLD;
                        END IF;
                        RETURN NULL;
                    END;
                    $ LANGUAGE plpgsql;
                """))
                
                # Create triggers on experiences table
                conn.execute(text("""
                    DROP TRIGGER IF EXISTS experience_cache_invalidate ON experiences;
                    CREATE TRIGGER experience_cache_invalidate
                    AFTER INSERT OR UPDATE OR DELETE ON experiences
                    FOR EACH ROW EXECUTE FUNCTION notify_cache_invalidation();
                """))
                
                # Create triggers on slots table
                conn.execute(text("""
                    DROP TRIGGER IF EXISTS slot_cache_invalidate ON slots;
                    CREATE TRIGGER slot_cache_invalidate
                    AFTER INSERT OR UPDATE OR DELETE ON slots
                    FOR EACH ROW EXECUTE FUNCTION notify_cache_invalidation();
                """))
                
                conn.commit()
                perf_logger.info("Created cache invalidation triggers")
                
        except Exception as e:
            perf_logger.error(f"Trigger creation failed: {str(e)}")

# --- Cache Warming ---
class CacheWarmer:
    """Cache warming utilities for better performance"""
    
    def __init__(self, app: Flask, cache: Cache, db):
        self.app = app
        self.cache = cache
        self.db = db
    
    def warm_popular_experiences(self):
        """Pre-populate cache with popular experiences"""
        with self.app.app_context():
            from models import Experience, Slot
            from sqlalchemy import func, desc
            
            try:
                # Get most popular experiences based on bookings
                popular_experiences = (
                    self.db.session.query(Experience)
                    .join(Slot)
                    .filter(Experience.status == 'published')
                    .group_by(Experience.id)
                    .order_by(desc(func.sum(Slot.booked)))
                    .limit(50)
                    .all()
                )
                
                # Cache individual experience details
                from experiences_public import CachedExperience
                from dataclasses import asdict
                
                for exp in popular_experiences:
                    cached_exp = CachedExperience.from_experience(exp)
                    cache_key = f"exp:detail:{exp.id}"
                    self.cache.set(cache_key, asdict(cached_exp), timeout=600)
                
                perf_logger.info(f"Warmed cache with {len(popular_experiences)} popular experiences")
                
            except Exception as e:
                perf_logger.error(f"Cache warming failed: {str(e)}")
    
    def warm_trending_data(self):
        """Pre-populate trending experiences cache"""
        with self.app.app_context():
            try:
                from experiences_public import TrendingExperiences
                trending_resource = TrendingExperiences()
                trending_resource.get()  # This will populate the cache
                perf_logger.info("Warmed trending experiences cache")
            except Exception as e:
                perf_logger.error(f"Trending cache warming failed: {str(e)}")
    
    def warm_filter_options(self):
        """Pre-populate filter options cache"""
        with self.app.app_context():
            try:
                from models import Experience, Slot
                from sqlalchemy import func, distinct
                
                # Pre-calculate filter options
                destinations = (self.db.session.query(func.unnest(Experience.destinations).label('destination'))
                              .filter(Experience.status == 'published')
                              .distinct()
                              .limit(100)
                              .all())
                
                activities = (self.db.session.query(func.unnest(Experience.activities).label('activity'))
                            .filter(Experience.status == 'published')
                            .distinct()
                            .limit(100)
                            .all())
                
                price_range = (self.db.session.query(func.min(Slot.price), func.max(Slot.price))
                              .join(Experience)
                              .filter(Experience.status == 'published')
                              .first())
                
                filter_data = {
                    "destinations": [row.destination for row in destinations if row.destination],
                    "activities": [row.activity for row in activities if row.activity],
                    "price_range": {
                        "min": float(price_range[0]) if price_range[0] else 0,
                        "max": float(price_range[1]) if price_range[1] else 1000
                    }
                }
                
                self.cache.set("filter_options", filter_data, timeout=3600)
                perf_logger.info("Warmed filter options cache")
                
            except Exception as e:
                perf_logger.error(f"Filter options cache warming failed: {str(e)}")
    
    def warm_search_suggestions(self):
        """Pre-populate common search suggestions"""
        with self.app.app_context():
            try:
                from models import Experience
                from collections import Counter
                
                # Get most common words from titles and activities
                experiences = (self.db.session.query(Experience.title, Experience.activities)
                              .filter(Experience.status == 'published')
                              .all())
                
                word_count = Counter()
                for title, activities in experiences:
                    # Extract words from title
                    words = title.lower().split()
                    word_count.update(word for word in words if len(word) > 3)
                    
                    # Extract from activities
                    if activities:
                        word_count.update(activity.lower() for activity in activities)
                
                # Cache top suggestions
                top_suggestions = [word for word, count in word_count.most_common(50)]
                self.cache.set("search_suggestions:popular", top_suggestions, timeout=1800)
                
                perf_logger.info("Warmed search suggestions cache")
                
            except Exception as e:
                perf_logger.error(f"Search suggestions cache warming failed: {str(e)}")
    
    def schedule_cache_warming(self):
        """Schedule periodic cache warming (integrate with Celery/APScheduler)"""
        try:
            # This would typically use Celery beat or APScheduler
            import schedule
            import time
            import threading
            
            def run_scheduled_warming():
                schedule.every(10).minutes.do(self.warm_trending_data)
                schedule.every(30).minutes.do(self.warm_popular_experiences)
                schedule.every(1).hours.do(self.warm_filter_options)
                schedule.every(2).hours.do(self.warm_search_suggestions)
                
                while True:
                    schedule.run_pending()
                    time.sleep(60)  # Check every minute
            
            # Run in background thread
            warming_thread = threading.Thread(target=run_scheduled_warming, daemon=True)
            warming_thread.start()
            
            perf_logger.info("Scheduled cache warming started")
            
        except ImportError:
            perf_logger.warning("Schedule library not installed, skipping automatic cache warming")
        except Exception as e:
            perf_logger.error(f"Cache warming scheduling failed: {str(e)}")

# --- Performance Monitoring ---
class PerformanceMonitor:
    """Monitor API performance metrics"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
        self.metrics = {}
    
    def get_cache_stats(self):
        """Get cache hit/miss statistics"""
        try:
            if hasattr(self.cache.cache, 'info'):
                # Redis stats
                info = self.cache.cache.info()
                return {
                    'cache_hits': info.get('keyspace_hits', 0),
                    'cache_misses': info.get('keyspace_misses', 0),
                    'hit_rate': info.get('keyspace_hits', 0) / max(
                        info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1
                    ) * 100,
                    'memory_usage': info.get('used_memory_human', '0B'),
                    'memory_peak': info.get('used_memory_peak_human', '0B'),
                    'connected_clients': info.get('connected_clients', 0),
                    'commands_processed': info.get('total_commands_processed', 0),
                    'expired_keys': info.get('expired_keys', 0),
                    'evicted_keys': info.get('evicted_keys', 0)
                }
        except Exception as e:
            perf_logger.error(f"Cache stats retrieval failed: {str(e)}")
        
        return {}
    
    def log_query_performance(self, query_type: str, duration: float, cache_hit: bool = False, 
                            result_count: int = 0):
        """Log query performance metrics"""
        perf_logger.info(
            f"Query: {query_type} | Duration: {duration:.3f}s | Cached: {cache_hit} | Results: {result_count}"
        )
        
        # Store metrics for analysis
        if query_type not in self.metrics:
            self.metrics[query_type] = {
                'total_requests': 0,
                'total_time': 0,
                'cache_hits': 0,
                'avg_results': 0
            }
        
        self.metrics[query_type]['total_requests'] += 1
        self.metrics[query_type]['total_time'] += duration
        if cache_hit:
            self.metrics[query_type]['cache_hits'] += 1
        self.metrics[query_type]['avg_results'] = (
            (self.metrics[query_type]['avg_results'] + result_count) / 2
        )
    
    def get_performance_summary(self):
        """Get performance summary statistics"""
        summary = {}
        for query_type, stats in self.metrics.items():
            if stats['total_requests'] > 0:
                summary[query_type] = {
                    'avg_response_time': stats['total_time'] / stats['total_requests'],
                    'cache_hit_rate': stats['cache_hits'] / stats['total_requests'] * 100,
                    'total_requests': stats['total_requests'],
                    'avg_result_count': stats['avg_results']
                }
        return summary
    
    def get_top_cached_keys(self, pattern="exp:*", limit=20):
        """Get most frequently accessed cache keys"""
        try:
            if hasattr(self.cache.cache, 'scan_iter'):
                keys = list(self.cache.cache.scan_iter(match=pattern, count=limit * 5))
                
                # Get key info with TTL
                key_info = []
                for key in keys[:limit]:
                    key_name = key.decode() if isinstance(key, bytes) else key
                    ttl = self.cache.cache.ttl(key_name)
                    size = self.cache.cache.memory_usage(key_name) if hasattr(self.cache.cache, 'memory_usage') else 0
                    
                    key_info.append({
                        'key': key_name,
                        'ttl': ttl,
                        'memory_usage': size
                    })
                
                return key_info
        except Exception as e:
            perf_logger.error(f"Key analysis failed: {str(e)}")
        
        return []
    
    def get_slow_cache_operations(self):
        """Identify slow cache operations"""
        try:
            if hasattr(self.cache.cache, 'slowlog_get'):
                slow_logs = self.cache.cache.slowlog_get(10)
                return [
                    {
                        'command': log['command'],
                        'duration': log['duration'],
                        'timestamp': log['start_time']
                    }
                    for log in slow_logs
                ]
        except Exception:
            pass
        
        return []

# --- Advanced Cache Strategies ---
class AdvancedCacheStrategy:
    """Advanced caching strategies for optimal performance"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
    
    def cache_aside_pattern(self, key: str, fetch_function, ttl: int = 300):
        """Implement cache-aside pattern with error handling"""
        try:
            # Try to get from cache first
            cached_data = self.cache.get(key)
            if cached_data is not None:
                return cached_data, True  # Return data and cache hit flag
            
            # Cache miss - fetch from source
            data = fetch_function()
            
            # Store in cache
            self.cache.set(key, data, timeout=ttl)
            
            return data, False  # Return data and cache miss flag
            
        except Exception as e:
            perf_logger.error(f"Cache aside pattern failed for key {key}: {str(e)}")
            # Fallback to direct fetch
            return fetch_function(), False
    
    def write_through_pattern(self, key: str, data: dict, store_function, ttl: int = 300):
        """Implement write-through pattern"""
        try:
            # Write to primary storage first
            result = store_function(data)
            
            # Then update cache
            self.cache.set(key, result, timeout=ttl)
            
            return result
            
        except Exception as e:
            perf_logger.error(f"Write-through pattern failed for key {key}: {str(e)}")
            raise
    
    def cache_warming_pattern(self, keys_and_functions: list):
        """Warm cache with multiple keys in batch"""
        warmed_count = 0
        
        for key, fetch_function, ttl in keys_and_functions:
            try:
                if not self.cache.get(key):
                    data = fetch_function()
                    self.cache.set(key, data, timeout=ttl)
                    warmed_count += 1
            except Exception as e:
                perf_logger.error(f"Cache warming failed for key {key}: {str(e)}")
        
        perf_logger.info(f"Warmed {warmed_count} cache keys")
        return warmed_count
    
    def intelligent_ttl(self, key: str, base_ttl: int = 300, popularity_factor: float = 1.0):
        """Calculate intelligent TTL based on data popularity"""
        # Popular data gets longer TTL
        adjusted_ttl = int(base_ttl * (1 + popularity_factor))
        
        # Cap the maximum TTL
        max_ttl = 3600  # 1 hour
        return min(adjusted_ttl, max_ttl)

# --- Configuration Setup ---
def setup_performance_optimizations(app: Flask, db, cache: Cache):
    """Setup all performance optimizations"""
    
    # Apply database optimizations
    with app.app_context():
        optimizer = DatabaseOptimizer()
        optimizer.create_performance_indexes(db)
        optimizer.analyze_tables(db)
        optimizer.optimize_postgresql_settings(db)
        optimizer.create_database_functions(db)
        optimizer.create_triggers_for_cache_invalidation(db)
    
    # Setup cache warming
    warmer = CacheWarmer(app, cache, db)
    
    # Setup monitoring
    monitor = PerformanceMonitor(cache)
    
    # Setup advanced caching
    cache_strategy = AdvancedCacheStrategy(cache)
    
    # Schedule initial cache warming
    @app.before_first_request
    def warm_caches():
        try:
            warmer.warm_trending_data()
            warmer.warm_popular_experiences()
            warmer.warm_filter_options()
            warmer.warm_search_suggestions()
            warmer.schedule_cache_warming()
        except Exception as e:
            perf_logger.error(f"Initial cache warming failed: {str(e)}")
    
    # Add performance monitoring endpoint
    @app.route('/api/performance/stats')
    def performance_stats():
        return {
            'cache_stats': monitor.get_cache_stats(),
            'performance_summary': monitor.get_performance_summary(),
            'top_cached_keys': monitor.get_top_cached_keys(),
            'slow_cache_ops': monitor.get_slow_cache_operations(),
            'database_stats': optimizer.get_query_stats(db)
        }
    
    # Add cache management endpoints
    @app.route('/api/performance/cache/warm', methods=['POST'])
    def warm_cache():
        try:
            warmer.warm_trending_data()
            warmer.warm_popular_experiences()
            warmer.warm_filter_options()
            return {"message": "Cache warming completed", "status": "success"}, 200
        except Exception as e:
            return {"error": str(e), "status": "failed"}, 500
    
    @app.route('/api/performance/cache/clear', methods=['POST'])
    def clear_cache():
        try:
            cache.clear()
            return {"message": "Cache cleared", "status": "success"}, 200
        except Exception as e:
            return {"error": str(e), "status": "failed"}, 500
    
    return {
        'optimizer': optimizer,
        'warmer': warmer,
        'monitor': monitor,
        'cache_strategy': cache_strategy
    }

# --- Utility Functions ---
def get_optimal_cache_config(environment='production'):
    """Get optimal cache configuration for environment"""
    configs = {
        'production': CacheConfig.REDIS_CONFIG,
        'staging': CacheConfig.REDIS_CONFIG,
        'development': CacheConfig.SIMPLE_CONFIG,
        'testing': CacheConfig.SIMPLE_CONFIG
    }
    return configs.get(environment, CacheConfig.SIMPLE_CONFIG)

def setup_cache_backend(app: Flask, environment='production'):
    """Setup optimized cache backend"""
    cache_config = get_optimal_cache_config(environment)
    
    # Apply configuration
    for key, value in cache_config.items():
        app.config[key] = value
    
    # Initialize cache
    cache = Cache(app)
    
    # Test cache connection
    try:
        cache.set('health_check', 'ok', timeout=10)
        if cache.get('health_check') == 'ok':
            perf_logger.info(f"Cache backend ({cache_config['CACHE_TYPE']}) initialized successfully")
        else:
            perf_logger.warning("Cache backend test failed")
    except Exception as e:
        perf_logger.error(f"Cache backend initialization failed: {str(e)}")
    
    return cache

# --- Advanced Optimizations ---
class QueryOptimizer:
    """Advanced query optimization techniques"""
    
    @staticmethod
    def optimize_experience_queries(db):
        """Create materialized views for common queries"""
        
        materialized_views = [
            # Experience summary view with pre-calculated slot data
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS experience_summary AS
            SELECT 
                e.id,
                e.title,
                e.description,
                e.destinations,
                e.activities,
                e.poster_image_url,
                e.start_date,
                e.end_date,
                e.status,
                e.meeting_point,
                e.provider_id,
                e.created_at,
                e.updated_at,
                u.name as provider_name,
                u.avatar_url as provider_avatar,
                COALESCE(s.min_price, 0) as min_price,
                COALESCE(s.max_price, 0) as max_price,
                COALESCE(s.total_capacity, 0) as total_slots,
                COALESCE(s.total_capacity - s.total_booked, 0) as available_slots,
                COALESCE(s.total_booked, 0) as total_bookings,
                calculate_popularity_score(e.id) as popularity_score
            FROM experiences e
            LEFT JOIN users u ON e.provider_id = u.id
            LEFT JOIN (
                SELECT 
                    experience_id,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    SUM(capacity) as total_capacity,
                    SUM(booked) as total_booked
                FROM slots 
                WHERE date >= CURRENT_DATE
                GROUP BY experience_id
            ) s ON e.id = s.experience_id
            WHERE e.status = 'published'
            """,
            
            # Trending experiences view with time-based scoring
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS trending_experiences AS
            SELECT 
                es.*,
                CASE 
                    WHEN es.created_at > NOW() - INTERVAL '7 days' THEN es.popularity_score * 2.0
                    WHEN es.created_at > NOW() - INTERVAL '30 days' THEN es.popularity_score * 1.5
                    ELSE es.popularity_score
                END as trending_score
            FROM experience_summary es
            WHERE es.start_date >= CURRENT_DATE
            ORDER BY trending_score DESC, es.created_at DESC
            LIMIT 100
            """,
            
            # Popular destinations view
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS popular_destinations AS
            SELECT 
                destination,
                COUNT(*) as experience_count,
                AVG(min_price) as avg_min_price,
                AVG(max_price) as avg_max_price,
                SUM(total_bookings) as total_bookings
            FROM experience_summary,
            unnest(destinations) as destination
            GROUP BY destination
            ORDER BY experience_count DESC, total_bookings DESC
            LIMIT 50
            """
        ]
        
        try:
            with db.engine.connect() as conn:
                for view_sql in materialized_views:
                    conn.execute(text(view_sql))
                    conn.commit()
                
                # Create indexes on materialized views
                index_sqls = [
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_summary_status_date "
                    "ON experience_summary (status, start_date, created_at DESC)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_summary_popularity "
                    "ON experience_summary (popularity_score DESC, created_at DESC)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trending_score "
                    "ON trending_experiences (trending_score DESC, created_at DESC)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_popular_destinations_count "
                    "ON popular_destinations (experience_count DESC, total_bookings DESC)"
                ]
                
                for index_sql in index_sqls:
                    conn.execute(text(index_sql))
                    conn.commit()
                
                perf_logger.info("Materialized views and indexes created successfully")
                
        except Exception as e:
            perf_logger.error(f"Materialized view creation failed: {str(e)}")
    
    @staticmethod
    def refresh_materialized_views(db):
        """Refresh materialized views (should be scheduled)"""
        try:
            with db.engine.connect() as conn:
                views = ['experience_summary', 'trending_experiences', 'popular_destinations']
                for view in views:
                    conn.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"))
                    conn.commit()
                    perf_logger.info(f"Refreshed materialized view: {view}")
        except Exception as e:
            perf_logger.error(f"Materialized view refresh failed: {str(e)}")
    
    @staticmethod
    def setup_view_refresh_schedule(db):
        """Setup automated materialized view refresh"""
        try:
            with db.engine.connect() as conn:
                # Create a function to refresh all views
                conn.execute(text("""
                    CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
                    RETURNS void AS $
                    BEGIN
                        REFRESH MATERIALIZED VIEW CONCURRENTLY experience_summary;
                        REFRESH MATERIALIZED VIEW CONCURRENTLY trending_experiences;
                        REFRESH MATERIALIZED VIEW CONCURRENTLY popular_destinations;
                    END;
                    $ LANGUAGE plpgsql;
                """))
                
                conn.commit()
                perf_logger.info("Created materialized view refresh function")
                
        except Exception as e:
            perf_logger.error(f"View refresh schedule setup failed: {str(e)}")

# --- Connection Pooling Optimization ---
def setup_database_pool(app: Flask):
    """Optimize database connection pooling"""
    
    # SQLAlchemy engine optimization
    engine_config = {
        'pool_size': 20,           # Base connection pool size
        'max_overflow': 30,        # Additional connections when pool exhausted
        'pool_pre_ping': True,     # Validate connections before use
        'pool_recycle': 3600,      # Recycle connections every hour
        'pool_timeout': 30,        # Timeout for getting connection from pool
        'echo': False,             # Disable SQL logging in production
        'connect_args': {
            # PostgreSQL specific optimizations
            'options': '-c statement_timeout=30000 -c lock_timeout=10000',
            'application_name': 'experience_api',
            'connect_timeout': 10
        }
    }
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_config
    
    perf_logger.info("Database connection pool optimized")
    
    return engine_config

# --- Memory Optimization ---
class MemoryOptimizer:
    """Memory usage optimization utilities"""
    
    @staticmethod
    def optimize_sqlalchemy_sessions():
        """Configure SQLAlchemy session for memory efficiency"""
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import event
        
        # Configure session to expire objects after commit
        @event.listens_for(sessionmaker, 'after_commit')
        def expire_all(session):
            session.expire_all()
    
    @staticmethod
    def setup_garbage_(interval=300):
        """Setup periodic garbage collection"""
        import gc
        import threading
        import time
        
        def run_gc():
            while True:
                time.sleep(interval)
                gc.collect()
                perf_logger.info("Garbage collection executed")
        
        gc_thread = threading.Thread(target=run_gc, daemon=True)
        gc_thread.start()
        perf_logger.info("Garbage collection thread started")

# --- Cache Warming ---
class CacheWarmer:
    """Cache warming utilities for better performance"""
    
    def __init__(self, app: Flask, cache: Cache, db):
        self.app = app
        self.cache = cache
        self.db = db
    
    def warm_popular_experiences(self):
        """Pre-populate cache with popular experiences"""
        with self.app.app_context():
            from models import Experience, Slot
            from sqlalchemy import func, desc
            
            try:
                # Get most popular experiences
                popular_experiences = (
                    self.db.session.query(Experience)
                    .join(Slot)
                    .filter(Experience.status == 'published')
                    .group_by(Experience.id)
                    .order_by(desc(func.sum(Slot.booked)))
                    .limit(50)
                    .all()
                )
                
                # Cache individual experience details
                from experiences_public import CachedExperience
                from dataclasses import asdict
                
                for exp in popular_experiences:
                    cached_exp = CachedExperience.from_experience(exp)
                    cache_key = f"exp:detail:{exp.id}"
                    self.cache.set(cache_key, asdict(cached_exp), timeout=600)
                
                perf_logger.info(f"Warmed cache with {len(popular_experiences)} popular experiences")
                
            except Exception as e:
                perf_logger.error(f"Cache warming failed: {str(e)}")
    
    def warm_trending_data(self):
        """Pre-populate trending experiences cache"""
        with self.app.app_context():
            try:
                from experiences_public import TrendingExperiences
                trending_resource = TrendingExperiences()
                trending_resource.get()  # This will populate the cache
                perf_logger.info("Warmed trending experiences cache")
            except Exception as e:
                perf_logger.error(f"Trending cache warming failed: {str(e)}")
    
    def schedule_cache_warming(self):
        """Schedule periodic cache warming"""
        # This would integrate with Celery or APScheduler
        pass

# --- Performance Monitoring ---
class PerformanceMonitor:
    """Monitor API performance metrics"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
    
    def get_cache_stats(self):
        """Get cache hit/miss statistics"""
        try:
            if hasattr(self.cache.cache, 'info'):
                # Redis stats
                info = self.cache.cache.info()
                return {
                    'cache_hits': info.get('keyspace_hits', 0),
                    'cache_misses': info.get('keyspace_misses', 0),
                    'hit_rate': info.get('keyspace_hits', 0) / max(
                        info.get('keyspace_hits', 0) + info.get('keyspace_misses', 0), 1
                    ) * 100,
                    'memory_usage': info.get('used_memory_human', '0B'),
                    'connected_clients': info.get('connected_clients', 0)
                }
        except Exception as e:
            perf_logger.error(f"Cache stats retrieval failed: {str(e)}")
        
        return {}
    
    def log_query_performance(self, query_type: str, duration: float, cache_hit: bool = False):
        """Log query performance metrics"""
        perf_logger.info(
            f"Query: {query_type} | Duration: {duration:.3f}s | Cached: {cache_hit}"
        )
    
    def get_top_cached_keys(self):
        """Get most frequently accessed cache keys"""
        try:
            if hasattr(self.cache.cache, 'scan_iter'):
                keys = list(self.cache.cache.scan_iter(match="exp:*", count=100))
                return keys[:20]  # Top 20
        except Exception:
            pass
        return []

# --- Configuration Setup ---
def setup_performance_optimizations(app: Flask, db, cache: Cache):
    """Setup all performance optimizations"""
    
    # Apply database optimizations
    with app.app_context():
        optimizer = DatabaseOptimizer()
        optimizer.create_performance_indexes(db)
        optimizer.analyze_tables(db)
    
    # Setup cache warming
    warmer = CacheWarmer(app, cache, db)
    
    # Schedule initial cache warming
    @app.before_first_request
    def warm_caches():
        try:
            warmer.warm_trending_data()
            warmer.warm_popular_experiences()
        except Exception as e:
            perf_logger.error(f"Initial cache warming failed: {str(e)}")
    
    # Setup monitoring
    monitor = PerformanceMonitor(cache)
    
    # Add performance monitoring endpoint
    @app.route('/api/performance/stats')
    def performance_stats():
        return {
            'cache_stats': monitor.get_cache_stats(),
            'top_cached_keys': monitor.get_top_cached_keys(),
            'database_stats': optimizer.get_query_stats(db)
        }
    
    return {
        'optimizer': optimizer,
        'warmer': warmer,
        'monitor': monitor
    }

# --- Utility Functions ---
def get_optimal_cache_config(environment='production'):
    """Get optimal cache configuration for environment"""
    configs = {
        'production': CacheConfig.REDIS_CONFIG,
        'staging': CacheConfig.REDIS_CONFIG,
        'development': CacheConfig.SIMPLE_CONFIG,
        'testing': CacheConfig.SIMPLE_CONFIG
    }
    return configs.get(environment, CacheConfig.SIMPLE_CONFIG)

def setup_cache_backend(app: Flask, environment='production'):
    """Setup optimized cache backend"""
    cache_config = get_optimal_cache_config(environment)
    
    # Apply configuration
    for key, value in cache_config.items():
        app.config[key] = value
    
    # Initialize cache
    cache = Cache(app)
    
    # Test cache connection
    try:
        cache.set('health_check', 'ok', timeout=10)
        if cache.get('health_check') == 'ok':
            perf_logger.info(f"Cache backend ({cache_config['CACHE_TYPE']}) initialized successfully")
        else:
            perf_logger.warning("Cache backend test failed")
    except Exception as e:
        perf_logger.error(f"Cache backend initialization failed: {str(e)}")
    
    return cache

# --- Advanced Optimizations ---
class QueryOptimizer:
    """Advanced query optimization techniques"""
    
    @staticmethod
    def optimize_experience_queries(db):
        """Create materialized views for common queries"""
        
        materialized_views = [
            # Experience summary view with pre-calculated slot data
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS experience_summary AS
            SELECT 
                e.id,
                e.title,
                e.description,
                e.destinations,
                e.activities,
                e.poster_image_url,
                e.start_date,
                e.end_date,
                e.status,
                e.meeting_point,
                e.provider_id,
                e.created_at,
                e.updated_at,
                u.name as provider_name,
                u.avatar_url as provider_avatar,
                COALESCE(s.min_price, 0) as min_price,
                COALESCE(s.max_price, 0) as max_price,
                COALESCE(s.total_capacity, 0) as total_slots,
                COALESCE(s.total_capacity - s.total_booked, 0) as available_slots,
                COALESCE(s.total_booked, 0) as total_bookings
            FROM experiences e
            LEFT JOIN users u ON e.provider_id = u.id
            LEFT JOIN (
                SELECT 
                    experience_id,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    SUM(capacity) as total_capacity,
                    SUM(booked) as total_booked
                FROM slots 
                GROUP BY experience_id
            ) s ON e.id = s.experience_id
            WHERE e.status = 'published'
            """,
            
            # Trending experiences view
            """
            CREATE MATERIALIZED VIEW IF NOT EXISTS trending_experiences AS
            SELECT 
                e.*,
                COALESCE(recent_bookings.booking_score, 0) as popularity_score
            FROM experience_summary e
            LEFT JOIN (
                SELECT 
                    s.experience_id,
                    SUM(s.booked) * (1.0 - EXTRACT(days FROM NOW() - e.created_at) / 30.0) as booking_score
                FROM slots s
                JOIN experiences e ON s.experience_id = e.id
                WHERE e.created_at > NOW() - INTERVAL '30 days'
                GROUP BY s.experience_id, e.created_at
            ) recent_bookings ON e.id = recent_bookings.experience_id
            ORDER BY popularity_score DESC, e.created_at DESC
            """
        ]
        
        try:
            with db.engine.connect() as conn:
                for view_sql in materialized_views:
                    conn.execute(text(view_sql))
                    conn.commit()
                
                # Create indexes on materialized views
                index_sqls = [
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experience_summary_status_date "
                    "ON experience_summary (status, start_date, created_at DESC)",
                    
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trending_score "
                    "ON trending_experiences (popularity_score DESC, created_at DESC)"
                ]
                
                for index_sql in index_sqls:
                    conn.execute(text(index_sql))
                    conn.commit()
                
                perf_logger.info("Materialized views and indexes created successfully")
                
        except Exception as e:
            perf_logger.error(f"Materialized view creation failed: {str(e)}")
    
    @staticmethod
    def refresh_materialized_views(db):
        """Refresh materialized views (should be scheduled)"""
        try:
            with db.engine.connect() as conn:
                views = ['experience_summary', 'trending_experiences']
                for view in views:
                    conn.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"))
                    conn.commit()
                    perf_logger.info(f"Refreshed materialized view: {view}")
        except Exception as e:
            perf_logger.error(f"Materialized view refresh failed: {str(e)}")

# --- Connection Pooling Optimization ---
def setup_database_pool(app: Flask):
    """Optimize database connection pooling"""
    
    # SQLAlchemy engine optimization
    engine_config = {
        'pool_size': 20,           # Base connection pool size
        'max_overflow': 30,        # Additional connections when pool exhausted
        'pool_pre_ping': True,     # Validate connections before use
        'pool_recycle': 3600,      # Recycle connections every hour
        'echo': False,             # Disable SQL logging in production
        'connect_args': {
            # PostgreSQL specific optimizations
            'options': '-c statement_timeout=30000'  # 30 second statement timeout
        }
    }
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_config
    
    perf_logger.info("Database connection pool optimized")
    
    return engine_config