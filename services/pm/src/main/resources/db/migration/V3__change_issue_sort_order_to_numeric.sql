ALTER TABLE issue
    ALTER COLUMN sort_order TYPE NUMERIC(20, 10)
    USING sort_order::NUMERIC(20, 10);
