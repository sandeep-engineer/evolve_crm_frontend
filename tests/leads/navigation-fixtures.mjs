const user = {
  id: "navigation-test-user", name: "Navigation Test", email: "navigation@example.invalid",
  phone: null, role: "BRANCH_ADMIN", organizationId: "test-org", branchId: "test-branch",
  staffId: null, status: "ACTIVE", createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

function lead(id) {
  return {
    id, branchId: user.branchId, branch: { id: user.branchId, name: "Test Branch" },
    organizationId: user.organizationId, fullName: `Navigation ${id}`, primaryPhone: null,
    alternatePhone: null, email: null, source: "WALK_IN", preferredChannel: null,
    currentIntent: "UNDECIDED", batchTypePref: null, preferredBatchId: null,
    stage: "NEW", status: "ACTIVE", assignedUser: null, currentSummary: null,
    lastContactedAt: null, nextFollowUpAt: null, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    dob: null, sourceDetails: null, preferredDays: [], preferredStartTime: null,
    preferredEndTime: null, lostReason: null, lostExplanation: null, archivedAt: null,
    lastVisitedAt: null, lostAt: null, reengagedAt: null, convertedAt: null,
    createdByUser: null, updatedByUser: null, archivedByUser: null, interests: [], goals: [],
  };
}

const collection = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

async function setup(context, origin, options = {}) {
  const requests = [];
  const currentUser = { ...user, ...options.user };
  await context.addInitScript((storedUser) => {
    if (!sessionStorage.getItem("navigation-test-initialized")) {
      localStorage.setItem("fitcrm.accessToken", "isolated-navigation-test");
      localStorage.setItem("fitcrm.user", JSON.stringify(storedUser));
      sessionStorage.setItem("navigation-test-initialized", "true");
    }
  }, currentUser);
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) {
      if (request.method() !== "GET") return route.abort();
      return route.continue();
    }
    const entry = { path: url.pathname, query: url.search, method: request.method() };
    requests.push(entry);
    // All API traffic is fulfilled locally, including simulated mutations.
    const override = await options.respond?.(entry);
    let body = override?.body;
    if (body === undefined) {
      if (url.pathname.endsWith("/auth/me")) body = currentUser;
      else if (url.pathname === "/branches") body = { ...collection, data: [{ id: user.branchId, name: "Test Branch", organizationId: user.organizationId, status: "ACTIVE" }] };
      else if (url.pathname === "/leads") body = { data: [lead("test-a"), lead("test-b")], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } };
      else if (/\/leads\/[^/]+$/.test(url.pathname)) body = lead(url.pathname.split("/").at(-1));
      else if (url.pathname.endsWith("/notifications/unread-count")) body = { unreadCount: 0 };
      else if (/\/(timeline|visits|contacts|follow-ups|lead-assignees|notifications|staff|branches)$/.test(url.pathname)) body = collection;
      else body = [];
    }
    if (options.delay && /\/(timeline|visits|contacts|follow-ups)$/.test(url.pathname)) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
    await route.fulfill({ status: override?.status ?? 200, json: body });
  });
  return requests;
}

export { setup, lead, collection };
