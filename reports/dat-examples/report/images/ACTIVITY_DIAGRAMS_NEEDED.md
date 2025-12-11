# Activity Diagram Images Needed for Section 3.5

Please add the following activity diagram images to the `images/` folder:

## Nhóm Xác thực (Authentication)
1. **act_register.png** - Activity diagram cho chức năng đăng ký
2. **act_login.png** - Activity diagram cho chức năng đăng nhập

## Nhóm Workspace
3. **act_create_workspace.png** - Activity diagram cho chức năng tạo Workspace
4. **act_view_dashboard.png** - Activity diagram cho chức năng xem Dashboard

## Nhóm Thành viên (Members)
5. **act_invite_member.png** - Activity diagram cho chức năng mời thành viên
6. **act_change_role.png** - Activity diagram cho chức năng phân quyền thành viên

## Nhóm Tệp tin (Files)
7. **act_upload_file.png** - Activity diagram cho chức năng upload tệp
8. **act_check_file_access.png** - Activity diagram cho chức năng kiểm tra quyền truy cập tệp

## Nhóm Thông báo (Notifications)
9. **act_view_notifications.png** - Activity diagram cho chức năng xem thông báo
10. **act_config_notification.png** - Activity diagram cho chức năng cấu hình thông báo

## Nhóm Báo cáo AI (AI Reports)
11. **act_view_reports.png** - Activity diagram cho chức năng xem báo cáo tổng hợp
12. **act_create_ai_report.png** - Activity diagram cho chức năng tạo báo cáo tùy chỉnh
13. **act_query_llm.png** - Activity diagram cho chức năng truy vấn LLM Provider

## Design Guidelines:

- **Tool**: Use draw.io, Lucidchart, PlantUML, or similar UML diagram tool
- **Format**: PNG with transparent background
- **Resolution**: At least 1200px width for clarity
- **Style**: UML Activity Diagram notation
  - Start node (filled circle)
  - End node (filled circle with ring)
  - Action nodes (rounded rectangles)
  - Decision nodes (diamonds)
  - Fork/Join nodes (thick horizontal/vertical bars)
  - Swimlanes if multiple actors involved
- **Labels**: Vietnamese language for actions and decisions
- **Colors**: Professional color scheme (light blue for actions, orange for decisions)

## Example Structure:

Each activity diagram should follow this flow:
1. Start
2. User initiates action
3. System validates input/permissions
4. Decision point (success/failure)
5. Process action or return error
6. Update database
7. Send notifications (if applicable)
8. End

## Additional Diagrams (Optional, not referenced in current document):

If you want to expand the section, you can add these activity diagrams:

14. **act_logout.png** - Đăng xuất
15. **act_forgot_password.png** - Quên mật khẩu
16. **act_change_password.png** - Đổi mật khẩu
17. **act_verify_account.png** - Xác thực tài khoản
18. **act_update_profile.png** - Cập nhật thông tin cá nhân
19. **act_config_workspace.png** - Cấu hình Workspace
20. **act_view_workspaces.png** - Xem danh sách Workspace
21. **act_lock_workspace.png** - Khóa Workspace
22. **act_view_audit_log.png** - Xem Audit Log
23. **act_remove_member.png** - Xóa thành viên
24. **act_view_members.png** - Xem danh sách thành viên
25. **act_send_invite_email.png** - Gửi email mời
26. **act_transfer_owner.png** - Cấp quyền Owner
27. **act_revoke_owner.png** - Thu hồi quyền Owner
28. **act_view_files.png** - Xem danh sách tệp
29. **act_download_file.png** - Tải tệp
30. **act_delete_file.png** - Xóa tệp
31. **act_search_file.png** - Tìm kiếm tệp
32. **act_mark_read.png** - Đánh dấu thông báo đã đọc
33. **act_export_report.png** - Xuất báo cáo
