import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/ticket_booking';
const pool = new pg.Pool({ connectionString: databaseUrl });

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log(`\n========================================`);
    console.log(` Database Seeder Starting`);
    console.log(` Target: ${databaseUrl}`);
    console.log(`========================================`);

    await client.query('BEGIN');

    // 1. Seed Users
    console.log('Seeding users...');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    const userInsert = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES 
        ('Admin User', 'admin@seatforge.com', $1, 'admin'),
        ('John Doe', 'john.doe@example.com', $1, 'customer'),
        ('Jane Smith', 'jane.smith@example.com', $1, 'customer'),
        ('Concurrency Tester', 'tester@seatforge.com', $1, 'customer')
      ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
      RETURNING id, email, role;
    `;
    const usersResult = await client.query(userInsert, [defaultPasswordHash]);
    console.log(` Seeded ${usersResult.rowCount} users.`);

    // 2. Seed Movies
    console.log('Seeding movies...');
    const moviesInsert = `
      INSERT INTO movies (title, description, duration_minutes, genre, rating, poster_url, release_date)
      VALUES 
        ('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.', 148, 'Sci-Fi', 'PG-13', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600', '2010-07-16'),
        ('Interstellar', 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers.', 169, 'Sci-Fi', 'PG-13', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600', '2014-11-07'),
        ('Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', 166, 'Sci-Fi/Adventure', 'PG-13', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600', '2024-03-01'),
        ('Oppenheimer', 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 180, 'Biography/Drama', 'R', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600', '2023-07-21')
      RETURNING id, title;
    `;
    // Clean and insert movies
    await client.query('DELETE FROM movies;');
    const moviesResult = await client.query(moviesInsert);
    console.log(` Seeded ${moviesResult.rowCount} movies.`);

    // 3. Seed Venues
    console.log('Seeding venues...');
    await client.query('DELETE FROM venues CASCADE;');
    const venuesInsert = `
      INSERT INTO venues (name, city, address)
      VALUES 
        ('Cineplex Grand Metropolis', 'New York', '120 Broadway Ave, Manhattan, NY'),
        ('Starlight Dolby Cinema', 'San Francisco', '450 Market St, Financial District, CA')
      RETURNING id, name;
    `;
    const venuesResult = await client.query(venuesInsert);
    const nycVenue = venuesResult.rows[0];
    const sfVenue = venuesResult.rows[1];
    console.log(` Seeded ${venuesResult.rowCount} venues.`);

    // 4. Seed Screens
    console.log('Seeding screens...');
    const screensInsert = `
      INSERT INTO screens (venue_id, name, total_seats)
      VALUES 
        ($1, 'IMAX Screen 1', 50),
        ($1, 'Dolby Atmos Screen 2', 50),
        ($2, 'Laser Auditorium A', 50)
      RETURNING id, name, venue_id;
    `;
    const screensResult = await client.query(screensInsert, [nycVenue.id, sfVenue.id]);
    console.log(` Seeded ${screensResult.rowCount} screens.`);

    // 5. Seed Physical Seats for each Screen
    console.log('Seeding physical seat layouts (50 seats per screen)...');
    const rows = ['A', 'B', 'C', 'D', 'E']; // 5 rows
    const seatsPerRow = 10; // 10 seats per row = 50 seats

    for (const screen of screensResult.rows) {
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          const seatLabel = `${row}${num}`;
          let tier = 'STANDARD';
          if (row === 'C' || row === 'D') tier = 'PREMIUM';
          if (row === 'E') tier = 'VIP';

          await client.query(
            `INSERT INTO seats (screen_id, row, number, seat_label, tier)
             VALUES ($1, $2, $3, $4, $5);`,
            [screen.id, row, num, seatLabel, tier]
          );
        }
      }
    }
    console.log(` Generated physical seats layout for all screens.`);

    // 6. Seed Shows (Next 2 days)
    console.log('Scheduling shows...');
    const now = new Date();
    const showtimes = [
      { offsetHours: 2, price: 15.00 },
      { offsetHours: 6, price: 18.00 },
      { offsetHours: 24, price: 15.00 },
      { offsetHours: 28, price: 20.00 },
    ];

    const screen1 = screensResult.rows[0]; // IMAX Screen 1
    const movie1 = moviesResult.rows[0]; // Inception
    const movie2 = moviesResult.rows[2]; // Dune 2

    const createdShows: { id: string; screen_id: string; base_price: string }[] = [];

    for (const [idx, st] of showtimes.entries()) {
      const startTime = new Date(now.getTime() + st.offsetHours * 3600 * 1000);
      const endTime = new Date(startTime.getTime() + 150 * 60 * 1000);
      const chosenMovie = idx % 2 === 0 ? movie1 : movie2;

      const showRes = await client.query(
        `INSERT INTO shows (movie_id, screen_id, start_time, end_time, base_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, screen_id, base_price;`,
        [chosenMovie.id, screen1.id, startTime, endTime, st.price]
      );
      createdShows.push(showRes.rows[0]);
    }
    console.log(` Seeded ${createdShows.length} shows.`);

    // 7. Seed Show Seats (per-show availability rows)
    console.log('Generating show-specific seat availability (show_seats)...');
    let totalShowSeats = 0;

    for (const show of createdShows) {
      // Fetch physical seats for this screen
      const physicalSeats = await client.query(
        'SELECT id, tier FROM seats WHERE screen_id = $1 ORDER BY row, number;',
        [show.screen_id]
      );

      for (const seat of physicalSeats.rows) {
        let seatPrice = parseFloat(show.base_price);
        if (seat.tier === 'PREMIUM') seatPrice += 4.00;
        if (seat.tier === 'VIP') seatPrice += 8.00;

        await client.query(
          `INSERT INTO show_seats (show_id, seat_id, status, price)
           VALUES ($1, $2, 'AVAILABLE', $3);`,
          [show.id, seat.id, seatPrice]
        );
        totalShowSeats++;
      }
    }

    console.log(` Seeded ${totalShowSeats} show_seats records across ${createdShows.length} shows.`);

    await client.query('COMMIT');
    console.log(`\nDatabase seeding completed successfully!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Direct CLI execution
const isMain = process.argv[1]?.endsWith('seed/index.ts') || process.argv[1]?.endsWith('seed.ts');
if (isMain) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
