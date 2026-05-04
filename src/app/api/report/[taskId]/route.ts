import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";
import { deleteReport, getReport, getReportWithMeta } from "@/lib/db/repository";
import { getMockReport } from "@/lib/mock/report-data";

type Context = {
  params: Promise<{
    taskId: string;
  }>;
};

function isLocalStorageUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /better-sqlite3|bindings file|not valid for use in process|node-gyp/i.test(error.message);
}

export async function GET(_req: Request, context: Context) {
  const { taskId } = await context.params;
  const session = await getServerSession(authOptions);
  let createdAt: string | null = null;
  let report = !session?.user?.id ? getMockReport(taskId) : null;

  try {
    const reportWithMeta = await getReportWithMeta(taskId, session?.user?.id || null);
    report = reportWithMeta?.report ?? ((await getReport(taskId, session?.user?.id || null)) ?? report);
    createdAt = reportWithMeta?.createdAt || null;
  } catch (error) {
    if (!isLocalStorageUnavailable(error)) {
      throw error;
    }
    report = report ?? getMockReport(taskId);
  }

  if (!report) {
    return NextResponse.json(
      {
        success: false,
        message: "未找到对应报告",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      report,
      meta: {
        createdAt: createdAt || new Date().toISOString(),
      },
    },
  });
}

export async function DELETE(_req: Request, context: Context) {
  const { taskId } = await context.params;
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "请先登录后再删除报告",
        },
        { status: 401 }
      );
    }

    await deleteReport(taskId, session.user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "删除失败",
      },
      { status: 500 }
    );
  }
}
