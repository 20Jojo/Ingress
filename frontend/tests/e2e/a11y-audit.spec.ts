import { expect, test, type Page } from "@playwright/test";

const AXE_SCRIPT_PATH = require.resolve("axe-core/axe.min.js");
const ROUTES = ["/", "/auth", "/ping", "/orgs"];

type AxeViolation = {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    failureSummary?: string;
  }>;
};

test.describe("A11y Audit", () => {
  for (const route of ROUTES) {
    test(`@a11y ${route} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const violations = await runAxeAudit(page);

      const summary = formatViolations(route, violations);
      expect(violations, summary).toHaveLength(0);
    });
  }
});

async function runAxeAudit(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: AXE_SCRIPT_PATH });

  return page.evaluate(async () => {
    const results = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
      resultTypes: ["violations"],
    });

    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failureSummary: n.failureSummary ?? undefined,
      })),
    }));
  });
}

function formatViolations(route: string, violations: AxeViolation[]): string {
  if (violations.length === 0) {
    return `[a11y] ${route}: no violations`;
  }

  const lines = [`[a11y] ${route}: ${violations.length} violation(s)`];
  for (const violation of violations) {
    lines.push(
      `- ${violation.id} (${violation.impact ?? "none"}): ${violation.help} [${violation.helpUrl}]`,
    );
    for (const node of violation.nodes) {
      lines.push(`  target: ${node.target.join(" | ")}`);
      if (node.failureSummary) {
        lines.push(`  reason: ${node.failureSummary.replace(/\n/g, " ").trim()}`);
      }
    }
  }

  return lines.join("\n");
}

declare global {
  interface Window {
    axe: {
      run: (
        context?: unknown,
        options?: unknown,
      ) => Promise<{
        violations: Array<{
          id: string;
          impact?: string;
          description: string;
          help: string;
          helpUrl: string;
          nodes: Array<{ target: string[]; failureSummary?: string }>;
        }>;
      }>;
    };
  }
}

