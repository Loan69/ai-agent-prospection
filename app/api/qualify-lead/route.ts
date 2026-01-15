import { NextResponse } from "next/server";
import { qualifyLead } from "@/agent/qualification/qualify";
import { insertLead } from "@/lib/repositories/leads.repo";

export async function POST(req: Request) {
  const leadInput = await req.json();

  const qualification = await qualifyLead(leadInput);

  const lead = await insertLead({
    ...leadInput,
    score: qualification.score,
    verdict: qualification.verdict,
    segment: qualification.segment,
    justification: qualification.justification,
    status: qualification.verdict === "CONTACTER" ? "qualified" : "archived"
  });

  return NextResponse.json(lead);
}
