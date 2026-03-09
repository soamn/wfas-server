[![GitHub](https://custom-icon-badges.demolab.com/badge/WFAS-blue?logo=wfas&style=for-the-badge)](https://github.com/soamn/wfas)
[![GitHub](https://custom-icon-badges.demolab.com/badge/WFAS-Engine-blue?logo=wfas-engine&style=for-the-badge)](https://github.com/soamn/wfas-engine)
[![GitHub](https://custom-icon-badges.demolab.com/badge/WFAS-UI-blue?logo=wfas-ui&style=for-the-badge)](https://github.com/soamn/wfas-ui)
![GitHub License](https://img.shields.io/github/license/soamn/wfas-server?style=for-the-badge&labelColor=yellow&link=https%3A%2F%2Fgithub.com%2Fsoamn%2Fwfas-engine%3Ftab%3DGPL-3.0-1-ov-file)
![GitHub Tag](https://img.shields.io/github/v/tag/soamn/wfas-server)
![GitHub Repo stars](https://img.shields.io/github/stars/soamn/wfas-server)

# WFAS Server

### Workflow Automation System Server

WFAS Server is application server for WFAS, Handles, Authentication, Validation, workflow validation, workflow cycle check, handles wfas-ui requests, handles user sessions, interacts with wfas-engine for execution and syncing, updates wfas-ui with workflow data, Interacts with providers to setup webhooks and encrypts data and safely sends data to wfas-engine.

---

## ⚙️ Server Overview

```mermaid
flowchart LR
    Ui[WFAS Ui]

    subgraph Cloud [docker]
        Server[WFAS Server]
    end

    Ui -- validation --> Server
    Server<-->DB[(Postgres)]
    Server <-->Engine[WFAS-engine]

    %% Grouped styling
    style Cloud rx:15,ry:15,fill:#18181B,stroke:#34d399,stroke-width:2px,color:#fff
    style Engine rx:15,ry:15,fill:#18181B,stroke:#005c81,stroke-width:4px,color:#fff
    style DB rx:15,ry:15,fill:#18181B,stroke:#005c81,stroke-width:4px,color:#fff

    classDef wfasStyle rx:15,ry:15,fill:#18181B,stroke:#fff,color:#fff
    class Ui,Server wfasStyle

```
---

## Local Setup

To Run You would need wfas-engine and wfas-ui setup as well and docker installed.

```
cp .env.example .env

docker build -t wfas-server .

docker run --network="host" --env-file .env wfas-server

```
