/**
 * Demo Data Seed Script
 *
 * Seeds demo data for all services except PM:
 * - Identity Service: Users, Organizations, Memberships, Role Bindings
 * - Chat Service: Rooms, Messages, Reactions, Members
 * - Notification Service: Notifications
 * - File-Storage Service: (handled via API calls)
 *
 * Usage:
 *   npx ts-node scripts/seed-demo-data.ts
 *
 * Environment variables:
 *   POSTGRES_HOST - PostgreSQL host (default: localhost)
 *   POSTGRES_PORT - PostgreSQL port (default: 41000)
 *   POSTGRES_USER - PostgreSQL user (default: uts)
 *   POSTGRES_PASSWORD - PostgreSQL password (default: uts_dev_pw)
 *   IDENTITY_DB - Identity database name (default: identity_db)
 *   CHAT_DB - Chat database name (default: chat_db)
 *   NOTIFICATION_DB - Notification database name (default: notification_db)
 */

import { Client } from 'pg';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

// ============= Configuration =============
const config = {
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '41000', 10),
    user: process.env.POSTGRES_USER || 'uts',
    password: process.env.POSTGRES_PASSWORD || 'uts_dev_pw',
  },
  databases: {
    identity: process.env.IDENTITY_DB || 'identity',
    chat: process.env.CHAT_DB || 'chat_db',
    notification: process.env.NOTIFICATION_DB || 'notification_db',
  },
};

// ============= Demo Data =============
const DEMO_PASSWORD = 'Demo@123'; // Password for all demo users
const PWD_PEPPER = process.env.PWD_PEPPER || 'dev-pepper-or-empty'; // Must match identity service

// Demo Users
const users = [
  { id: randomUUID(), email: 'admin@demo.com', displayName: 'Admin User', phone: '+84901234567' },
  { id: randomUUID(), email: 'nguyen.van.a@demo.com', displayName: 'Nguyễn Văn A', phone: '+84902345678' },
  { id: randomUUID(), email: 'tran.thi.b@demo.com', displayName: 'Trần Thị B', phone: '+84903456789' },
  { id: randomUUID(), email: 'le.van.c@demo.com', displayName: 'Lê Văn C', phone: '+84904567890' },
  { id: randomUUID(), email: 'pham.thi.d@demo.com', displayName: 'Phạm Thị D', phone: '+84905678901' },
];

// Demo Organizations
const organizations = [
  {
    id: randomUUID(),
    slug: 'acme-corp',
    displayName: 'ACME Corporation',
    description: 'Leading technology company specializing in innovation',
    llmProvider: 'OPENAI',
  },
  {
    id: randomUUID(),
    slug: 'tech-startup',
    displayName: 'Tech Startup Inc',
    description: 'Fast-growing startup in the AI space',
    llmProvider: 'ANTHROPIC',
  },
];

// Demo Rooms (per organization)
const roomTemplates = [
  { name: 'general', description: 'General discussions', isPrivate: false, type: 'channel' },
  { name: 'engineering', description: 'Engineering team discussions', isPrivate: false, type: 'channel' },
  { name: 'checkout-race-condition', description: 'Thảo luận xử lý race condition trong quy trình checkout', isPrivate: false, type: 'channel' },
  { name: 'marketing', description: 'Marketing team discussions', isPrivate: false, type: 'channel' },
  { name: 'leadership', description: 'Leadership private channel', isPrivate: true, type: 'channel' },
  { name: 'random', description: 'Random fun stuff', isPrivate: false, type: 'channel' },
];

// ============= Checkout Race Condition Conversation =============
// 100+ messages conversation between 4 developers about handling race conditions in checkout
// sender: 0 = Nguyễn Văn A (Backend Lead), 1 = Trần Thị B (Frontend Dev), 2 = Lê Văn C (DevOps), 3 = Phạm Thị D (QA)
const checkoutRaceConditionConversation = [
  // Day 1 - Problem Discovery (QA phát hiện issue)
  { sender: 3, content: 'Team ơi, mình vừa nhận được 5 tickets từ users complain bị charge 2 lần khi checkout. Cần investigate gấp!' },
  { sender: 0, content: 'Để mình check log... 🔍' },
  { sender: 2, content: 'Mình check thêm metrics trên Grafana, thấy có spike về duplicate payment requests sáng nay.' },
  { sender: 0, content: 'Found it! Có 2 request gần như đồng thời từ cùng 1 user, cách nhau chỉ 200ms.' },
  { sender: 1, content: 'Race condition đây rồi! User double click nút checkout à?' },
  { sender: 3, content: 'Mình đã reproduce được issue trên staging. Double click nút checkout -> charge 2 lần thật.' },
  { sender: 0, content: 'Đúng rồi, hoặc có thể là network lag nên họ click nhiều lần. Request đầu tiên chưa response mà họ đã click tiếp.' },
  { sender: 2, content: 'Mình cũng thấy có vài request retry từ mobile app khi network flaky. Cần fix cả hai case.' },
  { sender: 1, content: 'Mình cần phải implement idempotency key cho checkout API. Bạn đã từng làm chưa?' },
  { sender: 0, content: 'Chưa, nhưng mình có đọc về nó. Stripe dùng cách này để prevent duplicate charges.' },
  { sender: 1, content: 'Đúng rồi. Ý tưởng là mỗi checkout request sẽ có một unique key, nếu key đã được process thì return kết quả cũ thay vì process lại.' },
  { sender: 3, content: 'Sounds good! Mình sẽ cần test cases cho cả happy path và edge cases. Các bạn design xong thì share nhé.' },
  { sender: 0, content: 'Vậy key này generate ở client hay server?' },
  { sender: 1, content: 'Client generate. Thường dùng UUID v4. Khi user click checkout, FE generate key và gửi kèm request.' },
  { sender: 0, content: 'Nếu user refresh page thì key mới à? Vậy có ổn không?' },
  { sender: 1, content: 'Đúng, refresh page = checkout mới = key mới. Đây là behavior mong muốn vì user có thể muốn checkout lại với cart khác.' },

  // Day 1 - Technical Discussion
  { sender: 0, content: 'OK mình hiểu rồi. Vậy ở backend mình cần lưu key này ở đâu?' },
  { sender: 1, content: 'Redis là lựa chọn tốt nhất. Fast và có TTL built-in. Mình đề xuất flow như sau...' },
  { sender: 2, content: 'Redis cluster của mình đang có 3 nodes, performance sẽ đủ cho use case này.' },
  { sender: 1, content: '1. FE gửi request với idempotency_key header\n2. BE check Redis xem key đã tồn tại chưa\n3. Nếu có -> return cached response\n4. Nếu chưa -> process checkout, save result to Redis với TTL 24h' },
  { sender: 0, content: 'Nhưng có một vấn đề: giữa bước 2 và 4, nếu có 2 request cùng lúc thì sao?' },
  { sender: 1, content: 'Good catch! Đây chính là race condition trong việc prevent race condition 😅' },
  { sender: 0, content: 'Inception 🤯' },
  { sender: 2, content: 'Mình suggest dùng Redis distributed lock cho case này. Production env của mình đã có Redlock setup sẵn.' },
  { sender: 1, content: 'Để solve cái này, mình cần dùng distributed lock. Redis có SETNX (SET if Not eXists) rất phù hợp.' },
  { sender: 0, content: 'À, mình biết cái này. SET key value NX EX 30 đúng không?' },
  { sender: 1, content: 'Exactly! NX = only set if not exists, EX 30 = expire after 30 seconds (timeout cho checkout process).' },
  { sender: 2, content: 'Nhớ set timeout đủ lớn nhé, payment gateway đôi khi latency cao lắm. 30s là ổn.' },

  // Day 1 - Implementation Details
  { sender: 0, content: 'Vậy flow đầy đủ sẽ là:\n1. Nhận request với idempotency_key\n2. Try acquire lock với SETNX\n3. Nếu không get được lock -> check xem đã có result chưa\n4. Nếu có result -> return\n5. Nếu không có result -> đang process, return 409 Conflict?' },
  { sender: 1, content: 'Gần đúng, nhưng case 5 mình nghĩ nên return 202 Accepted và client poll result. Hoặc dùng webhook.' },
  { sender: 3, content: 'Nếu return 409, mình cần document rõ để FE handle đúng. User không nên thấy error message khó hiểu.' },
  { sender: 0, content: 'Poll thì UX không tốt lắm. Webhook thì phức tạp. Hay mình dùng long polling?' },
  { sender: 1, content: 'Hoặc đơn giản hơn: client wait với timeout. BE hold request cho đến khi có result hoặc timeout.' },
  { sender: 0, content: 'Ý bạn là blocking request? Sẽ tốn connection pool đấy.' },
  { sender: 2, content: 'Đúng, với concurrent requests cao sẽ exhaust connection pool. Mình suggest async approach.' },
  { sender: 1, content: 'True. OK vậy approach đơn giản nhất: return 409 ngay và FE hiển thị loading, auto retry sau 2s.' },
  { sender: 3, content: 'Mình sẽ viết test automation cho flow retry này. Cần đảm bảo không infinite loop.' },
  { sender: 0, content: 'Được, vậy mình bắt đầu implement nhé. Mình làm BE, B làm FE?' },
  { sender: 1, content: '👍 Deal!' },
  { sender: 2, content: 'Mình sẽ chuẩn bị Redis config và monitoring dashboard.' },

  // Day 2 - Implementation Progress
  { sender: 0, content: 'Morning! Mình đã implement xong phần Redis lock. Đang test local.' },
  { sender: 1, content: 'Nice! FE mình cũng gần xong. Đang dùng nanoid để generate idempotency key.' },
  { sender: 0, content: 'Sao không dùng UUID?' },
  { sender: 1, content: 'nanoid ngắn hơn và collision probability tương đương. 21 chars vs 36 chars của UUID.' },
  { sender: 2, content: 'Shorter keys = less memory in Redis. Good choice 👍' },
  { sender: 0, content: 'OK, miễn là unique thì được. À mà bạn có disable button sau khi click không?' },
  { sender: 1, content: 'Có, mình disable ngay khi click và show spinner. Nhưng vẫn cần idempotency key vì user có thể bypass bằng cách khác.' },
  { sender: 0, content: 'Ví dụ?' },
  { sender: 1, content: 'DevTools, curl, hoặc automation script. Defense in depth là best practice.' },
  { sender: 3, content: 'Mình sẽ test cả case dùng DevTools để replay request. Good point!' },
  { sender: 0, content: 'Makes sense. À, mình đang phân vân về TTL của lock vs TTL của result.' },
  { sender: 1, content: 'Lock TTL nên ngắn, 30-60s là đủ cho checkout process. Result TTL nên dài hơn, 24-48h.' },
  { sender: 2, content: 'Từ infra perspective, 24h là đủ. Giữ lâu hơn sẽ tốn memory không cần thiết.' },
  { sender: 0, content: 'Tại sao result cần lưu lâu vậy?' },
  { sender: 1, content: 'Vì user có thể close browser rồi quay lại sau vài giờ với cùng idempotency key (nếu browser cache). Cũng để audit/debug.' },

  // Day 2 - Edge Cases
  { sender: 0, content: 'Mình nghĩ ra một edge case: nếu checkout thành công nhưng save result to Redis fail thì sao?' },
  { sender: 1, content: 'Hmm, good point. Payment đã charge nhưng không có idempotency record...' },
  { sender: 0, content: 'Lần sau user retry với cùng key sẽ bị charge lại!' },
  { sender: 3, content: 'Đây là critical bug nếu xảy ra. Mình cần test case cho scenario này!' },
  { sender: 1, content: 'OK vậy mình cần adjust flow: save to Redis BEFORE charge payment, với status "processing".' },
  { sender: 0, content: 'Rồi sau khi charge xong, update status thành "completed" với payment result.' },
  { sender: 2, content: 'Nên có retry logic cho Redis write. Nếu fail 3 lần thì mới reject checkout.' },
  { sender: 1, content: 'Đúng. Và nếu có request mới với cùng key + status "processing", return 409 và wait.' },
  { sender: 0, content: 'Còn nếu process crash giữa chừng? Status vẫn là "processing" mãi mãi?' },
  { sender: 1, content: 'Cần có cleanup job. Hoặc đơn giản hơn: check timestamp, nếu processing > 5 phút thì coi như failed và allow retry.' },
  { sender: 2, content: 'Mình có thể setup cronjob để cleanup stale locks. Chạy mỗi 5 phút.' },
  { sender: 0, content: 'Nhưng payment có thể đã charge rồi...' },
  { sender: 1, content: 'True. Cần verify với payment gateway trước khi retry. Stripe có API để check payment by idempotency key.' },
  { sender: 0, content: 'OK vậy full flow là:\n1. Check idempotency record\n2. Nếu completed -> return cached result\n3. Nếu processing + recent -> return 409\n4. Nếu processing + stale -> verify with payment gateway\n5. Nếu gateway confirms payment -> update record + return\n6. Nếu gateway says no payment -> allow retry' },
  { sender: 3, content: 'Mình sẽ cần test matrix cho tất cả 6 scenarios. Let me prepare test plan.' },
  { sender: 1, content: 'Perfect! 🎯' },

  // Day 2 - Code Review Discussion
  { sender: 0, content: 'Mình push code lên rồi, bạn review giúp nhé: PR #234' },
  { sender: 1, content: 'OK để mình xem... 👀' },
  { sender: 2, content: 'Mình cũng review phần Redis config.' },
  { sender: 1, content: 'Nhìn chung OK. Có vài comments:\n1. Nên wrap Redis operations trong try-catch\n2. Lock key và result key nên có prefix khác nhau\n3. Thiếu logging cho debug' },
  { sender: 0, content: 'Good points. Mình sẽ fix. Về prefix, bạn suggest gì?' },
  { sender: 1, content: 'checkout:lock:{key} và checkout:result:{key}. Clear và easy to debug.' },
  { sender: 2, content: 'Agree với prefix này. Cũng dễ monitor và cleanup theo pattern.' },
  { sender: 0, content: 'Done. Còn về logging, mình log gì?' },
  { sender: 1, content: 'Log idempotency key, user ID, action taken (new/cached/conflict), và timing. Đừng log sensitive data như card number.' },
  { sender: 3, content: 'Cần log enough để debug production issues. Mình từng mất nửa ngày vì thiếu log.' },
  { sender: 0, content: '👍 Updating now...' },
  { sender: 0, content: 'Done! Check lại giúp mình.' },
  { sender: 1, content: 'LGTM! Approve rồi. Merge khi CI pass nhé.' },
  { sender: 2, content: 'Infrastructure changes cũng LGTM! 👍' },

  // Day 3 - Testing
  { sender: 3, content: 'Team ơi, mình bắt đầu test comprehensive rồi. Found 1 issue...' },
  { sender: 1, content: 'Hey, mình đang test integration. Gặp issue: concurrent requests đôi khi cả 2 đều get lock.' },
  { sender: 0, content: 'Hmm, không possible nếu dùng SETNX đúng cách. Bạn dùng command gì?' },
  { sender: 1, content: 'Mình dùng ioredis: await redis.set(key, value, "NX", "EX", 30)' },
  { sender: 2, content: 'Mình check Redis logs, không thấy gì bất thường. Issue chắc ở application code.' },
  { sender: 0, content: 'Syntax đúng rồi. Bạn check return value chưa? SETNX return OK nếu success, null nếu key exists.' },
  { sender: 1, content: 'À! Mình check truthy thay vì check === "OK". null là falsy nhưng undefined cũng falsy...' },
  { sender: 0, content: 'Đó, phải check explicit: if (result === "OK")' },
  { sender: 3, content: 'Good catch! Mình thêm test case cho cái này để không bị regression.' },
  { sender: 1, content: 'Fixed! Test lại pass hết. Thanks! 🙏' },
  { sender: 0, content: 'No problem. Còn test case nào nữa không?' },
  { sender: 1, content: 'Mình đang viết test cho case: Redis down. App nên fallback thế nào?' },
  { sender: 2, content: 'Nếu Redis down, mình có alert setup. Nhưng app cần handle gracefully.' },
  { sender: 0, content: 'Good question. Mình nghĩ nên reject checkout và show error. Không nên process without idempotency protection.' },
  { sender: 3, content: 'Agree. User có thể bị charge double nếu process mà không có protection.' },
  { sender: 1, content: 'Agree. Better safe than sorry. User có thể retry sau.' },

  // Day 3 - Load Testing
  { sender: 2, content: 'Mình setup xong load testing environment. Ready khi team cần.' },
  { sender: 0, content: 'Mình vừa chạy load test. 1000 concurrent requests với cùng idempotency key.' },
  { sender: 1, content: 'Result?' },
  { sender: 0, content: '999 requests return 409 Conflict, 1 request process successfully. Perfect! ✅' },
  { sender: 3, content: 'Excellent! Mình verify manually với test account, kết quả khớp.' },
  { sender: 1, content: 'Awesome! Response time thế nào?' },
  { sender: 0, content: 'P99 là 15ms cho cached response, 200ms cho actual checkout (do payment gateway latency).' },
  { sender: 2, content: 'Redis latency P99 chỉ 2ms. Còn lại là application processing time.' },
  { sender: 1, content: 'Excellent. Redis really shines here.' },
  { sender: 0, content: 'Yeah. À mà mình thấy memory usage tăng sau load test. Chắc do result caching.' },
  { sender: 2, content: 'Mình check Redis memory, tăng khoảng 50MB. Expected cho 1000 results.' },
  { sender: 1, content: 'Expected thôi. TTL 24h nên sẽ auto cleanup. Monitor production để tune nếu cần.' },

  // Day 4 - Deployment Discussion
  { sender: 0, content: 'Ready to deploy! Bạn nghĩ nên deploy lúc nào?' },
  { sender: 2, content: 'Traffic thấp nhất là 2-4 AM. Nhưng mình có blue-green setup nên có thể deploy anytime.' },
  { sender: 1, content: 'Low traffic time. Thường là 2-4 AM. Nhưng feature này backward compatible nên có thể deploy anytime.' },
  { sender: 0, content: 'True. FE change là optional - chỉ thêm header. BE sẽ work với hoặc không có header.' },
  { sender: 3, content: 'Mình recommend deploy vào business hours để có team monitor. Rollback nhanh nếu cần.' },
  { sender: 1, content: 'Đúng, nếu không có idempotency key thì behave như cũ. Graceful degradation.' },
  { sender: 0, content: 'OK vậy deploy chiều nay? Trước giờ cao điểm tối.' },
  { sender: 2, content: 'Mình sẽ setup monitoring dashboard riêng cho feature này.' },
  { sender: 1, content: '👍 Sounds good. Mình sẽ monitor closely.' },

  // Day 4 - Post Deployment
  { sender: 0, content: 'Deployed! Đang monitor...' },
  { sender: 2, content: 'All pods healthy. Redis metrics stable. No errors in logs.' },
  { sender: 1, content: 'Mình thấy một số 409 responses trong log. Working as expected!' },
  { sender: 0, content: 'Yep, đó là duplicate requests bị block. Exactly what we want.' },
  { sender: 3, content: 'Mình đang check user tickets. Chưa có complaint mới nào 🤞' },
  { sender: 1, content: 'User feedback thế nào?' },
  { sender: 0, content: 'Chưa có complaint nào. Trước đây có ~5 tickets/ngày về duplicate charge.' },
  { sender: 1, content: 'Nice! Hopefully sẽ giảm về 0.' },
  { sender: 0, content: '🤞' },

  // Day 5 - Follow-up
  { sender: 3, content: 'Morning! Update: 0 duplicate charge tickets từ hôm qua đến giờ! 🎉' },
  { sender: 1, content: 'Morning! Qua 1 ngày rồi, có issue gì không?' },
  { sender: 0, content: 'Smooth sailing! 0 duplicate charge reports. 🎉' },
  { sender: 2, content: 'Infra side cũng ổn định. Redis memory usage stable ở ~100MB.' },
  { sender: 1, content: 'Awesome! Có metrics về số duplicate requests bị prevent không?' },
  { sender: 0, content: 'Có, khoảng 3% checkout requests là duplicate. Khá significant!' },
  { sender: 3, content: '3%! Wow, đó là ~150 potential duplicate charges mỗi ngày với traffic hiện tại.' },
  { sender: 1, content: 'Wow, 3% là nhiều đấy. Chắc do network issues và impatient users.' },
  { sender: 0, content: 'Yeah. Trước kia 3% đó đều bị charge double. Now chỉ charge 1 lần.' },
  { sender: 1, content: 'Great impact! Nên document lại approach này cho team.' },
  { sender: 2, content: 'Mình sẽ add runbook cho operational procedures.' },
  { sender: 0, content: 'Good idea. Mình sẽ viết tech doc và share trong tech talk.' },

  // Day 5 - Documentation
  { sender: 0, content: 'Draft doc xong rồi. Bạn review giúp?' },
  { sender: 1, content: 'Sure, send link.' },
  { sender: 0, content: 'https://docs.company.com/tech/idempotency-checkout' },
  { sender: 3, content: 'Mình cũng muốn review để hiểu flow cho testing.' },
  { sender: 1, content: 'Reading... 📖' },
  { sender: 2, content: 'Mình sẽ add infra section về Redis setup và monitoring.' },
  { sender: 1, content: 'Well written! Suggest thêm:\n1. Sequence diagram\n2. Redis key structure\n3. Failure scenarios và handling' },
  { sender: 0, content: 'Good suggestions. Mình update.' },
  { sender: 3, content: 'Suggest thêm section về test cases và how to reproduce issues.' },
  { sender: 1, content: 'Cũng nên mention về các alternatives mà mình đã consider nhưng không chọn.' },
  { sender: 0, content: 'Ví dụ?' },
  { sender: 1, content: 'Database unique constraint, optimistic locking, pessimistic locking. So sánh pros/cons.' },
  { sender: 0, content: 'Ah right. Giải thích tại sao Redis là best choice cho use case này.' },
  { sender: 1, content: 'Exactly. Show the thought process, không chỉ final solution.' },

  // Day 6 - Optimization Discussion
  { sender: 0, content: 'Hey, mình đang nghĩ về optimization. Current approach dùng 2 Redis calls: SETNX + GET.' },
  { sender: 2, content: 'Với Lua script, mình có thể reduce xuống 1 call. Atomic và faster.' },
  { sender: 1, content: 'Đúng, có thể optimize bằng Lua script để atomic.' },
  { sender: 0, content: 'Lua script? Nghe phức tạp...' },
  { sender: 1, content: 'Actually khá simple. Redis execute Lua script atomically. Mình có thể SETNX + GET trong 1 round trip.' },
  { sender: 2, content: 'Mình có example Lua script từ project trước. Sẽ share nếu team cần.' },
  { sender: 0, content: 'Ah, reduce latency và network calls. Worth it không?' },
  { sender: 1, content: 'Với volume của mình thì chưa cần. Nhưng good to know cho future scaling.' },
  { sender: 3, content: 'Agree, premature optimization. Current solution đã solve problem rồi.' },
  { sender: 0, content: 'OK, note lại trong doc. Premature optimization is root of all evil 😄' },
  { sender: 1, content: 'Knuth would be proud! 😂' },

  // Day 6 - Edge Case Found
  { sender: 3, content: 'Team ơi, có 1 user report case lạ: checkout success nhưng order không thấy trong history.' },
  { sender: 1, content: 'Ê, có user report case lạ: checkout success nhưng order không thấy trong history.' },
  { sender: 0, content: 'Hmm, payment charge thành công mà không tạo order? Có log không?' },
  { sender: 2, content: 'Mình check logs, thấy DB connection pool exhausted vào thời điểm đó.' },
  { sender: 1, content: 'Có. Payment success, nhưng order creation failed do DB connection timeout.' },
  { sender: 0, content: 'Oops, idempotency của mình chỉ cover payment, không cover full checkout flow.' },
  { sender: 3, content: 'Đây là gap lớn. User mất tiền mà không có order!' },
  { sender: 1, content: 'Right. Cần wrap entire checkout trong transaction.' },
  { sender: 0, content: 'Nhưng payment gateway là external service, không thể include trong DB transaction.' },
  { sender: 2, content: 'Cần distributed transaction pattern. Saga hoặc compensating transaction.' },
  { sender: 1, content: 'Đúng. Cần implement saga pattern hoặc compensating transaction.' },
  { sender: 0, content: 'Saga thì phức tạp. Compensating transaction = refund nếu order creation fail?' },
  { sender: 1, content: 'Yes. Flow: charge payment -> create order -> if order fails -> refund payment.' },
  { sender: 3, content: 'Cần test kỹ refund flow. Đây là money-related, không được có bug.' },
  { sender: 0, content: 'Sounds reasonable. Auto refund hay manual review?' },
  { sender: 1, content: 'Auto refund + alert. Manual review nếu refund fail.' },
  { sender: 2, content: 'Mình sẽ setup PagerDuty alert cho refund failures.' },
  { sender: 0, content: 'OK, mình sẽ implement. New PR incoming!' },

  // Day 7 - Final Implementation
  { sender: 0, content: 'PR #256 ready for review. Implemented compensating transaction.' },
  { sender: 1, content: 'Quick turnaround! Để mình xem...' },
  { sender: 2, content: 'Mình review infra changes.' },
  { sender: 3, content: 'Mình chuẩn bị test cases cho refund scenarios.' },
  { sender: 1, content: 'Looks good! Có test case cho refund flow không?' },
  { sender: 0, content: 'Có, mock payment gateway để simulate failures.' },
  { sender: 3, content: 'Mình đã test manual trên staging. All scenarios pass! ✅' },
  { sender: 2, content: 'Monitoring và alerting cũng ready.' },
  { sender: 1, content: 'Perfect. Approve! 🚀' },
  { sender: 0, content: 'Thanks! Deploy tonight.' },
  { sender: 2, content: 'Mình sẽ monitor deployment. Have PagerDuty ready.' },
  { sender: 1, content: 'Good luck! 🤞' },
  { sender: 0, content: 'Deployed successfully! Full checkout flow now atomic. 🎉' },
  { sender: 3, content: 'Awesome! Mình sẽ monitor tickets trong tuần tới để confirm fix.' },
  { sender: 1, content: 'Congrats! Great teamwork on this one. 👏' },
  { sender: 2, content: 'All systems nominal. Good job everyone! 🎊' },
  { sender: 0, content: 'Couldn\'t have done it without you all. Team effort! 🙌' },
  { sender: 1, content: 'That\'s what we\'re here for. On to the next challenge! 💪' },
  { sender: 3, content: 'Great collaboration! Let\'s keep this momentum. 🚀' },
];

// Demo Messages
const messageTemplates = [
  'Xin chào mọi người! 👋',
  'Hôm nay dự án tiến triển thế nào rồi?',
  'Có ai rảnh giúp mình review code được không?',
  'Meeting lúc 2h chiều nhé!',
  'Đã hoàn thành task được giao.',
  'Cần thêm thông tin về yêu cầu này.',
  'Good morning team! ☀️',
  'Có update gì mới không?',
  'Mình sẽ hoàn thành trước deadline.',
  'Có vấn đề gì cần thảo luận không?',
  '<p>Đây là <strong>tin nhắn</strong> với <em>markdown</em></p>',
  'Đợi mình chút, đang xử lý...',
  'Done! ✅',
  'Ai có thể giải thích thêm về vấn đề này?',
  'Cảm ơn mọi người đã hỗ trợ! 🙏',
];

// ============= Database Clients =============
async function createClient(database: string): Promise<Client> {
  const client = new Client({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database,
  });
  await client.connect();
  return client;
}

// ============= Identity Service Seeding =============
async function seedIdentityService() {
  console.log('\n📦 Seeding Identity Service...');

  const client = await createClient(config.databases.identity);

  try {
    // Hash password once
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD + PWD_PEPPER, 10);

    // Create Users
    console.log('  Creating users...');
    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, display_name, phone, email_verified_at, disabled, must_change_password)
         VALUES ($1, $2, $3, $4, $5, NOW(), false, false)
         ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name`,
        [user.id, user.email, passwordHash, user.displayName, user.phone]
      );
      console.log(`    ✓ User: ${user.email}`);
    }

    // Create Organizations
    console.log('  Creating organizations...');
    for (const org of organizations) {
      await client.query(
        `INSERT INTO organizations (id, slug, display_name, description, llm_provider, status, settings)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', '{}')
         ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name`,
        [org.id, org.slug, org.displayName, org.description, org.llmProvider]
      );
      console.log(`    ✓ Organization: ${org.slug}`);
    }

    // Create Memberships
    console.log('  Creating memberships...');
    for (const org of organizations) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        // First user is owner, others are members
        const roles = i === 0 ? ['OWNER', 'ADMIN'] : ['MEMBER'];
        const memberType = 'STAFF';

        await client.query(
          `INSERT INTO memberships (user_id, org_id, roles, member_type, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id, org_id) DO UPDATE SET roles = EXCLUDED.roles`,
          [user.id, org.id, roles, memberType]
        );
      }
      console.log(`    ✓ Memberships for: ${org.slug}`);
    }

    // Create Role Bindings (for RBAC)
    console.log('  Creating role bindings...');
    // Get role IDs
    const rolesResult = await client.query(`SELECT id, name FROM roles WHERE name IN ('OWNER', 'ADMIN', 'MEMBER')`);
    const roleMap = new Map<string, number>();
    for (const row of rolesResult.rows) {
      roleMap.set(row.name, row.id);
    }

    for (const org of organizations) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const roleName = i === 0 ? 'OWNER' : 'MEMBER';
        const roleId = roleMap.get(roleName);

        if (roleId) {
          await client.query(
            `INSERT INTO role_bindings (id, org_id, user_id, role_id, scope, created_at)
             VALUES ($1, $2, $3, $4, 'ORG', NOW())
             ON CONFLICT DO NOTHING`,
            [randomUUID(), org.id, user.id, roleId]
          );
        }
      }
      console.log(`    ✓ Role bindings for: ${org.slug}`);
    }

    console.log('  ✅ Identity Service seeded successfully!');
  } catch (error) {
    console.error('  ❌ Error seeding Identity Service:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// ============= Chat Service Seeding =============
async function seedChatService() {
  console.log('\n💬 Seeding Chat Service...');

  const client = await createClient(config.databases.chat);

  try {
    const rooms: Array<{ id: string; orgId: string; name: string }> = [];

    // Create Rooms for each organization
    console.log('  Creating rooms...');
    for (const org of organizations) {
      for (const template of roomTemplates) {
        const roomId = randomUUID();
        rooms.push({ id: roomId, orgId: org.id, name: template.name });

        await client.query(
          `INSERT INTO rooms (id, org_id, name, description, is_private, type, status, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [roomId, org.id, template.name, template.description, template.isPrivate, template.type, users[0].id]
        );
      }
      console.log(`    ✓ Rooms for: ${org.displayName}`);
    }

    // Add Room Members
    console.log('  Adding room members...');
    for (const room of rooms) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const role = i === 0 ? 'ADMIN' : 'MEMBER';

        await client.query(
          `INSERT INTO room_members (id, room_id, user_id, org_id, role, joined_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (room_id, user_id) DO NOTHING`,
          [randomUUID(), room.id, user.id, room.orgId, role]
        );
      }
    }
    console.log('    ✓ Room members added');

    // Create Messages
    console.log('  Creating messages...');
    let messageCount = 0;
    for (const room of rooms) {
      // Create 5-15 messages per room
      const numMessages = 5 + Math.floor(Math.random() * 10);

      for (let i = 0; i < numMessages; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const content = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
        const format = content.includes('<p>') ? 'markdown' : 'plain';

        // Offset created_at to create realistic timeline
        const offset = (numMessages - i) * 60 * 1000; // 1 minute apart

        await client.query(
          `INSERT INTO messages (id, room_id, user_id, org_id, content, type, format, created_at)
           VALUES ($1, $2, $3, $4, $5, 'text', $6, NOW() - INTERVAL '${offset} milliseconds')`,
          [randomUUID(), room.id, user.id, room.orgId, content, format]
        );
        messageCount++;
      }
    }
    console.log(`    ✓ ${messageCount} messages created`);

    // Create some Thread Replies
    console.log('  Creating thread replies...');
    const parentMessages = await client.query(
      `SELECT id, room_id, org_id FROM messages WHERE thread_id IS NULL ORDER BY RANDOM() LIMIT 10`
    );

    for (const parent of parentMessages.rows) {
      const numReplies = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numReplies; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const content = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];

        await client.query(
          `INSERT INTO messages (id, room_id, user_id, org_id, content, type, thread_id, created_at)
           VALUES ($1, $2, $3, $4, $5, 'text', $6, NOW())`,
          [randomUUID(), parent.room_id, user.id, parent.org_id, content, parent.id]
        );
      }
    }
    console.log('    ✓ Thread replies created');

    // Create Reactions
    console.log('  Creating reactions...');
    const emojis = ['👍', '❤️', '😂', '🎉', '🚀', '👏', '🔥', '✅'];
    const messagesToReact = await client.query(
      `SELECT id FROM messages ORDER BY RANDOM() LIMIT 30`
    );

    for (const msg of messagesToReact.rows) {
      const numReactions = 1 + Math.floor(Math.random() * 3);
      const usersToReact = [...users].sort(() => Math.random() - 0.5).slice(0, numReactions);

      for (const user of usersToReact) {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        await client.query(
          `INSERT INTO message_reactions (id, message_id, user_id, emoji, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
          [randomUUID(), msg.id, user.id, emoji]
        );
      }
    }
    console.log('    ✓ Reactions created');

    // Create AI Configs for some rooms
    console.log('  Creating AI configs...');
    const aiRooms = rooms.filter(r => r.name === 'engineering' || r.name === 'general');
    for (const room of aiRooms) {
      await client.query(
        `INSERT INTO channel_ai_configs (id, room_id, ai_enabled, enabled_features, model_provider, model_name, temperature, max_tokens, created_at, updated_at)
         VALUES ($1, $2, true, $3, 'openai', 'gpt-4o-mini', 0.7, 2000, NOW(), NOW())
         ON CONFLICT (room_id) DO NOTHING`,
        [randomUUID(), room.id, 'summary,action_items,qa,document_summary']
      );
    }
    console.log('    ✓ AI configs created');

    // Seed Checkout Race Condition Conversation
    console.log('  Creating checkout race condition conversation...');
    const checkoutRooms = rooms.filter(r => r.name === 'checkout-race-condition');
    // Users for conversation: 0 = Nguyễn Văn A (index 1), 1 = Trần Thị B (index 2), 2 = Lê Văn C (index 3), 3 = Phạm Thị D (index 4)
    const conversationUsers = [users[1], users[2], users[3], users[4]]; // Skip admin (index 0)

    for (const room of checkoutRooms) {
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() - 7); // Start conversation 7 days ago

      for (let i = 0; i < checkoutRaceConditionConversation.length; i++) {
        const msg = checkoutRaceConditionConversation[i];
        const sender = conversationUsers[msg.sender];

        // Spread messages over 7 days, with multiple messages per day
        const dayOffset = Math.floor(i / 20); // ~20 messages per day
        const minuteOffset = (i % 20) * 15; // 15 minutes apart within a day
        const messageTime = new Date(baseTime);
        messageTime.setDate(messageTime.getDate() + dayOffset);
        messageTime.setMinutes(messageTime.getMinutes() + minuteOffset);

        await client.query(
          `INSERT INTO messages (id, room_id, user_id, org_id, content, type, format, created_at)
           VALUES ($1, $2, $3, $4, $5, 'text', 'plain', $6)`,
          [randomUUID(), room.id, sender.id, room.orgId, msg.content, messageTime]
        );
      }
    }
    console.log(`    ✓ ${checkoutRaceConditionConversation.length} checkout race condition messages created`);

    // Create DM rooms between users
    console.log('  Creating DM rooms...');
    for (let i = 0; i < 3; i++) {
      const user1 = users[i];
      const user2 = users[i + 1];
      const org = organizations[0];
      const dmRoomId = randomUUID();

      await client.query(
        `INSERT INTO rooms (id, org_id, is_private, type, status, created_at, updated_at)
         VALUES ($1, $2, true, 'dm', 'ACTIVE', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [dmRoomId, org.id]
      );

      // Add both users as members
      await client.query(
        `INSERT INTO room_members (id, room_id, user_id, org_id, role, joined_at)
         VALUES ($1, $2, $3, $4, 'MEMBER', NOW())
         ON CONFLICT (room_id, user_id) DO NOTHING`,
        [randomUUID(), dmRoomId, user1.id, org.id]
      );
      await client.query(
        `INSERT INTO room_members (id, room_id, user_id, org_id, role, joined_at)
         VALUES ($1, $2, $3, $4, 'MEMBER', NOW())
         ON CONFLICT (room_id, user_id) DO NOTHING`,
        [randomUUID(), dmRoomId, user2.id, org.id]
      );

      // Add some DM messages
      const dmMessages = ['Hi!', 'Chào bạn!', 'Có việc gì không?', 'Không có gì, chỉ hỏi thăm thôi 😊'];
      for (let j = 0; j < dmMessages.length; j++) {
        const sender = j % 2 === 0 ? user1 : user2;
        await client.query(
          `INSERT INTO messages (id, room_id, user_id, org_id, content, type, created_at)
           VALUES ($1, $2, $3, $4, $5, 'text', NOW() - INTERVAL '${(dmMessages.length - j) * 5} minutes')`,
          [randomUUID(), dmRoomId, sender.id, org.id, dmMessages[j]]
        );
      }
    }
    console.log('    ✓ DM rooms created');

    console.log('  ✅ Chat Service seeded successfully!');
  } catch (error) {
    console.error('  ❌ Error seeding Chat Service:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// ============= Notification Service Seeding =============
async function seedNotificationService() {
  console.log('\n🔔 Seeding Notification Service...');

  const client = await createClient(config.databases.notification);

  try {
    const notificationTypes = [
      { type: 'ORG_INVITATION', title: 'Bạn được mời tham gia tổ chức', content: 'Bạn đã được mời tham gia ACME Corporation' },
      { type: 'ORG_MEMBER_JOINED', title: 'Thành viên mới đã tham gia', content: 'Một thành viên mới đã tham gia tổ chức của bạn' },
      { type: 'CHAT_MENTION', title: 'Bạn được mention', content: 'Có người mention bạn trong cuộc trò chuyện' },
      { type: 'SYSTEM_ANNOUNCEMENT', title: 'Thông báo hệ thống', content: 'Hệ thống sẽ bảo trì vào cuối tuần này' },
      { type: 'REPORT_COMPLETED', title: 'Báo cáo hoàn thành', content: 'Báo cáo của bạn đã được tạo xong' },
    ];

    console.log('  Creating notifications...');
    for (const user of users) {
      for (const org of organizations) {
        // Create 2-3 notifications per user per org
        const numNotifications = 2 + Math.floor(Math.random() * 2);
        const shuffledTypes = [...notificationTypes].sort(() => Math.random() - 0.5);

        for (let i = 0; i < numNotifications; i++) {
          const notif = shuffledTypes[i];
          const isRead = Math.random() > 0.5;

          await client.query(
            `INSERT INTO notifications (id, "userId", "orgId", type, title, content, metadata, "isRead", "readAt", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '${i * 60} minutes')
             ON CONFLICT DO NOTHING`,
            [
              randomUUID(),
              user.id,
              org.id,
              notif.type,
              notif.title,
              notif.content,
              JSON.stringify({ orgName: org.displayName }),
              isRead,
              isRead ? new Date() : null,
            ]
          );
        }
      }
    }
    console.log('    ✓ Notifications created');

    console.log('  ✅ Notification Service seeded successfully!');
  } catch (error) {
    console.error('  ❌ Error seeding Notification Service:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// ============= Main =============
async function main() {
  console.log('🚀 Starting Demo Data Seeding...');
  console.log(`   PostgreSQL: ${config.postgres.host}:${config.postgres.port}`);
  console.log(`   Demo password for all users: ${DEMO_PASSWORD}`);

  try {
    await seedIdentityService();
    await seedChatService();
    await seedNotificationService();

    console.log('\n✅ All demo data seeded successfully!');
    console.log('\n📝 Demo Users:');
    for (const user of users) {
      console.log(`   - ${user.email} (${user.displayName})`);
    }
    console.log('\n📝 Demo Organizations:');
    for (const org of organizations) {
      console.log(`   - ${org.slug} (${org.displayName})`);
    }
    console.log(`\n🔑 Password for all users: ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
