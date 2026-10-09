import { NextResponse } from "next/server";
import { templateWorkbook } from "@/lib/workbook";

export async function GET() {
  const body = templateWorkbook();
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=launchyard-products.xlsx",
    },
  });
}
