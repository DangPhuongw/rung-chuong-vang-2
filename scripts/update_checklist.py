"""
Script cap nhat Checklist Tien Do Du An: Rung Chuong Vang 2
Dong bo 2 chieu giua:
  - Rung Chuông Vàng 2 - Checklist Tiến Độ Dự Án.xlsx
  - CHECKLIST.md
"""

import sys
import os
import argparse
from datetime import datetime
import openpyxl

# Dam bao terminal Windows in dung tieng Viet va emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

EXCEL_FILE = "Rung Chuông Vàng 2 - Checklist Tiến Độ Dự Án.xlsx"
MD_FILE = "CHECKLIST.md"

STATUS_MAP = {
    "xong": "☑ Xong",
    "done": "☑ Xong",
    "dang_lam": "◐ Đang làm",
    "in_progress": "◐ Đang làm",
    "chua_lam": "☐ Chưa làm",
    "todo": "☐ Chưa làm"
}

STATUS_TO_MD = {
    "☑ Xong": "[x]",
    "◐ Đang làm": "[/]",
    "☐ Chưa làm": "[ ]"
}

PHASE_ROWS = {
    "0. Khởi tạo & Nền tảng": 6,
    "1. Quiz Editor & Dữ liệu": 7,
    "2. Phòng chờ (Lobby) & Bot": 8,
    "3. Engine Thi đấu Realtime": 9,
    "4. QA, Kiểm thử & Deploy": 10,
}

def recalculate_summaries(sheet):
    phases = list(PHASE_ROWS.keys())
    stats = {p: {"total": 0, "done": 0, "in_progress": 0, "todo": 0} for p in phases}
    
    # Rows 14 to 41 are tasks 1 to 28
    for r in range(14, 42):
        stt_val = sheet.cell(r, 1).value
        if stt_val is None:
            continue
        phase_name = str(sheet.cell(r, 2).value or "").strip()
        status_val = str(sheet.cell(r, 6).value or "").strip()
        
        if phase_name in stats:
            stats[phase_name]["total"] += 1
            if "Xong" in status_val:
                stats[phase_name]["done"] += 1
            elif "Đang làm" in status_val or "Dang lam" in status_val:
                stats[phase_name]["in_progress"] += 1
            else:
                stats[phase_name]["todo"] += 1

    total_all = 0
    done_all = 0
    in_progress_all = 0
    todo_all = 0

    for phase_name, row_idx in PHASE_ROWS.items():
        p_stat = stats[phase_name]
        tot = p_stat["total"]
        dn = p_stat["done"]
        ip = p_stat["in_progress"]
        td = p_stat["todo"]
        pct_str = f"{(dn / tot * 100):.1f}%" if tot > 0 else "0.0%"

        sheet.cell(row_idx, 2).value = float(tot)
        sheet.cell(row_idx, 3).value = float(dn)
        sheet.cell(row_idx, 4).value = float(ip)
        sheet.cell(row_idx, 5).value = float(td)
        sheet.cell(row_idx, 6).value = pct_str

        total_all += tot
        done_all += dn
        in_progress_all += ip
        todo_all += td

    # Total row (Row 11)
    tot_pct = f"{(done_all / total_all * 100):.1f}%" if total_all > 0 else "0.0%"
    sheet.cell(11, 2).value = float(total_all)
    sheet.cell(11, 3).value = float(done_all)
    sheet.cell(11, 4).value = float(in_progress_all)
    sheet.cell(11, 5).value = float(todo_all)
    sheet.cell(11, 6).value = tot_pct
    sheet.cell(11, 7).value = f"Đã hoàn thành {done_all}/{total_all} hạng mục cốt lõi"


def generate_markdown(sheet):
    md_lines = []
    title = sheet.cell(1, 1).value or "RUNG CHUÔNG VÀNG 2 — BẢNG THEO DÕI TIẾN ĐỘ & CHECKLIST DỰ ÁN"
    stack = sheet.cell(2, 1).value or "Stack: Next.js 14, Socket.IO, Tailwind CSS, Prisma, Zustand"
    
    md_lines.append(f"# 🔔 {title}")
    md_lines.append(f"> **{stack}**\n")
    md_lines.append("## 📊 BẢNG TỔNG HỢP TIẾN ĐỘ THEO GIAI ĐOẠN\n")
    md_lines.append("| Giai đoạn | Tổng việc | ☑ Xong | ◐ Đang làm | ☐ Chưa làm | % Hoàn thành | Trọng tâm giai đoạn |")
    md_lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :--- |")

    for r in range(6, 12):
        giai_doan = str(sheet.cell(r, 1).value or "").strip()
        tong = sheet.cell(r, 2).value or 0
        xong = sheet.cell(r, 3).value or 0
        dang_lam = sheet.cell(r, 4).value or 0
        chua_lam = sheet.cell(r, 5).value or 0
        pct = sheet.cell(r, 6).value or "0%"
        trong_tam = str(sheet.cell(r, 7).value or "").strip()
        
        tong_str = f"{int(tong)}" if isinstance(tong, (int, float)) else str(tong)
        xong_str = f"{int(xong)}" if isinstance(xong, (int, float)) else str(xong)
        dl_str = f"{int(dang_lam)}" if isinstance(dang_lam, (int, float)) else str(dang_lam)
        cl_str = f"{int(chua_lam)}" if isinstance(chua_lam, (int, float)) else str(chua_lam)

        if r == 11:
            md_lines.append(f"| **{giai_doan}** | **{tong_str}** | **{xong_str}** | **{dl_str}** | **{cl_str}** | **{pct}** | **{trong_tam}** |")
        else:
            md_lines.append(f"| {giai_doan} | {tong_str} | {xong_str} | {dl_str} | {cl_str} | {pct} | {trong_tam} |")

    md_lines.append("\n---\n")
    md_lines.append("## 📋 CHI TIẾT CHECKLIST TỪNG HẠNG MỤC CÔNG VIỆC\n")
    md_lines.append("| STT | Checkbox | Hạng mục công việc | Phân hệ | Definition of Done | Trạng thái | Ngày cập nhật | Ghi chú kỹ thuật |")
    md_lines.append("| :---: | :---: | :--- | :--- | :--- | :---: | :---: | :--- |")

    for r in range(14, 42):
        stt = sheet.cell(r, 1).value
        if stt is None:
            continue
        stt_int = int(stt) if isinstance(stt, (int, float)) else str(stt)
        task_name = str(sheet.cell(r, 3).value or "").strip()
        module_name = str(sheet.cell(r, 4).value or "").strip()
        dod = str(sheet.cell(r, 5).value or "").strip()
        status = str(sheet.cell(r, 6).value or "").strip()
        updated_at = str(sheet.cell(r, 7).value or "")[:10].strip()
        note = str(sheet.cell(r, 8).value or "").strip()

        cb = STATUS_TO_MD.get(status, "[ ]")
        md_lines.append(f"| {stt_int} | {cb} | **{task_name}** | `{module_name}` | {dod} | {status} | {updated_at} | {note} |")

    md_lines.append("\n---\n")
    md_lines.append("> 💡 *Bảng theo dõi này được đồng bộ tự động với file Excel `Rung Chuông Vàng 2 - Checklist Tiến Độ Dự Án.xlsx` qua script `scripts/update_checklist.py`.*")
    
    with open(MD_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines) + "\n")


def update_task(stt: int, status_key: str, note: str = None):
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: {EXCEL_FILE} does not exist.")
        sys.exit(1)

    wb = openpyxl.load_workbook(EXCEL_FILE)
    sheet = wb.active

    row_idx = 13 + stt
    if row_idx > 41 or row_idx < 14:
        print(f"Error: STT {stt} is out of range (1-28).")
        sys.exit(1)

    new_status = STATUS_MAP.get(status_key.lower().replace("-", "_"), status_key)
    sheet.cell(row_idx, 6).value = new_status
    sheet.cell(row_idx, 7).value = datetime.now().strftime("%Y-%m-%d")
    
    if note:
        sheet.cell(row_idx, 8).value = note

    recalculate_summaries(sheet)
    wb.save(EXCEL_FILE)
    generate_markdown(sheet)
    print(f"✅ Đã cập nhật STT {stt} thành [{new_status}]. Đã đồng bộ {EXCEL_FILE} và {MD_FILE}!")


def main():
    parser = argparse.ArgumentParser(description="Quản lý & Cập nhật Checklist Tiến Độ Rung Chuông Vàng 2")
    parser.add_argument("--stt", type=int, help="Số thứ tự công việc (1 đến 28)")
    parser.add_argument("--status", type=str, choices=["xong", "done", "dang_lam", "in_progress", "chua_lam", "todo"], help="Trạng thái mới")
    parser.add_argument("--note", type=str, default=None, help="Ghi chú kỹ thuật bổ sung")
    parser.add_argument("--sync", action="store_true", help="Đồng bộ tạo lại file CHECKLIST.md từ Excel")
    parser.add_argument("--show", action="store_true", help="Hiển thị tóm tắt tiến độ")

    args = parser.parse_args()

    if not os.path.exists(EXCEL_FILE):
        print(f"Error: File {EXCEL_FILE} không tồn tại.")
        sys.exit(1)

    wb = openpyxl.load_workbook(EXCEL_FILE)
    sheet = wb.active

    if args.stt and args.status:
        update_task(args.stt, args.status, args.note)
    elif args.sync:
        recalculate_summaries(sheet)
        wb.save(EXCEL_FILE)
        generate_markdown(sheet)
        print(f"✅ Đã đồng bộ thành công sang {MD_FILE}!")
    elif args.show:
        recalculate_summaries(sheet)
        print("=== BẢNG TỔNG HỢP TIẾN ĐỘ ===")
        for r in range(6, 12):
            print(f"{sheet.cell(r, 1).value}: Xong {sheet.cell(r, 3).value}/{sheet.cell(r, 2).value} ({sheet.cell(r, 6).value})")
    else:
        # Default: sync to markdown
        recalculate_summaries(sheet)
        wb.save(EXCEL_FILE)
        generate_markdown(sheet)
        print(f"✅ Đã đồng bộ {EXCEL_FILE} và {MD_FILE}!")

if __name__ == "__main__":
    main()
