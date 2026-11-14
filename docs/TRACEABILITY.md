# Traceability: manual cases to automated tests

Each row is one manual UI case from `docs/manual-test-cases.json`
(sheet `Test case UI` of `sphere-ui-test-cases.xlsx`). The test title
carries the case ID; the report annotations carry priority and trace.

| ID | Manual case | Priority | Automated test |
| --- | --- | --- | --- |
| UI-001 | Trang chủ lần đầu | P0 | `src/specs/startup-map.spec.ts` (desktop: passed, smartphone: passed) |
| UI-002 | Phóng, thu và về toàn thiên | P1 | `src/specs/startup-map.spec.ts` (desktop: passed, smartphone: passed) |
| UI-003 | Chọn vị trí trên bản đồ | P0 | `src/specs/startup-map.spec.ts` (desktop: passed, smartphone: passed) |
| UI-004 | Điều khiển bản đồ bằng phím | P1 | `src/specs/startup-map.spec.ts` (desktop: passed, smartphone: passed) |
| UI-005 | Mở mục tiêu gợi ý | P0 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-006 | Tìm tên hợp lệ | P0 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-007 | Tọa độ thập phân | P0 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-008 | Tọa độ sexagesimal | P1 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-009 | Tên không tồn tại giữ view | P0 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-010 | Sửa lại tìm kiếm sau lỗi | P1 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-011 | Biên tọa độ | P1 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-012 | Dịch vụ tên không khả dụng | P1 | `src/specs/search.spec.ts` (desktop: passed, smartphone: passed) |
| UI-013 | Simple sang Advanced | P0 | `src/specs/modes.spec.ts` (desktop: passed, smartphone: passed) |
| UI-014 | Khôi phục cài đặt Advanced | P0 | `src/specs/modes.spec.ts` (desktop: passed, smartphone: passed) |
| UI-015 | Ưu tiên mode trong URL | P1 | `src/specs/modes.spec.ts` (desktop: passed, smartphone: passed) |
| UI-016 | Next và Previous | P0 | `src/specs/playback.spec.ts` (desktop: passed, smartphone: passed) |
| UI-017 | Play, pause và tốc độ | P0 | `src/specs/playback.spec.ts` (desktop: passed, smartphone: passed) |
| UI-018 | Slider và timeline | P1 | `src/specs/playback.spec.ts` (desktop: passed, smartphone: passed) |
| UI-019 | Phím tắt không cản nhập liệu | P1 | `src/specs/playback.spec.ts` (desktop: passed, smartphone: passed) |
| UI-020 | Band đơn và tổ hợp | P0 | `src/specs/image.spec.ts` (desktop: passed, smartphone: passed) |
| UI-021 | Nhóm exposure/day/sky pass | P1 | `src/specs/image.spec.ts` (desktop: passed, smartphone: passed) |
| UI-022 | Kênh RGB mượn ngày | P0 | `src/specs/image.spec.ts` (desktop: passed, smartphone: passed) |
| UI-023 | Median và reference | P1 | `src/specs/image.spec.ts` (desktop: passed, smartphone: passed) |
| UI-024 | Sum và contrast reset | P1 | `src/specs/image.spec.ts` (desktop: passed, smartphone: passed) |
| UI-025 | Chuyển tiến trình 3×3 | P1 | `src/specs/image.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-026 | Drill-down 7×7 | P1 | `src/specs/image.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-027 | Bật tắt overlay | P1 | `src/specs/overlays.spec.ts` (desktop: passed, smartphone: passed) |
| UI-028 | Spectrum và light curve | P1 | `src/specs/analysis.spec.ts` (desktop: passed, smartphone: passed) |
| UI-029 | This frame và saturation | P1 | `src/specs/analysis.spec.ts` (desktop: passed, smartphone: passed) |
| UI-030 | URL và Back/Forward | P0 | `src/specs/navigation.spec.ts` (desktop: passed, smartphone: passed) |
| UI-031 | Phản hồi cũ không ghi đè | P1 | `src/specs/navigation.spec.ts` (desktop: passed, smartphone: passed) |
| UI-032 | Liên kết GIF, Page, Data | P2 | `src/specs/share.spec.ts` (desktop: passed, smartphone: passed) |
| UI-033 | Biên breakpoint | P1 | `src/specs/responsive.spec.ts` (desktop: passed, smartphone: passed) |
| UI-034 | Focus và tooltip | P1 | `src/specs/accessibility.spec.ts` (desktop: passed, smartphone: passed) |
| UI-035 | Reduced motion và screen reader | P1 | `src/specs/accessibility.spec.ts` (desktop: passed, smartphone: passed) |
| UI-036 | Mất mạng khi đang tải | P1 | `src/specs/errors-recovery.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-037 | Measure this object | P1 | `src/specs/analysis.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-038 | Thiết bị chạm thật | P1 | `src/specs/responsive.spec.ts` (desktop: skipped, smartphone: skipped) |

Run outcomes across both projects: {"passed":66,"skipped":10}
