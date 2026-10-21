import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api-response";
import { createCustomerSchema } from "@/lib/validation/customer";

// GET /api/customers?search=&page=&pageSize=
// Lists customers (excludes soft-deleted rows). Supports simple search on
// name / mobile / code and pagination.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

    const where = {
      isDeleted: false,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { mobile: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.posCustomer.findMany({
        where,
        orderBy: { createdDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.posCustomer.count({ where }),
    ]);

    return ok({ rows, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = createCustomerSchema.parse(body);

    const customer = await prisma.posCustomer.create({
      data: {
        ...input,
        email: input.email || undefined,
        createdDate: new Date(),
      },
    });

    return created(customer);
  } catch (err) {
    return handleApiError(err);
  }
}
