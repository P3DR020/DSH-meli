# Dashboard PS - Operacao Logistica SBA9

## Inicializacao rapida

No Windows, execute apenas este comando na raiz do projeto:

```powershell
.\iniciar.cmd
```

O comando inicia o backend e o frontend juntos. Mantenha a janela aberta durante a apresentacao e pressione `Ctrl+C` para encerrar.

MVP funcional de um painel de produtividade operacional para apresentacao em TV.

## O que existe nesta versao

- frontend React/Vite em formato 16:9 para TV;
- backend FastAPI com contrato JSON estavel;
- leitura de cinco cenarios CSV locais em rotacao automatica;
- calculos de progresso, restante, ritmo e previsao de termino;
- consolidacao de equipes e sessoes operacionais;
- alerta automatico quando os dados ficam defasados;
- atualizacao do painel a cada 10 segundos.

## Demonstracao automatica

Os arquivos `backend/data/demo/snapshot_01.csv` ate `snapshot_05.csv` representam cinco momentos do turno T3, das 23:05 as 07:55. O backend troca de cenario automaticamente a cada 10 segundos e reinicia o ciclo depois do quinto arquivo.

Os CSVs podem ser abertos e alterados no Excel. Mantenha os nomes das colunas e dos arquivos para preservar o funcionamento da demonstracao.

## Arquitetura

```text
CSV -> CsvDashboardSource -> BusinessEngine -> FastAPI -> React/TV
```

A interface `DashboardSource` isola a origem dos dados. Para trocar o CSV por uma API corporativa, implemente outro adaptador e selecione-o em `backend/app/config.py`; as regras e o frontend permanecem iguais.

## Executar

### Backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: `http://127.0.0.1:8000/api/v1/dashboard/turno-atual`

Documentacao interativa: `http://127.0.0.1:8000/docs`

### Frontend

```powershell
cd frontend
pnpm dev --host 127.0.0.1
```

Painel: `http://127.0.0.1:5173`

## Dados do piloto

Edite `backend/data/export_turno.csv`. Cada linha representa uma equipe ou sessao operacional. As colunas globais se repetem para manter o piloto em um unico arquivo exportavel.

Os valores sao demonstrativos e foram ajustados para consistencia matematica: a soma das equipes coincide com o total processado.

## Testes

```powershell
..\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
cd frontend
pnpm build
```

## Publicacao gratuita

O backend esta preparado para o Render por meio do arquivo `render.yaml`. O frontend esta preparado para a Vercel pelo arquivo `vercel.json`.

Depois de publicar a API no Render, configure na Vercel a variavel de ambiente abaixo usando a URL publica do servico:

```text
VITE_API_URL=https://SEU-SERVICO.onrender.com/api/v1/dashboard/turno-atual
```

O plano gratuito do Render pode suspender a API quando ela fica sem uso. A primeira abertura depois desse periodo pode levar alguns segundos.

## Creditos

Idealizacao: Pedro Henrique Santos de Jesus e Jhonata dos Santos Moura (Rep 1 / SBA9).
