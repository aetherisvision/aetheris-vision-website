import type { DatabaseMigration } from './types'

export const invoiceDeliveryMigration: DatabaseMigration = {
  id: '004_invoice_delivery',
  description: 'Add concurrency-safe invoice numbering and idempotent notification state',
  up: (sql) => [
    sql.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS notification_idempotency_key text,
        ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz
    `),
    sql.query(`
      CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
        AS bigint
        START WITH 1
        INCREMENT BY 1
        NO CYCLE
    `),
    sql.query(`
      DO $$
      DECLARE duplicate_numbers integer;
              duplicate_notification_keys integer;
              invalid_notification_rows integer;
      BEGIN
        SELECT count(*) INTO duplicate_numbers
        FROM (
          SELECT number
          FROM invoices
          GROUP BY number
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_numbers > 0 THEN
          RAISE EXCEPTION
            'Invoice delivery migration blocked: % duplicate invoice number group(s) must be resolved.',
            duplicate_numbers;
        END IF;

        SELECT count(*) INTO duplicate_notification_keys
        FROM (
          SELECT notification_idempotency_key
          FROM invoices
          WHERE notification_idempotency_key IS NOT NULL
          GROUP BY notification_idempotency_key
          HAVING count(*) > 1
        ) duplicates;

        IF duplicate_notification_keys > 0 THEN
          RAISE EXCEPTION
            'Invoice delivery migration blocked: % duplicate notification idempotency key group(s) must be resolved.',
            duplicate_notification_keys;
        END IF;

        SELECT count(*) INTO invalid_notification_rows
        FROM invoices
        WHERE (notification_idempotency_key IS NOT NULL
                 AND btrim(notification_idempotency_key) = '')
           OR (notification_sent_at IS NOT NULL
                 AND notification_idempotency_key IS NULL);

        IF invalid_notification_rows > 0 THEN
          RAISE EXCEPTION
            'Invoice delivery migration blocked: % invoice notification state row(s) are invalid.',
            invalid_notification_rows;
        END IF;
      END $$
    `),
    sql.query(`
      WITH existing_numbers AS (
        SELECT COALESCE(
          max((regexp_match(number, '^INV-[0-9]{6}-([0-9]+)$'))[1]::bigint),
          0
        ) AS max_suffix
        FROM invoices
        WHERE number ~ '^INV-[0-9]{6}-[0-9]+$'
      ),
      current_sequence AS (
        SELECT last_value, is_called FROM invoice_number_seq
      )
      SELECT setval(
        'invoice_number_seq',
        GREATEST(
          existing_numbers.max_suffix,
          CASE WHEN current_sequence.is_called THEN current_sequence.last_value ELSE 1 END,
          1
        ),
        existing_numbers.max_suffix > 0 OR current_sequence.is_called
      )
      FROM existing_numbers, current_sequence
    `),
    sql.query(`
      ALTER TABLE invoices
        DROP CONSTRAINT IF EXISTS invoices_notification_state_check
    `),
    sql.query(`
      ALTER TABLE invoices ADD CONSTRAINT invoices_notification_state_check
        CHECK (
          (notification_idempotency_key IS NULL
            OR btrim(notification_idempotency_key) <> '')
          AND (notification_sent_at IS NULL
            OR notification_idempotency_key IS NOT NULL)
        )
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_uidx
        ON invoices (number)
    `),
    sql.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_notification_idempotency_uidx
        ON invoices (notification_idempotency_key)
        WHERE notification_idempotency_key IS NOT NULL
    `),
  ],
}
