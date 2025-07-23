document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos do DOM ---
    const btnLancamento = document.getElementById('btnLancamento');
    const btnResumo = document.getElementById('btnResumo');
    const btnHistorico = document.getElementById('btnHistorico');

    const lancamentoSection = document.getElementById('lancamentoSection');
    const resumoSection = document.getElementById('resumoSection');
    const historicoSection = document.getElementById('historicoSection');

    const formLancamento = document.getElementById('formLancamento');
    const tipoSelect = document.getElementById('tipo');
    const categoriaSelect = document.getElementById('categoria');
    const descricaoInput = document.getElementById('descricao'); // Referência direta
    const valorInput = document.getElementById('valor');         // Referência direta
    const dataVencimentoInput = document.getElementById('dataVencimento'); // Referência direta
    const codigoBarrasInput = document.getElementById('codigoBarras'); // Referência ao novo campo

    const tabelaHistoricoBody = document.querySelector('#tabelaHistorico tbody');
    const resumoContainer = document.getElementById('resumoContainer');
    const mesFiltro = document.getElementById('mesFiltro');
    const btnFiltrarHistorico = document.getElementById('btnFiltrarHistorico');
    const btnPrintHistorico = document.getElementById('btnPrintHistorico');

    // Elementos do Modal de Edição
    const editModal = document.getElementById('editModal');
    const closeButton = editModal.querySelector('.close-button');
    const formEditLancamento = document.getElementById('formEditLancamento');
    const editId = document.getElementById('editId');
    const editTipo = document.getElementById('editTipo');
    const editCategoria = document.getElementById('editCategoria');
    const editDescricao = document.getElementById('editDescricao');
    const editValor = document.getElementById('editValor');
    const editDataVencimento = document.getElementById('editDataVencimento');
    const editStatus = document.getElementById('editStatus');

    // Elemento para o feedback do usuário (TOAST)
    const feedbackToast = document.getElementById('feedbackToast');

    // --- Armazenamento de Dados ---
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

    // --- Categorias Pré-definidas ---
    const categorias = {
        receita: ['Salário', 'Freelance', 'Vendas', 'Aluguel Recebido', 'Rendimento de Investimentos', 'Presente/Doação', 'Reembolso', 'Outras Receitas'],
        despesa: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde', 'Contas', 'Vestuário', 'Cuidados Pessoais', 'Outras Despesas'],
        investimento: ['Ações', 'Fundos de Investimento', 'Renda Fixa', 'Criptomoedas', 'Previdência Privada', 'Imóveis', 'Poupança', 'Outros Investimentos']
    };

    // --- Produtos Mock (para simular leitura de código de barras) ---
    const produtosMock = [
        { codigo: '7891234567890', nome: 'Pacote de Arroz 5kg', preco: 25.50, categoria: 'Alimentação', tipo: 'despesa' },
        { codigo: '9876543210987', nome: 'Livro "Dom Casmurro"', preco: 45.00, categoria: 'Educação', tipo: 'despesa' },
        { codigo: '1122334455667', nome: 'Serviço de Manutenção - PC', preco: 150.00, categoria: 'Outras Despesas', tipo: 'despesa' },
        { codigo: '2233445566778', nome: 'Camiseta Básica', preco: 39.90, categoria: 'Vestuário', tipo: 'despesa' },
        { codigo: '3344556677889', nome: 'Leite Integral 1L', preco: 5.20, categoria: 'Alimentação', tipo: 'despesa' },
        { codigo: '4455667788990', nome: 'Consulta Médica', preco: 200.00, categoria: 'Saúde', tipo: 'despesa' },
        { codigo: '5566778899001', nome: 'Mensalidade Academia', preco: 80.00, categoria: 'Lazer', tipo: 'despesa' },
        { codigo: '6677889900112', nome: 'Licença de Software', preco: 120.00, categoria: 'Educação', tipo: 'despesa' },
        { codigo: '7788990011223', nome: 'Rendimento CDB', preco: 75.00, categoria: 'Rendimento de Investimentos', tipo: 'receita' },
        { codigo: '8899001122334', nome: 'Devolução de Compra', preco: 55.00, categoria: 'Reembolso', tipo: 'receita' },
    ];


    // --- Funções Auxiliares ---

    /**
     * Gera um ID alfanumérico de 5 caracteres (letras maiúsculas e números).
     * @returns {string} O ID gerado.
     */
    function generateId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * Exibe uma seção específica do site e esconde as outras, com animação.
     * @param {HTMLElement} sectionToShow - A seção HTML a ser exibida.
     */
    function showSection(sectionToShow) {
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
        sectionToShow.classList.add('active');
    }

    /**
     * Exibe uma mensagem de feedback ao usuário usando um toast.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - Tipo de mensagem ('success', 'error', 'info', 'warning').
     */
    function showFeedback(message, type = 'info') {
        if (!feedbackToast) { // Fallback para alert se o toast não existir por algum motivo
            alert(message);
            return;
        }
        feedbackToast.textContent = message;
        feedbackToast.className = `toast show ${type}`; // Adiciona classes de tipo
        setTimeout(() => {
            feedbackToast.className = feedbackToast.className.replace("show", "");
        }, 3000); // Esconde após 3 segundos
    }

    /**
     * Carrega as categorias no select de categoria com base no tipo selecionado.
     * @param {HTMLSelectElement} selectElement - O elemento <select> onde as categorias serão carregadas.
     * @param {string} selectedType - O tipo de transação (receita, despesa, investimento).
     * @param {string} [selectedCategory=''] - A categoria pré-selecionada (útil para edição).
     */
    function loadCategories(selectElement, selectedType, selectedCategory = '') {
        selectElement.innerHTML = '<option value="">Selecione</option>'; // Limpa opções anteriores
        if (selectedType && categorias[selectedType]) {
            categorias[selectedType].forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                if (categoria === selectedCategory) {
                    option.selected = true; // Pré-seleciona a categoria
                }
                selectElement.appendChild(option);
            });
        }
    }

    // Evento para carregar categorias no formulário de Novo Lançamento
    tipoSelect.addEventListener('change', () => {
        loadCategories(categoriaSelect, tipoSelect.value);
    });

    // --- Lógica de Adição de Lançamento ---

    formLancamento.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        // Pega os valores usando as referências diretas
        const descricaoValue = descricaoInput.value.trim();
        const valorValue = parseFloat(valorInput.value);
        const dataVencimentoValue = dataVencimentoInput.value;

        // Validação de entrada
        if (!tipoSelect.value || !categoriaSelect.value || !descricaoValue || isNaN(valorValue) || valorValue <= 0 || !dataVencimentoValue) {
            showFeedback('Por favor, preencha todos os campos obrigatórios (Tipo, Categoria, Descrição, Valor > 0, Data de Vencimento).', 'warning');
            return;
        }

        const novoLancamento = {
            id: generateId(),
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            descricao: descricaoValue,
            valor: valorValue,
            dataVencimento: dataVencimentoValue,
            dataPagamento: null, // Novo lançamento sempre começa sem data de pagamento
            status: 'Pendente' // Novo lançamento sempre começa como pendente
        };

        lancamentos.push(novoLancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos)); // Salva no localStorage

        showFeedback('Lançamento adicionado com sucesso!', 'success');
        formLancamento.reset(); // Limpa o formulário
        categoriaSelect.innerHTML = '<option value="">Selecione o tipo primeiro</option>'; // Reseta a categoria do formulário

        // Atualiza as visualizações após adicionar um novo lançamento
        renderHistorico(mesFiltro.value); // Re-renderiza o histórico com o filtro atual
        renderResumo(); // Re-renderiza o resumo
    });

    // --- Lógica de Leitura de Código de Barras (Leitor USB emulando teclado) ---
    // Este código será executado se o campo 'codigoBarras' existir no HTML
    if (codigoBarrasInput) {
        codigoBarrasInput.addEventListener('keypress', (e) => {
            // Verifica se a tecla pressionada é 'Enter' (geralmente enviada por leitores de código de barras)
            if (e.key === 'Enter') {
                e.preventDefault(); // Impede o envio do formulário, se o campo estiver dentro de um form
                const codigoLido = codigoBarrasInput.value.trim();
                console.log('Código de barras lido:', codigoLido);

                if (codigoLido) {
                    const produtoEncontrado = produtosMock.find(p => p.codigo === codigoLido);

                    if (produtoEncontrado) {
                        // Preenche os campos do formulário de lançamento automaticamente
                        tipoSelect.value = produtoEncontrado.tipo;
                        // Força a atualização das categorias no select de categoria
                        loadCategories(categoriaSelect, produtoEncontrado.tipo, produtoEncontrado.categoria);
                        descricaoInput.value = produtoEncontrado.nome;
                        valorInput.value = produtoEncontrado.preco.toFixed(2); // Formata para 2 casas decimais

                        showFeedback(`Produto: "${produtoEncontrado.nome}" encontrado e campos preenchidos!`, 'info');
                    } else {
                        descricaoInput.value = `Item - Cód: ${codigoLido}`; // Preenche a descrição com o código
                        valorInput.value = ''; // Limpa o valor para o usuário preencher
                        showFeedback('Código de barras não encontrado em nossos registros. Por favor, preencha o restante dos dados.', 'warning');
                    }
                } else {
                    showFeedback('Nenhum código de barras lido.', 'warning');
                }

                codigoBarrasInput.value = ''; // Limpa o campo de código de barras para a próxima leitura
                descricaoInput.focus(); // Move o foco para a descrição para o usuário continuar o preenchimento
            }
        });
    }

    // --- Lógica de Renderização da Tabela de Histórico ---

    /**
     * Renderiza a tabela de histórico de lançamentos, aplicando filtro de mês.
     * Inclui atributos `data-label` para responsividade em mobile.
     * @param {string|null} filtroMes - Mês no formato 'YYYY-MM' para filtrar (ex: '2025-07'), ou null para todos.
     */
    function renderHistorico(filtroMes = null) {
        tabelaHistoricoBody.innerHTML = ''; // Limpa a tabela antes de renderizar

        let lancamentosFiltrados = lancamentos;
        if (filtroMes) {
            lancamentosFiltrados = lancamentos.filter(lanc => {
                // Adiciona 'T00:00:00' para garantir que a data seja interpretada como local e evitar problemas de fuso horário
                const dataVencimento = new Date(lanc.dataVencimento + 'T00:00:00');
                const [anoFiltro, mesFiltroNum] = filtroMes.split('-');
                return dataVencimento.getFullYear() === parseInt(anoFiltro) &&
                       (dataVencimento.getMonth() + 1) === parseInt(mesFiltroNum);
            });
        }

        // Ordena os lançamentos por data de vencimento (crescente), e depois por status (pendente primeiro)
        lancamentosFiltrados.sort((a, b) => {
            const dateA = new Date(a.dataVencimento);
            const dateB = new Date(b.dataVencimento);
            if (dateA.getTime() !== dateB.getTime()) { // Compara timestamps para datas
                return dateA - dateB;
            }
            // Se as datas são iguais, pendentes vêm antes dos pagos
            if (a.status === 'Pendente' && b.status === 'Pago') return -1;
            if (a.status === 'Pago' && b.status === 'Pendente') return 1;
            return 0; // Se tudo igual, mantém a ordem
        });

        if (lancamentosFiltrados.length === 0) {
            tabelaHistoricoBody.innerHTML = '<tr><td colspan="9">Nenhum lançamento encontrado para este período.</td></tr>';
            return;
        }

        lancamentosFiltrados.forEach(lanc => {
            const row = tabelaHistoricoBody.insertRow();
            row.dataset.id = lanc.id; // Armazena o ID no atributo dataset da linha

            const statusClass = lanc.status === 'Pago' ? 'status-pago' : 'status-pendente';
            const dataPagamentoFormatada = lanc.dataPagamento ? new Date(lanc.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

            row.innerHTML = `
                <td data-label="ID:">${lanc.id}</td>
                <td data-label="Tipo:">${lanc.tipo.charAt(0).toUpperCase() + lanc.tipo.slice(1)}</td>
                <td data-label="Categoria:">${lanc.categoria}</td>
                <td data-label="Descrição:">${lanc.descricao}</td>
                <td data-label="Valor:">${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td data-label="Vencimento:">${new Date(lanc.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td data-label="Pagamento:">${dataPagamentoFormatada}</td>
                <td data-label="Status:" class="${statusClass}">${lanc.status}</td>
                <td data-label="Ações:">
                    <button class="acao-btn editar" data-id="${lanc.id}">Editar</button>
                    <button class="acao-btn excluir" data-id="${lanc.id}">Excluir</button>
                    ${lanc.status === 'Pendente' ? `<button class="acao-btn baixar" data-id="${lanc.id}">Baixar</button>` : ''}
                </td>
            `;
        });
    }

    // --- Lógica de Renderização do Resumo Mensal ---

    /**
     * Renderiza o resumo financeiro para o mês atual, detalhando por categorias e investimentos.
     */
    function renderResumo() {
        resumoContainer.innerHTML = ''; // Limpa o container antes de renderizar
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth(); // 0-11 (Janeiro = 0)

        const lancamentosDoMes = lancamentos.filter(lanc => {
            const dataVencimento = new Date(lanc.dataVencimento + 'T00:00:00');
            return dataVencimento.getFullYear() === anoAtual && dataVencimento.getMonth() === mesAtual;
        });

        let totalReceitas = 0;
        let totalDespesas = 0;
        let totalInvestimentos = 0;

        lancamentosDoMes.forEach(lanc => {
            if (lanc.tipo === 'receita') {
                totalReceitas += lanc.valor;
            } else if (lanc.tipo === 'despesa') {
                totalDespesas += lanc.valor;
            } else if (lanc.tipo === 'investimento') {
                totalInvestimentos += lanc.valor;
            }
        });

        const saldoMensal = totalReceitas - totalDespesas;

        // HTML do resumo principal
        resumoContainer.innerHTML = `
            <h3>Mês de ${dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p><strong>Total de Receitas:</strong> ${totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Total de Despesas:</strong> ${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Total de Investimentos:</strong> ${totalInvestimentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Saldo Mensal:</strong> <span style="color: ${saldoMensal >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'};">${saldoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
            <hr>
            <h4>Despesas por Categoria (Registradas):</h4>
            <ul id="detalhesDespesas"></ul>
            <h4>Receitas por Categoria (Registradas):</h4>
            <ul id="detalhesReceitas"></ul>
            <h4>Investimentos Detalhados:</h4>
            <ul id="detalhesInvestimentos"></ul>
        `;

        const detalhesDespesas = document.getElementById('detalhesDespesas');
        const detalhesReceitas = document.getElementById('detalhesReceitas');
        const detalhesInvestimentos = document.getElementById('detalhesInvestimentos');

        // Agrupar despesas por categoria (considera todas as despesas do mês, pagas ou não)
        const despesasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'despesa').forEach(lanc => {
            despesasPorCategoria[lanc.categoria] = (despesasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(despesasPorCategoria).length === 0) {
            detalhesDespesas.innerHTML = '<li>Nenhuma despesa registrada neste mês.</li>';
        } else {
            // Ordena as categorias por valor (do maior para o menor)
            Object.entries(despesasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesDespesas.appendChild(li);
            });
        }

        // Agrupar receitas por categoria (considera todas as receitas do mês, recebidas ou não)
        const receitasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'receita').forEach(lanc => {
            receitasPorCategoria[lanc.categoria] = (receitasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(receitasPorCategoria).length === 0) {
            detalhesReceitas.innerHTML = '<li>Nenhuma receita registrada neste mês.</li>';
        } else {
            // Ordena as categorias por valor (do maior para o menor)
            Object.entries(receitasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesReceitas.appendChild(li);
            });
        }

        // Detalhar investimentos
        const investimentosDoMes = lancamentosDoMes.filter(l => l.tipo === 'investimento');
        if (investimentosDoMes.length === 0) {
            detalhesInvestimentos.innerHTML = '<li>Nenhum investimento registrado neste mês.</li>';
        } else {
            // Ordena os investimentos por valor (do maior para o menor)
            investimentosDoMes.sort((a, b) => b.valor - a.valor).forEach(lanc => {
                const li = document.createElement('li');
                li.textContent = `${lanc.categoria} - ${lanc.descricao}: ${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesInvestimentos.appendChild(li);
            });
        }
    }

    // --- Lógica de Ações da Tabela (Editar, Excluir, Baixar) ---

    // Delegação de eventos para os botões dentro da tabela de histórico
    tabelaHistoricoBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id; // Pega o ID do atributo data-id do botão

        if (!id) return; // Garante que o clique foi em um botão com ID

        if (target.classList.contains('editar')) {
            editLancamento(id);
        } else if (target.classList.contains('excluir')) {
            deleteLancamento(id);
        } else if (target.classList.contains('baixar')) {
            markAsPaid(id);
        }
    });

    /**
     * Preenche o modal de edição com os dados do lançamento e o exibe.
     * @param {string} id - O ID do lançamento a ser editado.
     */
    function editLancamento(id) {
        const lancamentoToEdit = lancamentos.find(lanc => lanc.id === id);
        if (!lancamentoToEdit) {
            showFeedback('Lançamento não encontrado para edição.', 'error');
            return;
        }

        // Preenche os campos do formulário no modal
        editId.value = lancamentoToEdit.id;
        editTipo.value = lancamentoToEdit.tipo; // Tipo é apenas para exibição, desabilitado no HTML
        loadCategories(editCategoria, lancamentoToEdit.tipo, lancamentoToEdit.categoria); // Carrega e pré-seleciona a categoria
        editDescricao.value = lancamentoToEdit.descricao;
        editValor.value = lancamentoToEdit.valor;
        editDataVencimento.value = lancamentoToEdit.dataVencimento;
        editStatus.value = lancamentoToEdit.status;

        editModal.style.display = 'flex'; // Torna o modal visível (display: flex)
    }

    /**
     * Salva as alterações de um lançamento editado do formulário do modal.
     * @param {Event} e - O evento de submit do formulário.
     */
    formEditLancamento.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        const id = editId.value;
        const lancamentoIndex = lancamentos.findIndex(lanc => lanc.id === id);

        if (lancamentoIndex === -1) {
            showFeedback('Erro: Lançamento não encontrado para atualização.', 'error');
            return;
        }

        const editDescricaoValue = editDescricao.value.trim();
        const editValorValue = parseFloat(editValor.value);
        const editDataVencimentoValue = editDataVencimento.value;

        // Validação de entrada do formulário de edição
        if (!editCategoria.value || !editDescricaoValue || isNaN(editValorValue) || editValorValue <= 0 || !editDataVencimentoValue) {
            showFeedback('Por favor, preencha todos os campos do formulário de edição corretamente.', 'warning');
            return;
        }

        // Armazena o status anterior para a lógica de dataPagamento
        const previousStatus = lancamentos[lancamentoIndex].status;

        // Atualiza os dados do lançamento no array
        lancamentos[lancamentoIndex].categoria = editCategoria.value;
        lancamentos[lancamentoIndex].descricao = editDescricaoValue;
        lancamentos[lancamentoIndex].valor = editValorValue;
        lancamentos[lancamentoIndex].dataVencimento = editDataVencimentoValue;
        lancamentos[lancamentoIndex].status = editStatus.value;

        // Lógica para dataPagamento:
        // Se o status for alterado para 'Pago' E a dataPagamento estiver nula, preenche com a data atual.
        if (lancamentos[lancamentoIndex].status === 'Pago' && !lancamentos[lancamentoIndex].dataPagamento) {
            lancamentos[lancamentoIndex].dataPagamento = new Date().toISOString().split('T')[0]; // Pega a data atual (YYYY-MM-DD)
        }
        // Se o status voltar para 'Pendente' E o status anterior era 'Pago', a data de pagamento deve ser resetada.
        else if (lancamentos[lancamentoIndex].status === 'Pendente' && previousStatus === 'Pago') {
            lancamentos[lancamentoIndex].dataPagamento = null;
        }

        localStorage.setItem('lancamentos', JSON.stringify(lancamentos)); // Salva no localStorage
        showFeedback('Lançamento atualizado com sucesso!', 'success');
        editModal.style.display = 'none'; // Esconde o modal

        // Re-renderiza as seções afetadas para refletir as mudanças
        renderHistorico(mesFiltro.value); // Re-renderiza o histórico com o filtro atual
        renderResumo(); // Re-renderiza o resumo
    });

    /**
     * Exclui um lançamento do array e do localStorage após confirmação.
     * @param {string} id - O ID do lançamento a ser excluído.
     */
    function deleteLancamento(id) {
        // Preferencialmente, substituir o `confirm` por um modal customizado para melhor UX em mobile
        if (confirm('Tem certeza que deseja excluir este lançamento? Esta ação é irreversível.')) {
            lancamentos = lancamentos.filter(lanc => lanc.id !== id); // Filtra o lançamento a ser excluído
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos)); // Salva o array atualizado
            showFeedback('Lançamento excluído com sucesso!', 'success');
            renderHistorico(mesFiltro.value); // Re-renderiza o histórico com o filtro atual
            renderResumo(); // Re-renderiza o resumo
        }
    }

    /**
     * Marca um lançamento como 'Pago' e registra a data de pagamento atual.
     * @param {string} id - O ID do lançamento a ser marcado como pago.
     */
    function markAsPaid(id) {
        const lancamentoToMark = lancamentos.find(lanc => lanc.id === id);
        if (lancamentoToMark && lancamentoToMark.status === 'Pendente') {
            lancamentoToMark.status = 'Pago';
            lancamentoToMark.dataPagamento = new Date().toISOString().split('T')[0]; // Pega a data atual (YYYY-MM-DD)
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            showFeedback('Lançamento baixado (pago) com sucesso!', 'success');
            renderHistorico(mesFiltro.value); // Re-renderiza o histórico com o filtro atual
            renderResumo(); // Re-renderiza o resumo
        } else if (lancamentoToMark && lancamentoToMark.status === 'Pago') {
            showFeedback('Este lançamento já está marcado como pago.', 'info');
        }
    }

    // --- Eventos de Navegação entre Seções ---

    btnLancamento.addEventListener('click', () => showSection(lancamentoSection));
    btnResumo.addEventListener('click', () => {
        showSection(resumoSection);
        renderResumo(); // Garante que o resumo esteja sempre atualizado ao ser acessado
    });
    btnHistorico.addEventListener('click', () => {
        showSection(historicoSection);
        // Define o mês atual como filtro padrão ao abrir o histórico ou recarregar
        const hoje = new Date();
        const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
        mesFiltro.value = mesAtualFormatado; // Preenche o campo de mês do filtro
        renderHistorico(mesAtualFormatado); // Renderiza com o mês atual
    });

    // --- Eventos de Filtro e Impressão do Histórico ---

    btnFiltrarHistorico.addEventListener('click', () => {
        renderHistorico(mesFiltro.value); // Filtra a tabela pelo mês selecionado
    });

    btnPrintHistorico.addEventListener('click', () => {
        // Clonar a tabela para remover colunas indesejadas na impressão e ajustar para responsividade
        const tabelaOriginal = document.getElementById('tabelaHistorico');
        const tabelaParaImprimir = tabelaOriginal.cloneNode(true); // Clone profundo de toda a tabela
        const headers = Array.from(tabelaParaImprimir.querySelectorAll('th'));
        const rows = Array.from(tabelaParaImprimir.querySelectorAll('tbody tr'));

        // Encontrar o índice da coluna "Ações" e remover
        let acoesIndex = -1;
        headers.forEach((th, index) => {
            if (th.textContent.trim() === 'Ações') {
                acoesIndex = index;
            }
        });

        if (acoesIndex !== -1) {
            headers[acoesIndex].remove(); // Remove o cabeçalho "Ações"
            rows.forEach(row => {
                if (row.cells[acoesIndex]) {
                    row.cells[acoesIndex].remove(); // Remove a célula "Ações" de cada linha
                }
            });
        }

        // Remover atributos data-label e estilos de responsividade mobile para impressão limpa
        // Itera sobre todos os elementos td, th, tr dentro da tabela clonada
        tabelaParaImprimir.querySelectorAll('td, th, tr').forEach(el => { // Agora itera sobre td, th, tr
            if (el.tagName === 'TD' && el.hasAttribute('data-label')) {
                el.removeAttribute('data-label');
            }
            // Remove estilos de display, position, etc. que foram adicionados para mobile
            el.style.cssText = ''; // Limpa todos os estilos inline para a impressão
            if (el.tagName === 'TD') {
                el.classList.add('no-pseudo'); // Adiciona uma classe para desativar o pseudoelemento via CSS
            }
        });

        // Específico para o thead, caso tenha sido escondido ou modificado para mobile
        if (tabelaParaImprimir.querySelector('thead')) {
            tabelaParaImprimir.querySelector('thead').style.display = ''; // Garante que thead esteja visível
        }


        // Abrir nova janela para impressão
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Planilha Financeira</title>');
        printWindow.document.write('<style>');
        // Adiciona estilos para a impressão
        printWindow.document.write(`
            @media print {
                /* Adiciona uma classe para garantir que o pseudoelemento não apareça na impressão */
                td.no-pseudo::before {
                    content: none !important;
                }
            }
            body { font-family: 'Lato', sans-serif; margin: 20px; color: #343A40; }
            h1 { color: #0A387E; font-family: 'Poppins', sans-serif; font-size: 2em;}
            p { color: #6C757D; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #0A387E; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-pago { color: #28a745; font-weight: bold; }
            .status-pendente { color: #dc3545; font-weight: bold; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>Planilha de Lançamentos Financeiros</h1>');
        if (mesFiltro.value) {
            const [ano, mes] = mesFiltro.value.split('-');
            const dataFiltro = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            printWindow.document.write(`<p><strong>Mês de Referência:</strong> ${dataFiltro.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>`);
        } else {
            printWindow.document.write('<p><strong>Período:</strong> Todos os Lançamentos</p>');
        }
        printWindow.document.write(tabelaParaImprimir.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    });

    // --- Eventos de Abertura/Fechamento do Modal ---
    closeButton.addEventListener('click', () => {
        editModal.style.display = 'none'; // Oculta o modal ao clicar no 'x'
    });

    // Fecha o modal se clicar na área escura fora do conteúdo dele
    window.addEventListener('click', (event) => {
        if (event.target === editModal) { // Verifica se o clique foi no fundo escurecido do modal
            editModal.style.display = 'none';
        }
    });

    // --- Inicialização da Aplicação ---
    // Define o mês atual no campo de filtro ao carregar a página
    const hoje = new Date();
    const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    mesFiltro.value = mesAtualFormatado;

    showSection(lancamentoSection); // Exibe a seção de "Novo Lançamento" por padrão
    renderHistorico(mesAtualFormatado); // Renderiza o histórico inicial com o filtro do mês atual
    renderResumo(); // Renderiza o resumo inicial
});