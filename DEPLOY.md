# Guia de Deploy (Scheasy v2.0)

Este projeto foi totalmente empacotado utilizando **Docker**, o que garante que ele rodará em qualquer infraestrutura de nuvem moderna (AWS, DigitalOcean, Render, Fly.io, VPS customizadas) sem os problemas de "funciona na minha máquina".

## Arquitetura de Contêineres
O projeto utiliza o `docker-compose.yml` na raiz, orquestrando 3 serviços independentes:
1. **postgres**: Banco de Dados PostgreSQL oficial.
2. **backend**: Aplicação Node.js executando Prisma e Express na porta 3001. A inicialização do contêiner já roda as migrations (`db push`).
3. **frontend**: Build estático do React servido através de um servidor ultrarrápido **Nginx** na porta 80.

## Como testar localmente (Sem precisar ter o Node instalado)
Se você tiver o Docker Desktop instalado, basta rodar na raiz do projeto:
```bash
docker-compose up --build
```
- Acesse o sistema: `http://localhost`
- Acesse a API: `http://localhost:3001`

## Deploy em VPS (DigitalOcean, AWS EC2, Linode, Hetzner)
A forma mais econômica de rodar o projeto no ar é alugar uma VPS simples.
1. Instale o Docker e o Git na sua VPS.
2. Faça o clone do repositório: `git clone https://github.com/SrPicolino/Scheasy.git`
3. Entre na pasta e altere o IP público no `docker-compose.yml`. Substitua a variável de ambiente de build no Frontend de `http://localhost:3001/api` para `http://SEU_IP:3001/api` (ou use o seu domínio).
4. Suba os containers em background: `docker-compose up -d --build`

Seu sistema de agendamento estará no ar imediatamente e protegido contra quedas, pois o Docker Compose cuida de reiniciar automaticamente os containers em caso de falha (`restart: unless-stopped`).
