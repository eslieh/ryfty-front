import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Function to get experience metadata for SEO
export async function getExperienceMetadata(experienceId) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        poster_image_url
      FROM experiences
      WHERE id = '${experienceId}'::uuid
        AND status = 'published'
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error:', error);
    return null;
  } finally {
    client.release();
  }
}

// Function to get full experience data
export async function getExperienceData(experienceId) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id,
        title,
        description,
        destinations,
        images,
        activities,
        poster_image_url,
        start_date,
        end_date,
        status,
        meeting_point,
        provider_name,
        provider_avatar,
        min_price,
        max_price,
        total_slots,
        available_slots,
        created_at,
        updated_at,
        provider,
        slots
      FROM experiences
      WHERE id = ${experienceId}::uuid
        AND status = 'published'
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error:', error);
    return null;
  } finally {
    client.release();
  }
}

export default pool;