# Portfolio Simulator — Frontend

## Related Projects
- **Backend:** `~/Desktop/Code/PortfolioSimulator/portfolio-simulator`
- API types are defined locally in `src/types/index.ts` and must stay in sync with backend models.

## Cross-Repo Rules
When making frontend changes, check the backend if any of the following are affected:

| Frontend change | Backend impact |
|---|---|
| Endpoint path changes in `src/hooks/useSimulator.ts` | Backend controller `SimulatorController.java` |
| Field added/removed/renamed in `SimulationRequest` type | `SimulationRequest.java`, `SimulatorService.java` |
| Field added/removed/renamed in `SimulationResponse` or `YearResult` type | `SimulationResponse.java`, `YearResult.java` |
| Field added/removed/renamed in `AllScenariosResponse` or `ScenarioSummary` type | `AllScenariosResponse.java`, `ScenarioSummary.java` |
| New asset class added to allocation inputs | Backend `SimulationRequest.java`, `SimulatorService.computeBlendedReturn()`, `HISTORICAL_DATA` |

## API Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/simulate/metadata` | GET | Year range + asset class list |
| `/api/simulate/defaults` | GET | Default allocation & parameters |
| `/api/simulate` | POST | Single scenario simulation |
| `/api/simulate/all` | POST | All 58 historical scenarios (1929–1986) |

## Architecture
- Vite + React + TypeScript
- API calls in `src/hooks/useSimulator.ts`
- Types in `src/types/index.ts`
- Dev proxy: Vite proxies `/api` → `http://localhost:8080` (see `vite.config.ts`)
