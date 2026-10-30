// Retired public booking endpoint. No upstream booking service is contacted.
export function createConsultationSlotsProxy() {
  return async function consultationSlotsProxy(request: Request) {
    return Response.json({ ok: false, code: "BOOKING_RETIRED" }, {
      status: request.method === "GET" ? 410 : 405,
      headers: { "Cache-Control": "no-store", ...(request.method === "GET" ? {} : { Allow: "GET" }) },
    });
  };
}
export default { fetch: createConsultationSlotsProxy() };
