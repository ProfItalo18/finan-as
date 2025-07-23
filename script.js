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
    const feedbackToast = document.getElementById('feedbackToast'); // NOVO ELEMENTO!

    // --- Armazenamento de Dados ---
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

    // --- Categorias Pré-definidas ---
    const categorias = {
        receita: ['Salário', 'Freelance', 'Vendas', 'Aluguel Recebido', 'Rendimento de Investimentos', 'Presente/Doação', 'Reembolso', 'Outras Receitas'],
        despesa: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde', 'Contas', 'Vestuário', 'Cuidados Pessoais', 'Outras Despesas'],
        investimento: ['Ações', 'Fundos de Investimento', 'Renda Fixa', 'Criptomoedas', 'Previdência Privada', 'Imóveis', 'Poupança', 'Outros Investimentos']
    };

    // --- Funções Auxiliares ---

    function generateId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

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
        if (!feedbackToast) { // Fallback para alert se o toast não existir
            alert(message);
            return;
        }
        feedbackToast.textContent = message;
        feedbackToast.className = `toast show ${type}`;
        setTimeout(() => {
            feedbackToast.className = feedbackToast.className.replace("show", "");
        }, 3000); // Toast visível por 3 segundos
    }

    function loadCategories(selectElement, selectedType, selectedCategory = '') {
        selectElement.innerHTML = '<option value="">Selecione</option>';
        if (selectedType && categorias[selectedType]) {
            categorias[selectedType].forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                if (categoria === selectedCategory) {
                    option.selected = true;
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
        e.preventDefault();

        const descricaoInput = document.getElementById('descricao').value.trim();
        const valorInput = parseFloat(document.getElementById('valor').value);
        const dataVencimentoInput = document.getElementById('dataVencimento').value;

        if (!tipoSelect.value || !categoriaSelect.value || !descricaoInput || isNaN(valorInput) || valorInput <= 0 || !dataVencimentoInput) {
            showFeedback('Por favor, preencha todos os campos corretamente: Tipo, Categoria, Descrição, Valor (maior que zero) e Data de Vencimento.', 'warning');
            return;
        }

        const novoLancamento = {
            id: generateId(),
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            descricao: descricaoInput,
            valor: valorInput,
            dataVencimento: dataVencimentoInput,
            dataPagamento: null,
            status: 'Pendente'
        };

        lancamentos.push(novoLancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

        showFeedback('Lançamento adicionado com sucesso!', 'success');
        formLancamento.reset();
        categoriaSelect.innerHTML = '<option value="">Selecione o tipo primeiro</option>';

        renderHistorico(mesFiltro.value);
        renderResumo();
    });

    // --- Lógica de Leitura de Código de Barras (se implementado) ---
    const codigoBarrasInput = document.getElementById('codigoBarras');
    if (codigoBarrasInput) { // Verifica se o campo existe no HTML
        codigoBarrasInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const codigoLido = codigoBarrasInput.value.trim();
                console.log('Código de barras lido:', codigoLido);

                // Exemplo de integração com produtos mock (substituir por API/backend real)
                const produtosMock = [
                    { codigo: '7891234567890', nome: 'Pacote de Arroz 5kg', preco: 25.50, categoria: 'Alimentação', tipo: 'despesa' },
                    { codigo: '9876543210987', nome: 'Livro "Dom Casmurro"', preco: 45.00, categoria: 'Educação', tipo: 'despesa' },
                    { codigo: '1122334455667', nome: 'Serviço de Manutenção - PC', preco: 150.00, categoria: 'Outras Despesas', tipo: 'despesa' },
                ];

                const produto = produtosMock.find(p => p.codigo === codigoLido);

                if (produto) {
                    document.getElementById('descricao').value = produto.nome;
                    document.getElementById('valor').value = produto.preco;
                    tipoSelect.value = produto.tipo;
                    loadCategories(categoriaSelect, produto.tipo, produto.categoria);
                    showFeedback(`Produto '${produto.nome}' encontrado e preenchido.`, 'info');
                } else {
                    document.getElementById('descricao').value = `Item Cód: ${codigoLido}`;
                    showFeedback('Código de barras não encontrado nos registros. Ajuste a descrição e outros campos.', 'warning');
                }
                codigoBarrasInput.value = ''; // Limpa o campo para a próxima leitura
                document.getElementById('descricao').focus(); // Move o foco para a descrição
            }
        });
    }

    // --- Lógica de Renderização da Tabela de Histórico ---

    function renderHistorico(filtroMes = null) {
        tabelaHistoricoBody.innerHTML = '';

        let lancamentosFiltrados = lancamentos;
        if (filtroMes) {
            lancamentosFiltrados = lancamentos.filter(lanc => {
                const dataVencimento = new Date(lanc.dataVencimento + 'T00:00:00');
                const [anoFiltro, mesFiltroNum] = filtroMes.split('-');
                return dataVencimento.getFullYear() === parseInt(anoFiltro) &&
                       (dataVencimento.getMonth() + 1) === parseInt(mesFiltroNum);
            });
        }

        lancamentosFiltrados.sort((a, b) => {
            const dateA = new Date(a.dataVencimento);
            const dateB = new Date(b.dataVencimento);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            if (a.status === 'Pendente' && b.status === 'Pago') return -1;
            if (a.status === 'Pago' && b.status === 'Pendente') return 1;
            return 0;
        });

        if (lancamentosFiltrados.length === 0) {
            tabelaHistoricoBody.innerHTML = '<tr><td colspan="9">Nenhum lançamento encontrado para este período.</td></tr>';
            return;
        }

        lancamentosFiltrados.forEach(lanc => {
            const row = tabelaHistoricoBody.insertRow();
            row.dataset.id = lanc.id;

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

    function renderResumo() {
        resumoContainer.innerHTML = '';
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth();

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

        const despesasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'despesa').forEach(lanc => {
            despesasPorCategoria[lanc.categoria] = (despesasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(despesasPorCategoria).length === 0) {
            detalhesDespesas.innerHTML = '<li>Nenhuma despesa registrada neste mês.</li>';
        } else {
            Object.entries(despesasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesDespesas.appendChild(li);
            });
        }

        const receitasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'receita').forEach(lanc => {
            receitasPorCategoria[lanc.categoria] = (receitasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(receitasPorCategoria).length === 0) {
            detalhesReceitas.innerHTML = '<li>Nenhuma receita registrada neste mês.</li>';
        } else {
            Object.entries(receitasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesReceitas.appendChild(li);
            });
        }

        const investimentosDoMes = lancamentosDoMes.filter(l => l.tipo === 'investimento');
        if (investimentosDoMes.length === 0) {
            detalhesInvestimentos.innerHTML = '<li>Nenhum investimento registrado neste mês.</li>';
        } else {
            investimentosDoMes.sort((a, b) => b.valor - a.valor).forEach(lanc => {
                const li = document.createElement('li');
                li.textContent = `${lanc.categoria} - ${lanc.descricao}: ${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesInvestimentos.appendChild(li);
            });
        }
    }

    // --- Lógica de Ações da Tabela (Editar, Excluir, Baixar) ---

    tabelaHistoricoBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (!id) return;

        if (target.classList.contains('editar')) {
            editLancamento(id);
        } else if (target.classList.contains('excluir')) {
            deleteLancamento(id);
        } else if (target.classList.contains('baixar')) {
            markAsPaid(id);
        }
    });

    function editLancamento(id) {
        const lancamentoToEdit = lancamentos.find(lanc => lanc.id === id);
        if (!lancamentoToEdit) {
            showFeedback('Lançamento não encontrado para edição.', 'error');
            return;
        }

        editId.value = lancamentoToEdit.id;
        editTipo.value = lancamentoToEdit.tipo;
        loadCategories(editCategoria, lancamentoToEdit.tipo, lancamentoToEdit.categoria);
        editDescricao.value = lancamentoToEdit.descricao;
        editValor.value = lancamentoToEdit.valor;
        editDataVencimento.value = lancamentoToEdit.dataVencimento;
        editStatus.value = lancamentoToEdit.status;

        editModal.style.display = 'flex';
    }

    formEditLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editId.value;
        const lancamentoIndex = lancamentos.findIndex(lanc => lanc.id === id);

        if (lancamentoIndex === -1) {
            showFeedback('Erro: Lançamento não encontrado para atualização.', 'error');
            return;
        }

        const editDescricaoInput = editDescricao.value.trim();
        const editValorInput = parseFloat(editValor.value);
        const editDataVencimentoInput = editDataVencimento.value;

        if (!editCategoria.value || !editDescricaoInput || isNaN(editValorInput) || editValorInput <= 0 || !editDataVencimentoInput) {
            showFeedback('Por favor, preencha todos os campos do formulário de edição corretamente.', 'warning');
            return;
        }

        const previousStatus = lancamentos[lancamentoIndex].status;

        lancamentos[lancamentoIndex].categoria = editCategoria.value;
        lancamentos[lancamentoIndex].descricao = editDescricaoInput;
        lancamentos[lancamentoIndex].valor = editValorInput;
        lancamentos[lancamentoIndex].dataVencimento = editDataVencimentoInput;
        lancamentos[lancamentoIndex].status = editStatus.value;

        if (lancamentos[lancamentoIndex].status === 'Pago' && !lancamentos[lancamentoIndex].dataPagamento) {
            lancamentos[lancamentoIndex].dataPagamento = new Date().toISOString().split('T')[0];
        } else if (lancamentos[lancamentoIndex].status === 'Pendente' && previousStatus === 'Pago') {
            lancamentos[lancamentoIndex].dataPagamento = null;
        }

        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
        showFeedback('Lançamento atualizado com sucesso!', 'success');
        editModal.style.display = 'none';

        renderHistorico(mesFiltro.value);
        renderResumo();
    });

    function deleteLancamento(id) {
        // Substituir o `confirm` por um modal customizado para melhor UX em mobile se necessário
        if (confirm('Tem certeza que deseja excluir este lançamento? Esta ação é irreversível.')) {
            lancamentos = lancamentos.filter(lanc => lanc.id !== id);
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            showFeedback('Lançamento excluído com sucesso!', 'success');
            renderHistorico(mesFiltro.value);
            renderResumo();
        }
    }

    function markAsPaid(id) {
        const lancamentoToMark = lancamentos.find(lanc => lanc.id === id);
        if (lancamentoToMark && lancamentoToMark.status === 'Pendente') {
            lancamentoToMark.status = 'Pago';
            lancamentoToMark.dataPagamento = new Date().toISOString().split('T')[0];
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            showFeedback('Lançamento baixado (pago) com sucesso!', 'success');
            renderHistorico(mesFiltro.value);
            renderResumo();
        } else if (lancamentoToMark && lancamentoToMark.status === 'Pago') {
            showFeedback('Este lançamento já está marcado como pago.', 'info');
        }
    }

    // --- Eventos de Navegação entre Seções ---

    btnLancamento.addEventListener('click', () => showSection(lancamentoSection));
    btnResumo.addEventListener('click', () => {
        showSection(resumoSection);
        renderResumo();
    });
    btnHistorico.addEventListener('click', () => {
        showSection(historicoSection);
        const hoje = new Date();
        const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
        mesFiltro.value = mesAtualFormatado;
        renderHistorico(mesAtualFormatado);
    });

    // --- Eventos de Filtro e Impressão do Histórico ---

    btnFiltrarHistorico.addEventListener('click', () => {
        renderHistorico(mesFiltro.value);
    });

    btnPrintHistorico.addEventListener('click', () => {
        const tabelaOriginal = document.getElementById('tabelaHistorico');
        const tabelaParaImprimir = tabelaOriginal.cloneNode(true);
        const headers = Array.from(tabelaParaImprimir.querySelectorAll('th'));
        const rows = Array.from(tabelaParaImprimir.querySelectorAll('tbody tr'));

        let acoesIndex = -1;
        headers.forEach((th, index) => {
            if (th.textContent.trim() === 'Ações') {
                acoesIndex = index;
            }
        });

        if (acoesIndex !== -1) {
            headers[acoesIndex].remove();
            rows.forEach(row => {
                if (row.cells[acoesIndex]) {
                    row.cells[acoesIndex].remove();
                }
            });
        }

        // Remover atributos data-label e estilos de responsividade mobile para impressão limpa
        tabelaParaImprimir.querySelectorAll('td[data-label], th, tr').forEach(el => {
            if (el.tagName === 'TD' && el.hasAttribute('data-label')) {
                el.removeAttribute('data-label');
                el.style.paddingLeft = '';
                el.style.textAlign = '';
            }
            el.style.display = '';
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.width = '';
            el.style.paddingRight = '';
            el.style.whiteSpace = '';
            el.style.overflow = '';
            el.style.textOverflow = '';
            el.style.marginBottom = '';
            el.style.border = '';
            el.style.borderRadius = '';
            el.style.backgroundColor = '';
            el.style.boxShadow = '';
            if (el.tagName === 'TD') {
                el.classList.add('no-pseudo'); // Adiciona uma classe para desativar o pseudoelemento via CSS
            }
        });
        if (tabelaParaImprimir.querySelector('thead')) {
            tabelaParaImprimir.querySelector('thead').style.display = '';
            tabelaParaImprimir.querySelector('thead tr').style.position = '';
        }


        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Planilha Financeira</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
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
        editModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // --- Inicialização da Aplicação ---
    const hoje = new Date();
    const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    mesFiltro.value = mesAtualFormatado;

    showSection(lancamentoSection);
    renderHistorico(mesAtualFormatado);
    renderResumo();
});