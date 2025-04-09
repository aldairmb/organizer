import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: false
});

let dbClient;

if (process.env.NODE_ENV.toLowerCase().includes('dev')) {
    dbClient = {
        async query(text, params) {
            try {
                const res = await pool.query(text, params);
                console.log('Executed query:', { text });
                return res;
            } catch (error) {
                console.error('Error in query:', { text });
                throw error;
            }
        }
    };
} else {
    dbClient = pool;
}

// 🛠️ Setup function to initialize database from schema.sql
export const setupDatabase = async () => {
    try {
        console.log('Running database setup...');
        const sql = fs.readFileSync('src/models/schema.sql', 'utf-8');
        await dbClient.query(sql);
        console.log('✅ Database setup complete!');
    } catch (error) {
        console.error('❌ Error running database setup:', error);
    }
};

// Test function to check if tables exist
export const testDatabase = async () => {
    try {
        const res = await dbClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        if (res.rows.length === 0) {
            console.log('No tables found in the database.');
        } else {
            console.log('Tables in the database:', res.rows.map(row => row.table_name));
        }
    } catch (error) {
        console.error('Error fetching tables:', error);
    }
};
export { pool };
export default dbClient;
