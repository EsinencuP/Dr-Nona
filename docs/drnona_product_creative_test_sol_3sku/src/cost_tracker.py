from __future__ import annotations

from dataclasses import dataclass


@dataclass
class BudgetGuard:
    max_products: int
    max_api_requests: int
    max_candidates_per_asset: int
    api_requests: int = 0
    estimated_cost: float = 0.0

    def reserve(self, count: int = 1, estimated_cost: float = 0.0) -> None:
        if self.api_requests + count > self.max_api_requests:
            raise RuntimeError(
                f"API request budget exceeded: {self.api_requests + count} > {self.max_api_requests}"
            )
        self.api_requests += count
        self.estimated_cost += estimated_cost
