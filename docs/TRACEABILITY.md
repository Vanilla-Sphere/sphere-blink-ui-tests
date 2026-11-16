# Traceability: manual cases to automated tests

Each row is one manual UI case from `docs/manual-test-cases.json`
(sheet `Test case UI` of `sphere-ui-test-cases.xlsx`). The test title
carries the case ID; the report annotations carry priority and trace.

| ID | Manual case | Priority | Automated test |
| --- | --- | --- | --- |
| UI-001 | Trang chủ lần đầu | P0 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-002 | Phóng, thu và về toàn thiên | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-003 | Chọn vị trí trên bản đồ | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-004 | Điều khiển bản đồ bằng phím | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-005 | Mở mục tiêu gợi ý | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-006 | Tìm tên hợp lệ | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-007 | Tọa độ thập phân | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-008 | Tọa độ sexagesimal | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-009 | Tên không tồn tại giữ view | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-010 | Sửa lại tìm kiếm sau lỗi | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-011 | Biên tọa độ | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-012 | Dịch vụ tên không khả dụng | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-013 | Simple sang Advanced | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-014 | Khôi phục cài đặt Advanced | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-015 | Ưu tiên mode trong URL | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-016 | Next và Previous | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-017 | Play, pause và tốc độ | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-018 | Slider và timeline | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-019 | Phím tắt không cản nhập liệu | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-020 | Band đơn và tổ hợp | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-021 | Nhóm exposure/day/sky pass | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-022 | Kênh RGB mượn ngày | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-023 | Median và reference | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-024 | Sum và contrast reset | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-025 | Chuyển tiến trình 3×3 | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-026 | Drill-down 7×7 | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-027 | Bật tắt overlay | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-028 | Spectrum và light curve | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-029 | This frame và saturation | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-030 | URL và Back/Forward | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-031 | Phản hồi cũ không ghi đè | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-032 | Liên kết GIF, Page, Data | P2 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-033 | Biên breakpoint | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-034 | Focus và tooltip | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-035 | Reduced motion và screen reader | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-036 | Mất mạng khi đang tải | P1 | `src/specs/00-fast.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-037 | Measure this object | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-038 | Thiết bị chạm thật | P1 | `src/specs/00-fast.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-039 | Trang đầu: tâm Ngân Hà, Whole sky, sáu thẻ | P0 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-040 | Thẻ mở đúng mục tiêu/chế độ | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-041 | Thẻ mở Discoveries/Redshift/About | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-042 | Thẻ: zoom, full screen, mobile | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-043 | Star snapping và Alt-click | P1 | `src/specs/00-fast.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-044 | Ảnh nền 2MASS và atlas lỗi | P1 | `src/specs/00-fast.spec.ts` (desktop: passed, smartphone: passed) |
| UI-045 | Reduced motion trên bản đồ | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-046 | Zoom ảnh và reset | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-047 | Show/Hide flagged | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-048 | Chỉ có điểm flagged vẫn hiển thị | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-049 | Phân biệt cờ lõi sáng và cờ lỗi | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-050 | Nhóm ngày Over time | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-051 | Nhóm phóng giữ flagged/thang | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-052 | Câu Over time theo trạng thái | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-053 | Preliminary reading | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-054 | Reference wavelengths | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-055 | Reading theo target mới | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-056 | Xuất CSV và PNG phổ | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-057 | Source files | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-058 | Distance and redshift | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-059 | Lookup không đáp ứng | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-060 | From its lines cho quasar | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-061 | Không gán z từ một vạch | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-062 | Bộ lọc redshift Off/All/ngưỡng | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-063 | Hover/click đối tượng redshift | P1 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-064 | Compare spectra tới 6 object | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-065 | Compare: trục, thang, z, Reset | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-066 | Discoveries All/Fast/Slow/Following | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-067 | Frame mover: URL mover/seen | P0 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-068 | Back to field và fallback | P0 | `src/specs/journey.spec.ts` (desktop: skipped, smartphone: skipped) |
| UI-069 | Overlay mover: path, ring, band | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-070 | Vote Real motion / False alarm | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-071 | Follow qua reload | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-072 | Measured: hướng và giới hạn | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-073 | Biểu đồ motion | P2 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-074 | Biên 480/760 cho phần mới | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-075 | Đổi target khi mạng chậm | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-076 | Chuỗi field→mover→exposure→Back | P1 | `src/specs/journey.spec.ts` (desktop: passed, smartphone: passed) |
| UI-077 | Bốn nhóm, 21 loại, mở lại không nhân bản | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-078 | Từng nhóm đúng tên/đường dẫn | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-079 | Hàng One ẩn/khiến có ID | P1 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-080 | Mỗi URL mở tab mới đúng href | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-081 | Cube tải đúng định dạng | P1 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-082 | Copy đúng URL tuyệt đối | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-083 | Frame/Epochs/Cube theo det/group/diff | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-084 | Danh sách theo target mới | P0 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-085 | Simple ẩn danh sách | P1 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-086 | Bàn phím với danh sách | P1 | `src/specs/api-list.spec.ts` (desktop: passed, smartphone: passed) |
| UI-098 | Landing hiển thị, Open the sky map | P0 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-099 | Deep link /? chuyển /sky giữ tham số | P0 | `src/specs/legacy-urls.spec.ts` (desktop: passed, smartphone: passed) |
| UI-100 | Redirect giữ ra/dec/levels/mover/seen | P1 | `src/specs/legacy-urls.spec.ts` (desktop: passed, smartphone: passed) |
| UI-101 | Section navigation | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-102 | Thẻ mở đúng view | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-103 | Open the log ở Advanced | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-104 | Finder blink Visit 1-6 Pause/Play | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-105 | Cuộn landing + imagery + credit | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-106 | Team và Contact | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-107 | Landing responsive + keyboard | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-108 | Link landing: href + tab mới | P1 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |
| UI-109 | Blind search đang chạy + stack | P0 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-110 | Row lý do stack | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-111 | TNO/slow phân loại | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-112 | Ghép blind/stack | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-113 | Stack lỗi/chưa sẵn sàng | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-114 | Completeness blind/stack | P1 | `**not implemented**` |
| UI-115 | Lỗi archive giữa lúc nạp | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-116 | Progressive field stage rộng thất bại | P0 | `**not implemented**` |
| UI-117 | Retry cube 'at most twice' | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-118 | Over time theo band/tổng | P1 | `**not implemented**` (desktop: skipped, smartphone: skipped) |
| UI-119 | Link /sky round trip | P1 | `src/specs/legacy-urls.spec.ts` (desktop: passed, smartphone: passed) |
| UI-120 | Responsive + phím + popup | P2 | `src/specs/landing.spec.ts` (desktop: passed, smartphone: passed) |

Run outcomes across both projects: {"passed":184,"skipped":46}
