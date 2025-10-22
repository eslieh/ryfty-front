from flask_restful import Resource
from sqlalchemy.sql import func
from flask import request, current_app
from flask_caching import Cache
from models import db, Experience, User, Slot
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy import and_, or_, func, desc, asc, cast, String, select
from sqlalchemy.orm import joinedload, selectinload, aliased
from datetime import datetime, date, timedelta
from decimal import Decimal
from functools import wraps
import json
import base64
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
import hashlib

# Configure logging
logger = logging.getLogger(__name__)

# --- Data Classes for Caching ---
@dataclass
class CachedExperience:
    """Optimized experience data for caching"""
    id: str
    title: str
    description: str
    destinations: List[str]
    inclusions: List[str]
    exclusions: List[str]
    images: Dict[str, Any]
    activities: List[str]
    poster_image_url: str
    start_date: str  # ISO format
    end_date: Optional[str]
    status: str
    meeting_point: Dict[str, Any]
    provider_name: str
    provider_avatar: Optional[str]
    min_price: float
    max_price: float
    total_slots: int
    available_slots: int
    avg_rating: int
    created_at: str
    updated_at: str
    
    @classmethod
    def from_experience(cls, experience, provider_data=None):
        """Create from Experience model with slot aggregation"""
        slots = experience.slots or []
        prices = [float(slot.price) for slot in slots if slot.price > 0]
        
        return cls(
            id=str(experience.id),
            title=experience.title,
            description=experience.description or "",
            destinations=experience.destinations or [],
            inclusions=experience.inclusions or [],
            exclusions=experience.exclusions or [],
            activities=experience.activities or [],
            poster_image_url=experience.poster_image_url,
            start_date=experience.start_date.isoformat() if experience.start_date else None,
            end_date=experience.end_date.isoformat() if experience.end_date else None,
            status=experience.status,
            images = experience.images if experience.images else None,
            meeting_point=experience.meeting_point or {},
            provider_name=provider_data.get('name', '') if provider_data else (experience.provider.name if experience.provider else ''),
            provider_avatar=provider_data.get('avatar_url') if provider_data else (experience.provider.avatar_url if experience.provider else None),
            min_price=min(prices) if prices else 0.0,
            max_price=max(prices) if prices else 0.0,
            total_slots=sum(slot.capacity for slot in slots),
            available_slots=sum(slot.capacity - slot.booked for slot in slots),
            created_at=experience.created_at.isoformat() if experience.created_at else None,
            updated_at=experience.updated_at.isoformat() if experience.updated_at else None,
            avg_rating = experience.avg_rating if experience.avg_rating else 0
        )

@dataclass
class CacheConfig:
    """Cache configuration for different data types"""
    EXPERIENCE_LIST_TTL = 300  # 5 minutes
    EXPERIENCE_DETAIL_TTL = 600  # 10 minutes
    HOT_EXPERIENCES_TTL = 1800  # 30 minutes
    PROVIDER_DATA_TTL = 900  # 15 minutes
    TRENDING_TTL = 3600  # 1 hour

# --- Schemas ---
class ExperienceFilterSchema(Schema):
    """Schema for filtering experiences"""
    destinations = fields.List(fields.Str(), missing=[])
    activities = fields.List(fields.Str(), missing=[])
    min_price = fields.Float(missing=0, validate=validate.Range(min=0))
    max_price = fields.Float(missing=None)
    start_date_from = fields.Date(missing=None)
    start_date_to = fields.Date(missing=None)
    status = fields.Str(missing="published", validate=validate.OneOf(["published", "draft", "archived"]))
    search = fields.Str(missing="", validate=validate.Length(max=100))
    limit = fields.Int(missing=20, validate=validate.Range(min=1, max=100))
    cursor = fields.Str(missing=None)
    sort_by = fields.Str(missing="created_at", validate=validate.OneOf([
        "created_at", "start_date", "price_asc", "price_desc", "popularity", "availability"
    ]))
    test = fields.Bool(missing=False)

class PublicExperienceSchema(Schema):
    """Public experience schema for API responses"""
    id = fields.Str()
    title = fields.Str()
    description = fields.Str()
    destinations = fields.List(fields.Str())
    activities = fields.List(fields.Str())
    poster_image_url = fields.Url()
    images  = fields.Dict()
    inclusions = fields.List(fields.Str())
    exclusions = fields.List(fields.Str())
    start_date = fields.Date()
    end_date = fields.Date()
    start_time = fields.Time(required=True)  
    end_time = fields.Time(required=True)  
    timezone = fields.Str(required=True, validate=validate.Length(min=2, max=64))
    meeting_point = fields.Dict()
    provider_name = fields.Str()
    provider_avatar = fields.Url()
    min_price = fields.Float()
    max_price = fields.Float()
    total_slots = fields.Int()
    available_slots = fields.Int()
    avg_rating = fields.Int()
    created_at = fields.DateTime()

# Initialize schemas
filter_schema = ExperienceFilterSchema()
public_experience_schema = PublicExperienceSchema()

# --- Cache Utilities ---
class ExperienceCache:
    """High-performance caching utility for experiences"""
    
    def __init__(self, cache: Cache):
        self.cache = cache
        self.config = CacheConfig()
    
    def _generate_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate deterministic cache key"""
        key_parts = [prefix]
        
        # Sort kwargs for consistent key generation
        for k, v in sorted(kwargs.items()):
            if v is not None:
                if isinstance(v, (list, dict)):
                    v = json.dumps(v, sort_keys=True)
                key_parts.append(f"{k}:{v}")
        
        key_string = "|".join(key_parts)
        return f"exp:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    def get_experience_list(self, **filters) -> Optional[List[Dict]]:
        """Get cached experience list"""
        cache_key = self._generate_cache_key("list", **filters)
        return self.cache.get(cache_key)
    
    def set_experience_list(self, experiences: List[Dict], **filters) -> None:
        """Cache experience list"""
        cache_key = self._generate_cache_key("list", **filters)
        self.cache.set(cache_key, experiences, timeout=self.config.EXPERIENCE_LIST_TTL)
    
    def get_hot_experiences(self) -> Optional[List[Dict]]:
        """Get hot/trending experiences"""
        return self.cache.get("exp:hot:all")
    
    def set_hot_experiences(self, experiences: List[Dict]) -> None:
        """Cache hot experiences"""
        self.cache.set("exp:hot:all", experiences, timeout=self.config.HOT_EXPERIENCES_TTL)
    
    def get_provider_data(self, provider_id: str) -> Optional[Dict]:
        """Get cached provider data"""
        return self.cache.get(f"provider:{provider_id}")
    
    def set_provider_data(self, provider_id: str, data: Dict) -> None:
        """Cache provider data"""
        self.cache.set(f"provider:{provider_id}", data, timeout=self.config.PROVIDER_DATA_TTL)
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate cache keys matching pattern"""
        # Note: This requires Redis and python-redis with scan support
        try:
            if hasattr(self.cache.cache, 'scan_iter'):
                for key in self.cache.cache.scan_iter(match=pattern):
                    self.cache.delete(key.decode() if isinstance(key, bytes) else key)
        except Exception as e:
            logger.warning(f"Cache invalidation failed: {e}")

# --- Cursor Utilities ---
class CursorPagination:
    """Cursor-based pagination for high performance"""
    
    @staticmethod
    def encode_cursor(experience_id: str, sort_value: Any) -> str:
        """Encode cursor for pagination"""
        cursor_data = {
            'id': experience_id,
            'sort_value': str(sort_value) if sort_value is not None else None
        }
        cursor_json = json.dumps(cursor_data)
        return base64.b64encode(cursor_json.encode()).decode()
    
    @staticmethod
    def decode_cursor(cursor: str) -> Dict[str, Any]:
        """Decode cursor for pagination"""
        try:
            cursor_json = base64.b64decode(cursor.encode()).decode()
            return json.loads(cursor_json)
        except Exception:
            return {}
    
    @staticmethod
    def build_query_conditions(cursor_data: Dict, sort_by: str):
        """Build SQLAlchemy conditions for cursor pagination"""
        if not cursor_data or not cursor_data.get('id'):
            return None
        
        experience_id = cursor_data['id']
        sort_value = cursor_data.get('sort_value')
        
        if sort_by == "created_at":
            if sort_value:
                return or_(
                    Experience.created_at < datetime.fromisoformat(sort_value),
                    and_(Experience.created_at == datetime.fromisoformat(sort_value), Experience.id > experience_id)
                )
        elif sort_by == "start_date":
            if sort_value:
                return or_(
                    Experience.start_date > datetime.fromisoformat(sort_value).date(),
                    and_(Experience.start_date == datetime.fromisoformat(sort_value).date(), Experience.id > experience_id)
                )
        elif sort_by in ["price_asc", "price_desc"]:
            # For price sorting, we'll need to join with slots
            return Experience.id > experience_id  # Simplified for now
        
        return Experience.id > experience_id

# --- Performance Decorators ---
def with_caching(cache_func=None):
    """Decorator to add caching to resource methods"""
    def decorator(f):
        @wraps(f)
        def decorated(self, *args, **kwargs):
            if cache_func:
                cached_result = cache_func(self, *args, **kwargs)
                if cached_result:
                    return cached_result
            
            result = f(self, *args, **kwargs)
            
            # Cache the result if it's successful
            if hasattr(result, '__len__') and len(result) == 2:
                data, status = result
                if status == 200 and cache_func:
                    # Store in cache (implement based on your caching strategy)
                    pass
            
            return result
        return decorated
    return decorator

def handle_db_errors(f):
    """Decorator to handle database errors"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Database error in {f.__name__}: {str(e)}")
            return {"error": "Service temporarily unavailable"}, 503
    return decorated

# --- Main Resource ---
class PublicExperienceList(Resource):
    """High-performance public experience listing with caching and cursor pagination"""
    
    def __init__(self):
        self.cache_util = ExperienceCache(current_app.cache)
        self.pagination = CursorPagination()
    
    @handle_db_errors
    def get(self):
        """Get experiences with advanced filtering, sorting, and cursor pagination"""
        
        # Validate and parse request parameters
        try:
            filters = filter_schema.load(request.args.to_dict(flat=True))
            # Convert single-item lists back to strings for certain fields
            for key in ['status', 'search', 'sort_by', 'cursor', 'test']:
                if key in filters and isinstance(filters[key], list):
                    filters[key] = filters[key][0] if filters[key] else filter_schema.fields[key].missing
        except ValidationError as e:
            return {"error": "Invalid parameters", "details": e.messages}, 400
        
        # Check cache first (skip for real-time data requests)
        if not filters.get('search'):  # Don't cache search results
            cached_result = self.cache_util.get_experience_list(**filters)
            if cached_result:
                return {
                    "experiences": cached_result["experiences"],
                    "pagination": cached_result["pagination"],
                    "cached": True
                }, 200
        
        # Build base query with optimized loading
        query = self._build_optimized_query(filters)
        
        # Apply cursor pagination
        cursor_data = {}
        if filters.get('cursor'):
            cursor_data = self.pagination.decode_cursor(filters['cursor'])
            cursor_conditions = self.pagination.build_query_conditions(cursor_data, filters['sort_by'])
            if cursor_conditions is not None:
                query = query.filter(cursor_conditions)
        
        # Apply sorting (skip for search queries as they have their own ordering)
        if not filters.get('search'):
            query = self._apply_sorting(query, filters['sort_by'])
        
        # Execute query with limit + 1 for next cursor detection
        limit = filters['limit']
        experiences_raw = query.limit(limit + 1).all()
        
        # Handle search results differently (they return tuples)
        if filters.get('search'):
            experiences_raw = [exp for exp, score in experiences_raw]
        
        # Check if there are more results
        has_next = len(experiences_raw) > limit
        if has_next:
            experiences_raw = experiences_raw[:-1]  # Remove the extra record
        
        # Batch load provider data for better performance
        provider_data = self._batch_load_provider_data([exp.provider_id for exp in experiences_raw])
        
        # Transform to cached format
        experiences = []
        next_cursor = None
        
        for exp in experiences_raw:
            provider_info = provider_data.get(str(exp.provider_id), {})
            cached_exp = CachedExperience.from_experience(exp, provider_info)
            experiences.append(asdict(cached_exp))
        
        # Generate next cursor
        if has_next and experiences:
            last_exp = experiences[-1]
            sort_value = self._get_sort_value(last_exp, filters['sort_by'])
            next_cursor = self.pagination.encode_cursor(last_exp['id'], sort_value)
        
        # Prepare response
        result = {
            "experiences": experiences,
            "pagination": {
                "has_next": has_next,
                "next_cursor": next_cursor,
                "limit": limit,
                "total_returned": len(experiences)
            }
        }
        
        # Cache the result (skip search queries and first page only)
        if not filters.get('search') and not filters.get('cursor'):
            self.cache_util.set_experience_list(result, **filters)
        
        return result, 200
    
    def _build_optimized_query(self, filters):
        """Build optimized SQLAlchemy query with eager loading"""
        
        # Search functionality (fuzzy + ILIKE)
        if filters.get('search'):
            raw_search = filters['search']

            # Create the score subquery
            score_subq = (
                db.session.query(
                    Experience.id.label("exp_id"),
                    func.greatest(
                        func.similarity(Experience.title, raw_search),
                        func.similarity(cast(Experience.meeting_point["address"], String), raw_search),
                        func.similarity(cast(Experience.meeting_point["name"], String), raw_search)
                    ).label("score")
                )
                .subquery()
            )

            # Create aliased Experience for the main query
            scored_exp = aliased(Experience)

            # Build the query with the aliased table
            query = (
                db.session.query(scored_exp, score_subq.c.score)
                .join(score_subq, scored_exp.id == score_subq.c.exp_id)
                .options(
                    joinedload(scored_exp.provider),
                    selectinload(scored_exp.slots)
                )
                .filter(score_subq.c.score > 0.14)
                .filter(scored_exp.status == filters['status'])
            )

            # Apply filters using the aliased table
            if filters.get('destinations'):
                query = query.filter(scored_exp.destinations.op('&&')(filters['destinations']))
            
            if filters.get('activities'):
                query = query.filter(scored_exp.activities.op('&&')(filters['activities']))
            
            if filters.get('start_date_from'):
                query = query.filter(scored_exp.start_date >= filters['start_date_from'])
            
            if filters.get('start_date_to'):
                query = query.filter(scored_exp.start_date <= filters['start_date_to'])

            # Price filtering for search queries
            if filters.get('min_price') or filters.get('max_price'):
                price_subquery = (db.session.query(Slot.experience_id)
                                .filter(Slot.experience_id == scored_exp.id))
                
                if filters.get('min_price'):
                    price_subquery = price_subquery.filter(Slot.price >= filters['min_price'])
                
                if filters.get('max_price'):
                    price_subquery = price_subquery.filter(Slot.price <= filters['max_price'])
                
                query = query.filter(price_subquery.exists())

            # Filter out past experiences - use the aliased table
            upcoming_slot_exists = (
                db.session.query(Slot.id)
                .filter(
                    Slot.experience_id == scored_exp.id,
                    Slot.date >= date.today()
                )
                .exists()
            )
            query = query.filter(upcoming_slot_exists)

            # Order by score, then created_at, then id - all using the aliased table
            query = query.order_by(score_subq.c.score.desc(), scored_exp.created_at.desc(), scored_exp.id.asc())
            
            return query

        else:
            # Non-search query path
            query = (db.session.query(Experience)
                    .options(
                        joinedload(Experience.provider),
                        selectinload(Experience.slots)
                    )
                    .filter(Experience.status == filters['status']))
            
            # Apply filters
            if filters.get('destinations'):
                query = query.filter(Experience.destinations.op('&&')(filters['destinations']))
            
            if filters.get('activities'):
                query = query.filter(Experience.activities.op('&&')(filters['activities']))
            
            if filters.get('start_date_from'):
                query = query.filter(Experience.start_date >= filters['start_date_from'])
            
            if filters.get('start_date_to'):
                query = query.filter(Experience.start_date <= filters['start_date_to'])
            
            # Price filtering (requires subquery for slot prices)
            if filters.get('min_price') or filters.get('max_price'):
                price_subquery = (db.session.query(Slot.experience_id)
                                .filter(Slot.experience_id == Experience.id))
                
                if filters.get('min_price'):
                    price_subquery = price_subquery.filter(Slot.price >= filters['min_price'])
                
                if filters.get('max_price'):
                    price_subquery = price_subquery.filter(Slot.price <= filters['max_price'])
                
                query = query.filter(price_subquery.exists())
            
            # Filter out past experiences
            upcoming_slot_exists = (
                db.session.query(Slot.id)
                .filter(
                    Slot.experience_id == Experience.id,
                    Slot.date >= date.today()
                )
                .exists()
            )
            query = query.filter(upcoming_slot_exists)

        return query
    
    def _apply_sorting(self, query, sort_by):
        """Apply sorting to the query"""
        
        if sort_by == "created_at":
            return query.order_by(desc(Experience.created_at), asc(Experience.id))
        
        elif sort_by == "start_date":
            return query.order_by(asc(Experience.start_date), asc(Experience.id))
        
        elif sort_by == "price_asc":
            # Join with slots and order by minimum price
            min_price = func.min(Slot.price).label('min_price')
            return (query.join(Slot)
                   .group_by(Experience.id)
                   .order_by(asc(min_price), asc(Experience.id)))
        
        elif sort_by == "price_desc":
            # Join with slots and order by maximum price
            max_price = func.max(Slot.price).label('max_price')
            return (query.join(Slot)
                   .group_by(Experience.id)
                   .order_by(desc(max_price), asc(Experience.id)))
        
        elif sort_by == "popularity":
            # Order by total bookings (sum of booked slots)
            total_bookings = func.sum(Slot.booked).label('total_bookings')
            return (query.outerjoin(Slot)
                   .group_by(Experience.id)
                   .order_by(desc(total_bookings), desc(Experience.created_at), asc(Experience.id)))
        
        elif sort_by == "availability":
            # Order by available slots (capacity - booked)
            available_slots = func.sum(Slot.capacity - Slot.booked).label('available_slots')
            return (query.outerjoin(Slot)
                   .group_by(Experience.id)
                   .order_by(desc(available_slots), asc(Experience.id)))
        
        else:
            # Default to created_at
            return query.order_by(desc(Experience.created_at), asc(Experience.id))
    
    def _batch_load_provider_data(self, provider_ids):
        """Batch load provider data with caching"""
        provider_data = {}
        uncached_ids = []
        
        # Check cache first
        for provider_id in set(provider_ids):
            cached = self.cache_util.get_provider_data(str(provider_id))
            if cached:
                provider_data[str(provider_id)] = cached
            else:
                uncached_ids.append(provider_id)
        
        # Load uncached provider data - FIXED: Use proper query without load_only
        if uncached_ids:
            providers = (User.query
                        .filter(User.id.in_(uncached_ids))
                        .all())
            
            for provider in providers:
                data = {
                    'id': str(provider.id),
                    'name': provider.name,
                    'avatar_url': provider.avatar_url
                }
                provider_data[str(provider.id)] = data
                self.cache_util.set_provider_data(str(provider.id), data)
        
        return provider_data
    
    def _get_sort_value(self, experience_dict, sort_by):
        """Get the sort value for cursor generation"""
        if sort_by == "created_at":
            return experience_dict.get('created_at')
        elif sort_by == "start_date":
            return experience_dict.get('start_date')
        elif sort_by in ["price_asc", "price_desc"]:
            return experience_dict.get('min_price' if sort_by == "price_asc" else 'max_price')
        elif sort_by == "popularity":
            # This would need to be calculated from bookings
            return experience_dict.get('created_at')  # Fallback
        elif sort_by == "availability":
            return experience_dict.get('available_slots')
        else:
            return experience_dict.get('created_at')


class TrendingExperiences(Resource):
    """Get trending/hot experiences with aggressive caching"""
    
    def __init__(self):
        self.cache_util = ExperienceCache(current_app.cache)
    
    @handle_db_errors
    def get(self):
        """Get trending experiences (highly cached)"""
        
        # Check cache first
        cached_result = self.cache_util.get_hot_experiences()
        if cached_result:
            return {"experiences": cached_result, "cached": True}, 200
        
        # Query for trending experiences (last 30 days, high bookings)
        thirty_days_ago = date.today() - timedelta(days=30)
        
        trending_query = (db.session.query(Experience)
                         .options(
                             joinedload(Experience.provider),  # Load full provider data
                             selectinload(Experience.slots)    # Load full slot data
                         )
                         .join(Slot)
                         .filter(
                             Experience.status == 'published',
                             Experience.start_date >= date.today(),
                             Experience.created_at >= thirty_days_ago
                         )
                         .group_by(Experience.id)
                         .order_by(desc(func.sum(Slot.booked)), desc(Experience.created_at))
                         .limit(20))
        
        experiences_raw = trending_query.all()
        
        # Transform to cached format
        experiences = []
        for exp in experiences_raw:
            cached_exp = CachedExperience.from_experience(exp)
            experiences.append(asdict(cached_exp))
        
        # Cache the result
        self.cache_util.set_hot_experiences(experiences)
        
        return {"experiences": experiences}, 200


class PublicExperienceDetail(Resource):
    """Get single experience details with caching"""
    
    def __init__(self):
        self.cache_util = ExperienceCache(current_app.cache)
    
    @handle_db_errors
    def get(self, experience_id):
        """Get single experience with full details"""
        
        # Check cache
        cache_key = f"exp:detail:{experience_id}"
        cached_result = current_app.cache.get(cache_key)
        if cached_result:
            return {"experience": cached_result, "cached": True}, 200
        
        # Query with full loading - FIXED: Remove load_only usage
        experience = (Experience.query
                     .options(
                         joinedload(Experience.provider),  # Load full provider data
                         selectinload(Experience.slots)    # Load full slot data
                     )
                     .filter(
                         Experience.id == experience_id,
                         Experience.status == 'published'
                     )
                     .first())
        
        if not experience:
            return {"error": "Experience not found"}, 404
        
        # Transform to detailed format
        cached_exp = CachedExperience.from_experience(experience)
        experience_data = asdict(cached_exp)
        
        # Add provider details
        if experience.provider:
            experience_data['provider'] = {
                'id': str(experience.provider.id),
                'name': experience.provider.name,
                'avatar_url': experience.provider.avatar_url,
                'bio': getattr(experience.provider, 'bio', None)  # Safe access to bio
            }
        
        # Add slot details
        experience_data['slots'] = [
            {
                'id': str(slot.id),
                'name': slot.name,
                'date': slot.date.isoformat(),
                'capacity': slot.capacity,
                'booked': slot.booked,
                'start_time': slot.start_time.isoformat(),
                'end_time': slot.end_time.isoformat(),
                'timezone': slot.timezone,
                'available': slot.capacity - slot.booked,
                'price': float(slot.price)
            }
            for slot in experience.slots
        ]
        
        # Cache the detailed result
        current_app.cache.set(cache_key, experience_data, timeout=600)
        
        return {"experience": experience_data}, 200