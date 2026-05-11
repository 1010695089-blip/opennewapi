-- Add billed_cost_cents to usage_logs: the amount charged to the user (cost_cents * markup_rate)
ALTER TABLE usage_logs ADD COLUMN billed_cost_cents REAL NOT NULL DEFAULT 0;

-- Add total_billed_cost_cents to cost_daily for aggregated billing reports
ALTER TABLE cost_daily ADD COLUMN total_billed_cost_cents REAL NOT NULL DEFAULT 0;
