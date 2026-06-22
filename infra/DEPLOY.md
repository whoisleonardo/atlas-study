# Atlas — Deploy

Como o Atlas vai do repositório ao ar, de graça, na Oracle Cloud (Always Free).

## Visão geral

```
git push (main)
   │
   ▼
GitHub Actions
   ├─ build do .jar (runner x86, rápido)
   ├─ build da imagem linux/amd64
   ├─ push → GHCR (ghcr.io/whoisleonardo/atlas-study)
   └─ SSH na VM → docker compose pull && up -d
                          │
                          ▼
            VM Oracle E2.1.Micro (x86, Always Free, 1 GB)
                 ┌───────────────────────────────┐
                 │  Caddy (HTTPS) → app : 8080     │
                 │  app (Spring)  → H2 (arquivo)   │
                 │                  + volume        │
                 └───────────────────────────────┘
```

A VM é provisionada por **Terraform**. Nela, um **Docker Compose** roda `app` + `caddy`. O app guarda os dados num **H2 em arquivo** (volume), sem Postgres — cabe folgado em 1 GB de RAM. O Caddy emite e renova o HTTPS sozinho.

> **Por que x86/H2?** O A1 ARM (4 OCPU/24 GB) é mais potente, mas em São Paulo a capacidade Always Free quase nunca libera ("Out of host capacity"). A E2.1.Micro x86 sempre tem capacidade; com 1 GB, trocar Postgres por H2 em arquivo deixa o stack leve e estável para uso pessoal.

## Estrutura do repositório

```
atlas-study/
├── estudos-app/               # Expo (React Native)
├── estudos-api/               # Spring Boot
│   ├── Dockerfile             # build local (multi-stage)
│   └── Dockerfile.runtime     # imagem do CI (copia o jar pronto)
├── deploy/                    # copiados para ~/atlas na VM
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── .env.example
├── infra/                     # Terraform (provisiona a VM)
└── .github/workflows/deploy.yml
```

## Pré-requisitos

- Conta Oracle Cloud (Always Free) — cartão só para verificação, não cobra.
- Terraform >= 1.5 instalado.
- Uma chave SSH (`ssh-keygen -t ed25519`).
- Um domínio apontável (ou usar `sslip.io`, sem domínio).

---

## 1. Provisionar a VM com Terraform

### 1.1 Credenciais da OCI

No console: ícone do perfil → **My profile** → **API keys** → **Add API key** → **Generate API key pair** → baixe a chave privada para `~/.oci/oci_api_key.pem`. Ao confirmar, a Oracle mostra um *Configuration file preview* com `tenancy`, `user`, `fingerprint` e `region` — copie esses valores.

### 1.2 Variáveis

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# preencha tenancy_ocid, user_ocid, fingerprint, private_key_path, region.
# compartment_ocid = tenancy_ocid (compartimento raiz).
```

### 1.3 Aplicar

```bash
terraform init
terraform plan
terraform apply
terraform output public_ip
```

Se aparecer **"Out of capacity"** no A1, rode `terraform apply` de novo — a rede já fica criada e ele só retenta a instância.

Depois que a VM sobe, o **cloud-init** leva 1–2 min instalando o Docker, abrindo as portas 80/443 no firewall do SO e criando `~/atlas`. Então `ssh ubuntu@<public_ip>` já entra numa máquina pronta.

---

## 2. Preparar a VM

Copie os arquivos de deploy e configure o domínio:

```bash
# do seu computador, na raiz do repo:
scp deploy/docker-compose.yml deploy/Caddyfile deploy/.env.example ubuntu@<public_ip>:~/atlas/

# na VM:
ssh ubuntu@<public_ip>
cd ~/atlas
cp .env.example .env
# edite o DOMAIN no .env (ou use atlas.<public_ip>.sslip.io)
```

DNS: aponte um registro **A** do seu domínio para o `public_ip`. (Com `sslip.io` não precisa de DNS — o IP já está no nome.)

---

## 3. GitHub Actions

### 3.1 Secrets

Em *Settings → Secrets and variables → Actions*:

| Secret       | Valor                                                        |
|--------------|-------------------------------------------------------------|
| `VM_HOST`    | IP público (ou domínio) da VM                               |
| `VM_USER`    | `ubuntu`                                                     |
| `VM_SSH_KEY` | sua chave SSH **privada** (a pública já foi injetada na VM) |

`GITHUB_TOKEN` é automático e é o que publica no GHCR.

### 3.2 Tornar a imagem GHCR pública

A VM precisa baixar a imagem. O caminho mais simples: depois do **primeiro** build bem-sucedido (que cria o pacote), vá em *seu perfil → Packages → atlas-study → Package settings → Change visibility → Public*. Assim o `docker compose pull` na VM roda sem login.

> Na primeiríssima execução, o pacote nasce privado e o passo de deploy pode falhar no `pull`. Torne público e rode o workflow de novo. (Alternativa: criar um PAT `read:packages` e fazer `docker login ghcr.io` na VM uma vez.)

### 3.3 Como o pipeline funciona

O `.jar` é compilado no runner x86 (nativo, rápido) e **copiado** para a imagem `amd64` via `estudos-api/Dockerfile.runtime`. A imagem vai pro GHCR, e o passo de SSH faz `docker compose pull && up -d` na VM.

---

## 4. Deploy

```bash
git push origin main
```

O workflow builda, publica a imagem e atualiza a VM. Verifique:

```bash
curl https://SEU-DOMINIO/api/topicos        # deve responder a lista (vazia no início)
```

Carregar os dados de exemplo:

```bash
curl -F "file=@estudo.csv" https://SEU-DOMINIO/api/import
# {"itensCriados":24,"cursosCriados":1,"topicos":["Guitarra"]}
```

---

## Operação (dia a dia)

Na VM, em `~/atlas`:

```bash
docker compose logs -f app      # logs ao vivo
docker compose restart app      # reinicia só o app
docker compose ps               # status dos containers
```

Atualizar é só dar `git push`. Para conseguir voltar versões, troque a tag `:latest` por `:${{ github.sha }}` no workflow e no compose — aí cada deploy tem uma imagem identificável.

---

## Pontos de atenção (resumo)

- **Arquitetura:** a imagem é `linux/amd64` (E2.1.Micro é x86). O workflow já builda assim.
- **RAM (1 GB):** o `cloud-init` cria 2 GB de swap e o app roda com `-Xmx384m`. Evite adicionar serviços pesados na mesma VM.
- **Dados em H2 arquivo:** ficam no volume `h2data` (`/data/atlas.mv.db` no container). Backup = copiar esse arquivo. Migrar pra Postgres depois é possível se um dia trocar de VM.
- **Dois firewalls:** Security List na nuvem (Terraform) **e** iptables no SO (cloud-init) — ambos já automatizados aqui.
- **Segurança:** nunca comite `terraform.tfvars`, `*.pem`, `*.tfstate` nem `.env` (já no `.gitignore`). O state guarda dados sensíveis em texto.
