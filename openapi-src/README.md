# OpenAPI source

`../openapi.yaml` is **generated**. Do not edit it by hand: edit the files here and rebuild.

| File | Owns |
|---|---|
| `openapi.base.yaml` | `info`, `servers`, `tags`, security scheme, shared `Error` / `PaginationMeta` schemas and shared responses |
| `fragments/orders-create.yaml` | `POST /orders`, `POST /orders/create-and-ship`, `POST /brazil/orders` |
| `fragments/orders-read.yaml` | `GET /orders`, `GET /orders/with-fields`, order shipping labels, order NF-e endpoints, the `Order` schema |
| `fragments/orders-update.yaml` | `PUT`/`PATCH /orders/{id}`, hold, unhold, upload shipping documents, cancel, delete |
| `fragments/inventory.yaml` | `/inventory`, `/products`, `/lots*`, `/reports/inventory-transactions` |
| `fragments/replenishments.yaml` | `/replenishments*` |
| `fragments/returns.yaml` | `/returns*` |
| `fragments/stores-shipping.yaml` | `/auth/token`, `/stores`, `/store*`, `/shipping-methods*`, `/shipping-labels/{id}`, click and collect, `/carrier-services/pickup-locations` |
| `fragments/webhooks.yaml` | Outbound webhooks (`webhooks:` object) |

## Rebuild

```bash
cd openapi-src
npm ci
npm run build      # writes ../openapi.yaml
cd ..
mint validate && mint broken-links
```

The build fails on duplicate paths or schemas across fragments, dangling `$ref`s, and operations without an
explicit `security` key (use `security: []` for public endpoints).

## Rules

- Fragments contain only `paths`, `webhooks` and `components`. Schema names are unique across fragments.
- Every value comes from `platform` `origin/main`: routes, controllers (`param!`), serializers and request specs.
- Fake data only in examples. No internal class, worker, table or feature-flag names.
