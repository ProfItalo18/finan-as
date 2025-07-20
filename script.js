// script.js

document.addEventListener('DOMContentLoaded', () => {
    const formLancamento = document.getElementById('form-lancamento');
    const tabelaLancamentosBody = document.querySelector('#tabela-lancamentos tbody');
    const totalReceitasSpan = document.getElementById('total-receitas');
    const totalDespesasSpan = document.getElementById('total-despesas');
    const totalInvestimentosSpan = document.getElementById('total-investimentos');
    const saldoTotalSpan = document.getElementById('saldo-total');
    const selecionarMesSelect = document.getElementById('selecionar-mes');
    const btnImprimir = document.getElementById('btn-imprimir');

    // Novo elemento: saldo no cabeçalho
    const saldoHeaderSpan = document.getElementById('saldo-header');

    // Elementos dos botões de navegação
    const btnNovoLancamento = document.getElementById('btn-novo-lancamento');
    const btnResumoMensal = document.getElementById('btn-resumo-mensal');
    const btnPlanilha = document.getElementById('btn-planilha');

    // Elementos das seções de conteúdo
    const contentNovoLancamento = document.getElementById('content-novo-lancamento');
    const contentResumoMensal = document.getElementById('content-resumo-mensal');
    const contentPlanilha = document.getElementById('content-planilha');

    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

    // Função para calcular e atualizar o saldo geral (sem filtro de mês)
    function atualizarSaldoGeral() {
        let totalReceitaGeral = 0;
        let totalDespesaGeral = 0;

        lancamentos.forEach(lancamento => {
            if (lancamento.tipo === 'receita') {
                totalReceitaGeral += lancamento.valor;
            } else if (lancamento.tipo === 'despesa') {
                totalDespesaGeral += lancamento.valor;
            }
        });

        const saldoGeral = totalReceitaGeral - totalDespesaGeral;
        saldoHeaderSpan.textContent = `R$ ${saldoGeral.toFixed(2)}`;
        // Opcional: mudar cor se o saldo for negativo
        if (saldoGeral < 0) {
            saldoHeaderSpan.style.color = 'var(--danger-color)'; // Vermelho
        } else {
            saldoHeaderSpan.style.color = 'var(--primary-color)'; // Verde
        }
    }


    // Função para mostrar a seção correta e ativar o botão correspondente
    function showSection(sectionToShow) {
        // Oculta todas as seções de conteúdo
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        // Remove a classe 'active' de todos os botões de navegação
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });

        // Mostra a seção desejada
        sectionToShow.classList.add('active');

        // Ativa o botão correspondente
        if (sectionToShow === contentNovoLancamento) {
            btnNovoLancamento.classList.add('active');
        } else if (sectionToShow === contentResumoMensal) {
            btnResumoMensal.classList.add('active');
        } else if (sectionToShow === contentPlanilha) {
            btnPlanilha.classList.add('active');
        }

        // Se a planilha ou resumo for mostrado, renderiza novamente para garantir os dados atualizados
        if (sectionToShow === contentPlanilha || sectionToShow === contentResumoMensal) {
            renderizarLancamentos(obterMesSelecionado());
        }
    }

    // Adicionar listeners para os botões de navegação
    btnNovoLancamento.addEventListener('click', () => showSection(contentNovoLancamento));
    btnResumoMensal.addEventListener('click', () => showSection(contentResumoMensal));
    btnPlanilha.addEventListener('click', () => showSection(contentPlanilha));

    // Função para renderizar os lançamentos na tabela (e o resumo mensal)
    function renderizarLancamentos(filtroMes = null) {
        tabelaLancamentosBody.innerHTML = '';
        let receitasTotal = 0;
        let despesasTotal = 0;
        let investimentosTotal = 0;

        const lancamentosFiltrados = filtroMes
            ? lancamentos.filter(lancamento => {
                const dataLancamento = new Date(lancamento.data + 'T00:00:00');
                return dataLancamento.getFullYear() === filtroMes.getFullYear() &&
                       dataLancamento.getMonth() === filtroMes.getMonth();
            })
            : lancamentos;

        lancamentosFiltrados.forEach((lancamento, index) => {
            const newRow = tabelaLancamentosBody.insertRow();
            newRow.innerHTML = `
                <td>${lancamento.data}</td>
                <td>${lancamento.descricao}</td>
                <td>R$ ${lancamento.valor.toFixed(2)}</td>
                <td class="${lancamento.tipo}">${lancamento.tipo}</td>
                <td>${lancamento.categoria}</td>
                <td>
                    <button class="acao-btn editar" data-index="${index}">Editar</button>
                    <button class="acao-btn excluir" data-index="${index}">Excluir</button>
                </td>
            `;

            if (lancamento.tipo === 'receita') {
                receitasTotal += lancamento.valor;
            } else if (lancamento.tipo === 'despesa') {
                despesasTotal += lancamento.valor;
            } else if (lancamento.tipo === 'investimento') {
                investimentosTotal += lancamento.valor;
            }
        });

        // Atualizar resumo mensal
        totalReceitasSpan.textContent = receitasTotal.toFixed(2);
        totalDespesasSpan.textContent = despesasTotal.toFixed(2);
        totalInvestimentosSpan.textContent = investimentosTotal.toFixed(2);
        saldoTotalSpan.textContent = (receitasTotal - despesasTotal).toFixed(2);

        // Adicionar listeners para botões de editar e excluir
        document.querySelectorAll('.acao-btn.editar').forEach(button => {
            // Usa o 'find' para obter o índice correto no array original, se for filtrado
            button.onclick = (e) => {
                const originalIndex = lancamentos.findIndex(l => 
                    l.data === lancamentosFiltrados[e.target.dataset.index].data &&
                    l.descricao === lancamentosFiltrados[e.target.dataset.index].descricao &&
                    l.valor === lancamentosFiltrados[e.target.dataset.index].valor
                );
                if (originalIndex !== -1) editarLancamento(originalIndex);
            };
        });
        document.querySelectorAll('.acao-btn.excluir').forEach(button => {
            button.onclick = (e) => {
                const originalIndex = lancamentos.findIndex(l => 
                    l.data === lancamentosFiltrados[e.target.dataset.index].data &&
                    l.descricao === lancamentosFiltrados[e.target.dataset.index].descricao &&
                    l.valor === lancamentosFiltrados[e.target.dataset.index].valor
                );
                if (originalIndex !== -1) excluirLancamento(originalIndex);
            };
        });
    }

    // Função para adicionar um novo lançamento
    formLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const tipo = document.getElementById('tipo').value;
        const categoria = document.getElementById('categoria').value;

        const novoLancamento = { data, descricao, valor, tipo, categoria };
        lancamentos.push(novoLancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
        formLancamento.reset();
        renderizarLancamentos(obterMesSelecionado());
        popularMesesDisponiveis();
        atualizarSaldoGeral(); // Atualiza o saldo no cabeçalho
    });

    // Função para editar um lançamento
    function editarLancamento(index) {
        let lancamento = lancamentos[index];

        const novaData = prompt('Nova Data (AAAA-MM-DD):', lancamento.data);
        if (novaData === null) return;

        const novaDescricao = prompt('Nova Descrição:', lancamento.descricao);
        if (novaDescricao === null) return;

        let novoValor = prompt('Novo Valor:', lancamento.valor);
        if (novoValor === null) return;
        novoValor = parseFloat(novoValor);
        if (isNaN(novoValor)) {
            alert('Valor inválido. Por favor, insira um número.');
            return;
        }

        const novoTipo = prompt('Novo Tipo (receita, despesa, investimento):', lancamento.tipo);
        if (novoTipo === null || !['receita', 'despesa', 'investimento'].includes(novoTipo.toLowerCase())) {
            alert('Tipo inválido. Por favor, insira "receita", "despesa" ou "investimento".');
            return;
        }

        const novaCategoria = prompt('Nova Categoria:', lancamento.categoria);
        if (novaCategoria === null) return;


        lancamentos[index] = {
            data: novaData,
            descricao: novaDescricao,
            valor: novoValor,
            tipo: novoTipo.toLowerCase(),
            categoria: novaCategoria
        };
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
        renderizarLancamentos(obterMesSelecionado());
        popularMesesDisponiveis();
        atualizarSaldoGeral(); // Atualiza o saldo no cabeçalho
    }

    // Função para excluir um lançamento
    function excluirLancamento(index) {
        if (confirm('Tem certeza que deseja excluir este lançamento?')) {
            lancamentos.splice(index, 1);
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            renderizarLancamentos(obterMesSelecionado());
            popularMesesDisponiveis();
            atualizarSaldoGeral(); // Atualiza o saldo no cabeçalho
        }
    }

    // Função para popular o seletor de meses
    function popularMesesDisponiveis() {
        selecionarMesSelect.innerHTML = '<option value="">Todos os Meses</option>';
        const meses = new Set();
        lancamentos.forEach(lancamento => {
            const data = new Date(lancamento.data + 'T00:00:00');
            meses.add(`${data.getFullYear()}-${data.getMonth() + 1}`);
        });

        Array.from(meses).sort((a, b) => {
            const [anoA, mesA] = a.split('-').map(Number);
            const [anoB, mesB] = b.split('-').map(Number);
            if (anoA !== anoB) return anoA - anoB;
            return mesA - mesB;
        }).forEach(mesAno => {
            const [ano, mes] = mesAno.split('-');
            const dataReferencia = new Date(ano, mes - 1, 1);
            const nomeMes = dataReferencia.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            const option = document.createElement('option');
            option.value = mesAno;
            option.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
            selecionarMesSelect.appendChild(option);
        });
    }

    // Função para obter o mês selecionado no filtro
    function obterMesSelecionado() {
        const valorSelecionado = selecionarMesSelect.value;
        if (valorSelecionado) {
            const [ano, mes] = valorSelecionado.split('-').map(Number);
            return new Date(ano, mes - 1, 1);
        }
        return null;
    }

    // Listener para o filtro de mês
    selecionarMesSelect.addEventListener('change', () => {
        renderizarLancamentos(obterMesSelecionado());
    });

    // Funcionalidade de impressão
    btnImprimir.addEventListener('click', () => {
        const printContents = document.getElementById('planilha-dinamica').outerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        location.reload();
    });

    // Inicializar a aplicação: mostra a seção de "Novo Lançamento" por padrão e atualiza o saldo geral
    popularMesesDisponiveis();
    showSection(contentNovoLancamento);
    atualizarSaldoGeral(); // Chamada inicial para mostrar o saldo
});