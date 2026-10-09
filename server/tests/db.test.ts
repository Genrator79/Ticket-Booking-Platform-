import { pool, query, withTransaction, closePool } from '../src/db/index';

describe('Database Schema & Integrity Verification (M02)', () => {
  afterAll(async () => {
    await closePool();
  });

  it('should establish connection and execute simple query', async () => {
    const res = await query('SELECT 1 AS alive;');
    expect(res.rows[0].alive).toBe(1);
  });

  it('should confirm all core entity tables exist', async () => {
    const expectedTables = [
      'users',
      'movies',
      'venues',
      'screens',
      'seats',
      'shows',
      'show_seats',
      'bookings',
      'booking_seats',
      'payments',
      'schema_migrations',
    ];

    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    const tableNames = res.rows.map((r: { table_name: string }) => r.table_name);
    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('should enforce UNIQUE(show_id, seat_id) constraint on show_seats', async () => {
    // Pick an existing show_seat
    const existing = await query('SELECT show_id, seat_id, price FROM show_seats LIMIT 1;');
    expect(existing.rows.length).toBe(1);

    const { show_id, seat_id, price } = existing.rows[0];

    // Attempt to insert duplicate (show_id, seat_id)
    await expect(
      query(
        'INSERT INTO show_seats (show_id, seat_id, status, price) VALUES ($1, $2, $3, $4);',
        [show_id, seat_id, 'AVAILABLE', price]
      )
    ).rejects.toThrow();
  });

  it('should enforce status check constraint on show_seats', async () => {
    const show = await query('SELECT id FROM shows LIMIT 1;');
    const seat = await query('SELECT id FROM seats LIMIT 1;');

    // Status 'BOGUS' is not in ('AVAILABLE', 'HELD', 'BOOKED')
    await expect(
      query(
        'INSERT INTO show_seats (show_id, seat_id, status, price) VALUES ($1, $2, $3, 15.00);',
        [show.rows[0].id, seat.rows[0].id, 'BOGUS']
      )
    ).rejects.toThrow();
  });

  it('should enforce foreign key constraint on show_seats', async () => {
    const seat = await query('SELECT id FROM seats LIMIT 1;');
    const nonExistentShowId = '00000000-0000-0000-0000-000000000000';

    await expect(
      query(
        'INSERT INTO show_seats (show_id, seat_id, status, price) VALUES ($1, $2, $3, 15.00);',
        [nonExistentShowId, seat.rows[0].id, 'AVAILABLE']
      )
    ).rejects.toThrow();
  });

  it('should rollback transaction on error in withTransaction helper', async () => {
    const email = `rollback_test_${Date.now()}@example.com`;

    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash123');`,
          ['Rollback Test', email]
        );
        // Force an error
        throw new Error('Simulated failure during transaction');
      });
    } catch {
      // Expected error
    }

    const check = await query('SELECT id FROM users WHERE email = $1;', [email]);
    expect(check.rows.length).toBe(0);
  });

  it('should commit transaction on success in withTransaction helper', async () => {
    const email = `commit_test_${Date.now()}@example.com`;

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, 'hash123');`,
        ['Commit Test', email]
      );
    });

    const check = await query('SELECT id FROM users WHERE email = $1;', [email]);
    expect(check.rows.length).toBe(1);

    // Clean up
    await query('DELETE FROM users WHERE email = $1;', [email]);
  });
});
