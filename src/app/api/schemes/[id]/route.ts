import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound, handleApiError } from "@/lib/api-response";
import { updateSchemeSchema } from "@/lib/validation/scheme";
import { parseBigIntParam, InvalidIdError } from "@/lib/params";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const scheme = await prisma.scheme.findFirst({ where: { id, isDeleted: false } });
    if (!scheme) return notFound("Scheme not found.");
    return ok(scheme);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }
    const input = updateSchemeSchema.parse(body);

    const existing = await prisma.scheme.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Scheme not found.");

    const scheme = await prisma.scheme.update({
      where: { id },
      data: { ...input, lastModifiedDate: new Date() },
    });

    return ok(scheme);
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseBigIntParam(params.id);
    const existing = await prisma.scheme.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return notFound("Scheme not found.");

    await prisma.scheme.update({
      where: { id },
      data: { isDeleted: true, lastModifiedDate: new Date() },
    });

    return ok({ id: id.toString(), deleted: true });
  } catch (err) {
    if (err instanceof InvalidIdError) return badRequest(err.message);
    return handleApiError(err);
  }
}
