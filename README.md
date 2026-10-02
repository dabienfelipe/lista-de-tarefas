# Lista de tarefas

Aplicação web simples para organizar tarefas por projeto, prioridade e vencimento.

**Demonstração:** https://thriving-basbousa-b12b5b.netlify.app

> **Status:** protótipo em evolução. A interface é responsiva para celulares e pode ser adicionada à tela inicial como PWA, mas ainda não está publicada na Google Play ou na App Store.

## Atualização mobile

A versão atual foi otimizada para telas de celular e tablet. O site pode ser instalado diretamente pelo navegador para acesso pela tela inicial:

- **Android:** abra a demonstração no Chrome, toque no menu **⋮** e escolha **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone/iPad:** abra a demonstração no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

É necessário abrir o site com internet pelo menos uma vez. Depois, a interface também pode carregar offline.

## Funcionalidades

- Criar, editar, concluir e remover tarefas
- Definir projeto, prioridade e data de vencimento
- Reordenar tarefas arrastando e soltando
- Filtrar tarefas ativas e concluídas
- Alternar entre tema claro e escuro
- Salvar tarefas no armazenamento local do navegador
- Exibir alertas visuais próximos ao vencimento
- Instalar como aplicativo (PWA) em celulares compatíveis
- Abrir a interface offline depois do primeiro carregamento
- Interface responsiva otimizada para celulares e tablets

## Como executar

Abra `index.html` em um navegador. Não é necessário instalar dependências ou executar um processo de build.

## Armazenamento

As tarefas ficam salvas localmente no navegador em que foram criadas. Elas não são sincronizadas entre dispositivos ou usuários. Este projeto é um protótipo, não um serviço de armazenamento compartilhado.

## Tecnologias

- HTML
- CSS
- JavaScript
