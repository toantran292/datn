# Migration Guide - Add Sprint Metrics

## Thay đổi

Đã thêm các columns mới vào bảng `sprint` để tracking metrics:

### Snapshot Metrics (khi start sprint):
- `initial_issue_count` - Số lượng issues tại thời điểm bắt đầu
- `initial_story_points` - Tổng story points tại thời điểm bắt đầu
- `started_at` - Timestamp khi sprint được start

### Completion Metrics (khi complete sprint):
- `completed_at` - Timestamp khi sprint được complete
- `completed_issue_count` - Số issues đã hoàn thành
- `velocity` - Sprint velocity (story points completed)

## Cách chạy migration

### Option 1: Sử dụng Prisma Migrate (Recommended)

```bash
cd services/pm

# Run migration
pnpm prisma migrate deploy

# Or for development with seed
pnpm prisma migrate dev
```

### Option 2: Chạy SQL trực tiếp

```bash
cd services/pm/prisma/migrations/20251215120000_add_sprint_metrics

# Chạy migration.sql vào database
psql -U your_user -d pm_db -f migration.sql
```

### Option 3: Docker environment

```bash
# Nếu đang dùng Docker Compose
make dev.migrate.pm

# Hoặc
docker exec -it pm-service npx prisma migrate deploy
```

## Verify migration

```bash
# Check database schema
psql -U your_user -d pm_db -c "\d+ sprint"

# Hoặc dùng Prisma
pnpm prisma db pull
```

## Rollback (nếu cần)

```sql
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "initial_issue_count";
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "initial_story_points";
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "started_at";
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "completed_at";
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "completed_issue_count";
ALTER TABLE "sprint" DROP COLUMN IF EXISTS "velocity";
```

## Testing

Sau khi chạy migration, test bằng cách:

1. Start một sprint mới
2. Check database xem `initial_issue_count` và `initial_story_points` đã được ghi nhận chưa
3. Check `started_at` timestamp

```sql
SELECT
  id,
  name,
  status,
  initial_issue_count,
  initial_story_points,
  started_at
FROM sprint
WHERE status = 'ACTIVE';
```

## Impact

- ✅ Không breaking changes
- ✅ Các columns mới là nullable, không ảnh hưởng existing data
- ✅ Backend logic tự động snapshot metrics khi start sprint
- ✅ Frontend modal hiển thị warning nếu sprint rỗng

## Next Steps

Sau khi migration thành công:
- [ ] Test start sprint workflow
- [ ] Implement complete sprint với velocity calculation (UC02.3)
- [ ] Implement sprint velocity analytics chart
